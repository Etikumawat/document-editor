"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

interface DeleteDocumentButtonProps {
  documentId: string;
  documentTitle: string;
}

export default function DeleteDocumentButton({
  documentId,
  documentTitle,
}: DeleteDocumentButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Hard redirect — bypasses Next.js router completely
        window.location.href = "/dashboard";
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Failed to delete");
        setLoading(false);
        setShowConfirm(false);
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background w-96 rounded-lg border p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Delete Document?</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">
                &quot;{documentTitle}&quot;
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleDelete();
                }}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
