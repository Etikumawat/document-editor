"use client";

import { useEffect, useState } from "react";
import { syncEngine } from "~/lib/sync-engine";
import { Badge } from "~/components/ui/badge";

export default function SyncStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "syncing">(
    "online",
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = syncEngine.onStatusChange((s, count) => {
      setStatus(s);
      setPendingCount(count);
    });
    return unsub;
  }, []);

  if (status === "offline") {
    return (
      <Badge variant="destructive">
        ● Offline {pendingCount > 0 ? `· ${pendingCount} pending` : ""}
      </Badge>
    );
  }

  if (status === "syncing") {
    return <Badge variant="secondary">⟳ Syncing...</Badge>;
  }

  return (
    <Badge variant="outline" className="border-green-600 text-green-600">
      ✓ Synced
    </Badge>
  );
}
