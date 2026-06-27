"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { type Editor } from "@tiptap/react";

interface AIToolbarProps {
  editor: Editor | null;
}

const actions = [
  { key: "fix", label: "✏️ Fix Grammar" },
  { key: "summarize", label: "📝 Summarize" },
  { key: "expand", label: "📖 Expand" },
  { key: "shorter", label: "✂️ Make Shorter" },
  { key: "professional", label: "💼 Professional" },
];

export default function AIToolbar({ editor }: AIToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (!editor) return;

    setError(null);
    const selection = editor.state.selection;
    const hasSelection = !selection.empty;
    const from = selection.from;
    const to = selection.to;

    const text = hasSelection
      ? editor.state.doc.textBetween(from, to, " ")
      : editor.getText();

    if (!text.trim()) {
      alert("Please type or select some text first!");
      return;
    }

    setLoading(action);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action }),
      });

      const data = (await res.json()) as { result?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (!data.result?.trim()) {
        setError("AI returned empty response");
        return;
      }

      const aiText = data.result.trim();

      if (hasSelection) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, aiText)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContentAt(editor.state.doc.content.size, `\n${aiText}`)
          .run();
      }
    } catch (e) {
      console.error(e);
      setError(`Network error: ${String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border-b bg-purple-50 px-6 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-purple-600">✨ AI</span>
        {actions.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant="ghost"
            disabled={loading !== null}
            onClick={() => void handleAction(action.key)}
            className="text-xs text-purple-700 hover:bg-purple-100"
          >
            {loading === action.key ? "⏳ Working..." : action.label}
          </Button>
        ))}
        <span className="text-muted-foreground ml-2 text-xs">
          Select text first or applies to whole document
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">❌ {error}</p>}
    </div>
  );
}
