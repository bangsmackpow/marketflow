import { useState, useCallback } from "react";
import { Copy, Download, FileText, List, Type } from "lucide-react";
import Toast from "./Toast";

type Platform = "google-business" | "seo-brief" | "ad-copy" | "email" | "general";
type Format = "txt" | "md";

interface ExportToolbarProps {
  content: string;
  platform?: Platform;
}

const STRIP_MARKDOWN_REGEX = /(#{1,6}\s)|(\*\*)|(__)|(\*)|(_)|(`{1,3})|(\[.*?\]\(.*?\))|(!\[.*?\]\(.*?\))/g;

const PLATFORM_FORMATTERS: Record<Platform, (text: string) => string> = {
  "google-business": (text) => {
    return text
      .replace(STRIP_MARKDOWN_REGEX, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },
  "seo-brief": (text) => {
    const lines = text.split("\n").filter(Boolean);
    return lines
      .map((l) => l.replace(/^[-*]\s/, ""))
      .map((l, i) => `${i + 1}. ${l}`)
      .join("\n");
  },
  "ad-copy": (text) => {
    return text
      .replace(STRIP_MARKDOWN_REGEX, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n\n");
  },
  email: (text) => {
    return text
      .replace(/^#+\s/gm, "")
      .replace(/\*\*/g, "")
      .trim();
  },
  general: (text) => text,
};

export default function ExportToolbar({ content, platform = "general" }: ExportToolbarProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const formatted = PLATFORM_FORMATTERS[platform](content);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatted);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy");
    }
  }

  function handleDownload(format: Format) {
    const mimeType = format === "md" ? "text/markdown" : "text/plain";
    const ext = format === "md" ? "md" : "txt";
    const blob = new Blob([format === "md" ? content : formatted], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketflow-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded as .${ext}`);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
          Export
        </span>
        <div className="h-4 w-px" style={{ backgroundColor: "var(--clr-muted, #e9ecef)" }} />

        <button onClick={handleCopy} className="btn-ghost flex items-center gap-1.5 text-xs" title="Copy to clipboard">
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>

        <div className="relative group">
          <button className="btn-ghost flex items-center gap-1.5 text-xs" title="Download">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-[140px] rounded-lg border border-surface-200 bg-white py-1 shadow-lg group-hover:block">
            <button
              onClick={() => handleDownload("txt")}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-surface-700 hover:bg-surface-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Plain text (.txt)
            </button>
            <button
              onClick={() => handleDownload("md")}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-surface-700 hover:bg-surface-50"
            >
              <List className="h-3.5 w-3.5" />
              Markdown (.md)
            </button>
          </div>
        </div>

        {platform !== "general" && (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: "var(--clr-muted, #f1f3f5)",
              color: "var(--clr-muted-foreground, #868e96)",
            }}
          >
            {platform.replace("-", " ")}
          </span>
        )}
      </div>

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </>
  );
}
