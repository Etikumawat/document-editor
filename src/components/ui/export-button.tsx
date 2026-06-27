"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { type Editor } from "@tiptap/react";

interface ExportButtonProps {
  editor: Editor | null;
  title: string;
}

export default function ExportButton({ editor, title }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const exportMarkdown = () => {
    if (!editor) return;

    const html = editor.getHTML();
    let md = html
      .replace(/<h1>(.*?)<\/h1>/g, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/g, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/g, "### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "_$1_")
      .replace(/<code>(.*?)<\/code>/g, "`$1`")
      .replace(/<p>(.*?)<\/p>/g, "$1\n\n")
      .replace(/<li>(.*?)<\/li>/g, "- $1\n")
      .replace(/<blockquote>(.*?)<\/blockquote>/g, "> $1\n")
      .replace(/<[^>]*>/g, "")
      .trim();

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!editor) return;
    setLoading(true);

    try {
      const { default: jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = 20;
      const lineHeight = 7;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Helper to add new page if needed
      const checkNewPage = () => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Add title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, yPosition);
      yPosition += lineHeight * 2;

      // Add date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Exported on ${new Date().toLocaleDateString()}`,
        margin,
        yPosition,
      );
      yPosition += lineHeight * 1.5;
      pdf.setTextColor(0, 0, 0);

      // Draw separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      // Parse HTML content and render as text
      const html = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const elements = doc.body.children;

      for (const element of Array.from(elements)) {
        checkNewPage();
        const tag = element.tagName.toLowerCase();
        const text = element.textContent ?? "";

        if (!text.trim()) {
          yPosition += lineHeight * 0.5;
          continue;
        }

        if (tag === "h1") {
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          const lines = pdf.splitTextToSize(text, maxWidth) as string[];
          pdf.text(lines, margin, yPosition);
          yPosition += lineHeight * lines.length + 4;
        } else if (tag === "h2") {
          pdf.setFontSize(15);
          pdf.setFont("helvetica", "bold");
          const lines = pdf.splitTextToSize(text, maxWidth) as string[];
          pdf.text(lines, margin, yPosition);
          yPosition += lineHeight * lines.length + 3;
        } else if (tag === "h3") {
          pdf.setFontSize(13);
          pdf.setFont("helvetica", "bold");
          const lines = pdf.splitTextToSize(text, maxWidth) as string[];
          pdf.text(lines, margin, yPosition);
          yPosition += lineHeight * lines.length + 2;
        } else if (tag === "blockquote") {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(100, 100, 100);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition - 2, margin, yPosition + lineHeight);
          const lines = pdf.splitTextToSize(text, maxWidth - 8) as string[];
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lineHeight * lines.length + 2;
          pdf.setTextColor(0, 0, 0);
        } else if (tag === "ul" || tag === "ol") {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const items = element.querySelectorAll("li");
          items.forEach((item, index) => {
            checkNewPage();
            const bullet = tag === "ol" ? `${index + 1}.` : "•";
            const itemText = `${bullet} ${item.textContent ?? ""}`;
            const lines = pdf.splitTextToSize(
              itemText,
              maxWidth - 5,
            ) as string[];
            pdf.text(lines, margin + 3, yPosition);
            yPosition += lineHeight * lines.length;
          });
          yPosition += 2;
        } else if (tag === "pre" || tag === "code") {
          pdf.setFontSize(10);
          pdf.setFont("courier", "normal");
          pdf.setFillColor(245, 245, 245);
          const lines = pdf.splitTextToSize(text, maxWidth - 10) as string[];
          const blockHeight = lineHeight * lines.length + 6;
          pdf.rect(margin, yPosition - 4, maxWidth, blockHeight, "F");
          pdf.text(lines, margin + 5, yPosition);
          yPosition += blockHeight + 2;
          pdf.setFont("helvetica", "normal");
        } else {
          // Regular paragraph
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(text, maxWidth) as string[];
          pdf.text(lines, margin, yPosition);
          yPosition += lineHeight * lines.length + 2;
        }
      }

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `${title} — Page ${i} of ${totalPages}`,
          margin,
          pageHeight - 8,
        );
        pdf.text(
          "Generated by CollabDoc",
          pageWidth - margin - 35,
          pageHeight - 8,
        );
      }

      pdf.save(`${title}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
      alert("PDF export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={exportMarkdown}
        disabled={loading}
        title="Export as Markdown"
      >
        ⬇️ MD
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void exportPDF()}
        disabled={loading}
        title="Export as PDF"
      >
        {loading ? "⏳..." : "⬇️ PDF"}
      </Button>
    </div>
  );
}
