// src/components/ui/sync-status-wrapper.tsx
"use client";

import dynamic from "next/dynamic";

// It is safe to use ssr: false inside a client component file
const SyncStatus = dynamic(() => import("~/components/ui/sync-status"), {
  ssr: false,
});

export default function SyncStatusWrapper() {
  return <SyncStatus />;
}
