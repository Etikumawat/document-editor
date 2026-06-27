import Dexie, { type Table } from "dexie";

export interface LocalDocument {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  syncedAt: number | null;
  isSynced: boolean;
}

export interface PendingOperation {
  id?: number;
  documentId: string;
  type: "UPDATE" | "CREATE";
  content: string;
  title: string;
  timestamp: number;
}

export interface LocalVersion {
  id?: number;
  documentId: string;
  content: string;
  label: string;
  createdAt: number;
}

class DocumentDB extends Dexie {
  documents!: Table<LocalDocument>;
  pendingOps!: Table<PendingOperation>;
  versions!: Table<LocalVersion>;

  constructor() {
    super("CollabDocDB");
    this.version(1).stores({
      documents: "id, title, updatedAt, isSynced",
      pendingOps: "++id, documentId, timestamp",
      versions: "++id, documentId, createdAt",
    });
  }
}

export const db = new DocumentDB();
