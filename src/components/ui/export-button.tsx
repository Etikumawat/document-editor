"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { type Editor } from "@tiptap/react";
import { FileText, FileType, Loader2 } from "lucide-react";

interface ExportButtonProps {
  editor: Editor | null;
  title: string;
}

export default function ExportButton({ editor, title }: ExportButtonProps) {
  const [loading, setLoading] = useState<"word" | "pdf" | null>(null);

  const exportWord = () => {
    if (!editor) return;
    setLoading("word");

    try {
      const html = editor.getHTML();

      const docHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
            h1 { font-size: 20pt; font-weight: bold; margin-bottom: 8pt; }
            h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
            h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin: 0 0 10pt 0; }
            blockquote { color: #595959; font-style: italic; border-left: 3px solid #ccc; padding-left: 10pt; margin-left: 0; }
            code, pre { font-family: 'Courier New', monospace; background: #f5f5f5; }
            .date { color: #808080; font-style: italic; margin-bottom: 16pt; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="date">Exported on ${new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}</p>
          ${html}
        </body>
        </html>
      `;

      const blob = new Blob(["\ufeff", docHtml], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Word export error:", e);
      alert("Word export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const exportPDF = async () => {
    if (!editor) return;
    setLoading("pdf");

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

      const checkNewPage = () => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, yPosition);
      yPosition += lineHeight * 2;

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

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

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
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(text, maxWidth) as string[];
          pdf.text(lines, margin, yPosition);
          yPosition += lineHeight * lines.length + 2;
        }
      }

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
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={exportWord}
        disabled={loading !== null}
        title="Export as Word document"
      >
        {loading === "word" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        <span className="ml-1.5">DOCX</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void exportPDF()}
        disabled={loading !== null}
        title="Export as PDF"
      >
        {loading === "pdf" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileType className="h-3.5 w-3.5" />
        )}
        <span className="ml-1.5">PDF</span>
      </Button>
    </div>
  );
}
