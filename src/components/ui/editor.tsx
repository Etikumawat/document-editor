"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { db } from "~/lib/db";
import { syncEngine } from "~/lib/sync-engine";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import AIToolbar from "~/components/ui/ai-toolbar";
const SyncStatus = dynamic(() => import("~/components/ui/sync-status"), {
  ssr: false,
});

interface EditorProps {
  documentId: string;
  initialContent: string;
  initialTitle: string;
  role: string;
  userName: string;
}

export default function Editor({
  documentId,
  initialContent,
  initialTitle,
  role,
  userName,
}: EditorProps) {
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("EDITOR");
  const [shareMsg, setShareMsg] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<
    { id: string; label: string; createdAt: string }[]
  >([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isViewer = role === "VIEWER";
  const handleShare = async () => {
    const res = await fetch(`/api/documents/${documentId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: shareEmail, role: shareRole }),
    });
    const data = (await res.json()) as { error?: string };
    if (res.ok) {
      setShareMsg("✅ Shared successfully!");
      setShareEmail("");
    } else {
      setShareMsg(`❌ ${data.error ?? "Failed"}`);
    }
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: initialContent || "",
    editable: !isViewer,
    onUpdate: ({ editor }) => {
      if (isViewer) return;
      // Debounce save — waits 1s after typing stops
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        void handleSave(editor.getHTML());
      }, 1000);
    },
  });

  // Load from IndexedDB first (local-first)
  useEffect(() => {
    const loadLocal = async () => {
      const local = await db.documents.get(documentId);
      if (local && local.updatedAt > Date.now() - 1000 * 60 * 60) {
        editor?.commands.setContent(local.content);
      }
    };
    void loadLocal();
    void loadVersions();
  }, [documentId, editor]);

  const handleSave = useCallback(
    async (content: string) => {
      setSaving(true);
      await syncEngine.queueOperation(documentId, "UPDATE", title, content);
      setSaving(false);
    },
    [documentId, title],
  );

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    const content = editor?.getHTML() ?? "";
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void handleSave(content);
    }, 1000);
  };

  const saveVersion = async () => {
    const content = editor?.getHTML() ?? "";
    const label = versionLabel || `Version ${new Date().toLocaleString()}`;
    await fetch("/api/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, content, label }),
    });
    setVersionLabel("");
    void loadVersions();
  };

  const loadVersions = async () => {
    const res = await fetch(`/api/versions?documentId=${documentId}`);
    const data = (await res.json()) as {
      id: string;
      label: string;
      createdAt: string;
    }[];
    setVersions(data);
  };

  const restoreVersion = (content: string) => {
    editor?.commands.setContent(content);
    void handleSave(content);
  };
  const Toolbar = () => (
    <div className="flex flex-wrap items-center gap-1 border-b px-6 py-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={editor?.isActive("bold") ? "bg-accent" : ""}
      >
        B
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={editor?.isActive("italic") ? "bg-accent" : ""}
      >
        <em>I</em>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        className={editor?.isActive("strike") ? "bg-accent" : ""}
      >
        <s>S</s>
      </Button>
      <div className="bg-border mx-1 h-4 w-px" />
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run()
        }
        className={editor?.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
      >
        H1
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        }
        className={editor?.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
      >
        H2
      </Button>
      <div className="bg-border mx-1 h-4 w-px" />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={editor?.isActive("bulletList") ? "bg-accent" : ""}
      >
        • List
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={editor?.isActive("orderedList") ? "bg-accent" : ""}
      >
        1. List
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        className={editor?.isActive("blockquote") ? "bg-accent" : ""}
      >
        " Quote
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().toggleCode().run()}
        className={editor?.isActive("code") ? "bg-accent" : ""}
      >
        Code
      </Button>
      <div className="bg-border mx-1 h-4 w-px" />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().undo().run()}
      >
        ↩ Undo
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor?.chain().focus().redo().run()}
      >
        ↪ Redo
      </Button>
    </div>
  );
  return (
    <div className="bg-background min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <input
            value={title}
            onChange={(e) => void handleTitleChange(e.target.value)}
            disabled={isViewer}
            className="border-none bg-transparent text-lg font-semibold outline-none"
            placeholder="Untitled Document"
          />
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-muted-foreground text-sm">Saving...</span>
          )}
          <SyncStatus />
          <Badge variant="outline">{role}</Badge>
          <span className="text-muted-foreground text-sm">{userName}</span>
          {!isViewer && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVersions(!showVersions)}
            >
              History
            </Button>
          )}
          {role === "OWNER" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowShare(!showShare)}
            >
              Share
            </Button>
          )}
        </div>
      </nav>
      {!isViewer && <Toolbar />}
      {!isViewer && <AIToolbar editor={editor} />}
      <div className="flex">
        {/* Editor */}
        <main className="mx-auto max-w-4xl flex-1 px-6 py-10">
          {isViewer && (
            <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              You are viewing this document in read-only mode.
            </div>
          )}
          <EditorContent
            editor={editor}
            className="prose prose-sm min-h-[500px] max-w-none focus:outline-none"
          />
        </main>
        {showShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background w-96 rounded-lg p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">Share Document</h3>
              <input
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address..."
                className="mb-3 w-full rounded border px-3 py-2 text-sm"
              />
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                className="mb-3 w-full rounded border px-3 py-2 text-sm"
              >
                <option value="EDITOR">Editor — can edit</option>
                <option value="VIEWER">Viewer — read only</option>
              </select>
              {shareMsg && <p className="mb-3 text-sm">{shareMsg}</p>}
              <div className="flex gap-2">
                <Button onClick={() => void handleShare()} className="flex-1">
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowShare(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Version History Sidebar */}
        {showVersions && (
          <aside className="min-h-screen w-72 border-l p-4">
            <h3 className="mb-4 font-semibold">Version History</h3>
            <div className="mb-4 flex gap-2">
              <input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Version label..."
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              <Button size="sm" onClick={() => void saveVersion()}>
                Save
              </Button>
            </div>
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="rounded border p-3 text-sm">
                  <p className="font-medium">{v.label}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(v.createdAt).toLocaleString()}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => void restoreVersion("")}
                  >
                    Restore
                  </Button>
                </div>
              ))}
              {versions.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No versions saved yet
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
      {/* Footer */}
      <footer className="text-muted-foreground bg-muted/5 border-t px-6 py-4 text-center text-xs">
        Built by{" "}
        <a
          href="https://github.com/Etikumawat/document-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline"
        >
          Eti Kumawat
        </a>{" "}
        ·{" "}
        <a
          href="https://www.linkedin.com/in/eti-kumawat-5502bb247/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline"
        >
          LinkedIn
        </a>
      </footer>
    </div>
  );
}
