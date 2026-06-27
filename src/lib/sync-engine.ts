import { db } from "./db";

type SyncStatus = "online" | "offline" | "syncing";
type StatusListener = (status: SyncStatus, pendingCount: number) => void;

class SyncEngine {
  private listeners: StatusListener[] = [];
  private status: SyncStatus = "online";
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
      if (!navigator.onLine) this.status = "offline";
    }
  }

  private handleOnline() {
    this.setStatus("online", 0);
    void this.flush();
  }

  private handleOffline() {
    this.setStatus("offline", 0);
  }

  private setStatus(status: SyncStatus, pendingCount: number) {
    this.status = status;
    this.listeners.forEach((l) => l(status, pendingCount));
  }

  onStatusChange(listener: StatusListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  isOnline() {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  async queueOperation(
    documentId: string,
    type: "UPDATE" | "CREATE",
    title: string,
    content: string,
  ) {
    await db.documents.put({
      id: documentId,
      title,
      content,
      updatedAt: Date.now(),
      syncedAt: null,
      isSynced: false,
    });

    await db.pendingOps.add({
      documentId,
      type,
      content,
      title,
      timestamp: Date.now(),
    });

    const pendingCount = await db.pendingOps.count();
    this.setStatus(this.isOnline() ? "online" : "offline", pendingCount);

    if (this.isOnline()) {
      void this.flush();
    }
  }

  async flush(retryCount = 0): Promise<void> {
    const pendingOps = await db.pendingOps.toArray();
    if (pendingOps.length === 0) {
      this.setStatus("online", 0);
      return;
    }

    this.setStatus("syncing", pendingOps.length);

    for (const op of pendingOps) {
      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: op.documentId,
            type: op.type,
            content: op.content,
            title: op.title,
            timestamp: op.timestamp,
          }),
        });

        if (res.ok) {
          if (op.id !== undefined) await db.pendingOps.delete(op.id);
          await db.documents.update(op.documentId, {
            isSynced: true,
            syncedAt: Date.now(),
          });
        } else if (res.status === 413) {
          if (op.id !== undefined) await db.pendingOps.delete(op.id);
        }
      } catch {
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        this.retryTimeout = setTimeout(
          () => void this.flush(retryCount + 1),
          delay,
        );
        return;
      }
    }

    const remaining = await db.pendingOps.count();
    this.setStatus("online", remaining);
  }
}

export const syncEngine = new SyncEngine();
