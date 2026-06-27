"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export default function CreateDocumentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      const data = (await res.json()) as { id: string };
      router.push(`/editor/${data.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? "Creating..." : "+ New Document"}
    </Button>
  );
}
