/**
 * ManualPage.tsx — Renders the MoneyDrive driver manual inline.
 * Fetches the PDF from GitHub and renders all pages as <canvas> elements
 * using PDF.js loaded from CDN. No redirects, no browser PDF viewer.
 */

import { ArrowLeft, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PDF_URL =
  "https://github.com/youngstunners88/MoneyDrive-Manual/raw/main/MoneyDrive-Manual.pdf";
const PDFJS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";
const WORKER_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { url: string; withCredentials?: boolean }) => {
    promise: Promise<PdfDoc>;
  };
}

interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
}

interface PdfPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

// ─── Load PDF.js from CDN ─────────────────────────────────────────────────────

async function loadPdfJs(): Promise<PdfJsLib> {
  // Dynamic CDN import — Vite will not bundle this; typed via PdfJsLib cast below
  const lib = (await import(
    /* @vite-ignore */ PDFJS_CDN
  )) as unknown as PdfJsLib;
  lib.GlobalWorkerOptions.workerSrc = WORKER_CDN;
  return lib;
}

// ─── Single page canvas ───────────────────────────────────────────────────────

interface PageCanvasProps {
  page: PdfPage;
  containerWidth: number;
  pageNum: number;
}

function PageCanvas({ page, containerWidth, pageNum }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current || !canvasRef.current) return;
    renderedRef.current = true;

    const scale = containerWidth / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    page.render({ canvasContext: ctx, viewport }).promise.catch(() => {
      // Render error — canvas stays blank; user can retry via reload
    });
  }, [page, containerWidth]);

  return (
    <div className="relative mb-3 last:mb-0">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg shadow-md"
        aria-label={`Page ${pageNum}`}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManualPageProps {
  onBack?: () => void;
  onOpenNduna?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ManualPage({ onBack, onOpenNduna }: ManualPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Measure container width for responsive scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    obs.observe(el);
    setContainerWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPages([]);
    try {
      const pdfjsLib = await loadPdfJs();
      const doc = await pdfjsLib.getDocument({ url: PDF_URL }).promise;
      setNumPages(doc.numPages);
      const loadedPages: PdfPage[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        loadedPages.push(p);
      }
      setPages(loadedPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load manual");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  return (
    <div className="min-h-screen" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{ background: "#0A1628", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 shrink-0"
              style={{ color: "#D4AF37" }}
              data-ocid="manual.back.button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(232,82,10,0.2)" }}
              >
                <BookOpen className="w-4 h-4" style={{ color: "#E8520A" }} />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-white leading-none">
                  Driver Manual
                </h1>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {numPages > 0
                    ? `${numPages} pages`
                    : "MoneyDrive complete guide"}
                </p>
              </div>
            </div>
          </div>

          {/* Page count badge */}
          {numPages > 0 && (
            <span
              className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{
                background: "rgba(212,175,55,0.12)",
                color: "#D4AF37",
                border: "1px solid rgba(212,175,55,0.25)",
              }}
            >
              {pages.length} / {numPages}
            </span>
          )}

          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 shrink-0"
            style={{
              color: "#E8520A",
              borderColor: "rgba(232,82,10,0.4)",
              background: "rgba(232,82,10,0.08)",
            }}
            data-ocid="manual.open_pdf.button"
          >
            <ExternalLink className="w-3 h-3" />
            Open PDF
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-ocid="manual.loading_state"
          >
            <Loader2
              className="w-10 h-10 animate-spin"
              style={{ color: "#E8520A" }}
            />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading your manual...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-5 text-center"
            data-ocid="manual.error_state"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(232,82,10,0.15)" }}
            >
              <BookOpen className="w-8 h-8" style={{ color: "#E8520A" }} />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white mb-1">
                Couldn't load the manual
              </p>
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Check your connection and try again, 7.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadPdf}
                className="text-sm font-bold px-5 py-2 rounded-full transition-colors hover:opacity-90"
                style={{ background: "#E8520A", color: "#fff" }}
                data-ocid="manual.retry.button"
              >
                Try again
              </button>
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:opacity-80"
                style={{
                  color: "#E8520A",
                  borderColor: "rgba(232,82,10,0.4)",
                  background: "rgba(232,82,10,0.08)",
                }}
                data-ocid="manual.open_pdf_fallback.button"
              >
                <ExternalLink className="w-4 h-4" />
                Open PDF
              </a>
            </div>
          </div>
        )}

        {/* PDF pages container — always mounted so ResizeObserver can measure */}
        <div ref={containerRef} data-ocid="manual.content.panel">
          {!loading && !error && pages.length > 0 && containerWidth > 0 && (
            <div className="space-y-1">
              {pages.map((page, i) => (
                <PageCanvas
                  key={`page-${i + 1}`}
                  page={page}
                  containerWidth={containerWidth}
                  pageNum={i + 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Container for width measurement even during load */}
        {(loading || (!pages.length && !error)) && <div className="w-full" />}

        {/* Ask Nduna CTA */}
        {!loading && !error && onOpenNduna && (
          <div
            className="mt-10 rounded-2xl p-5 flex items-center gap-4 border"
            style={{
              background: "rgba(212,175,55,0.06)",
              borderColor: "rgba(212,175,55,0.2)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
              style={{ background: "rgba(232,82,10,0.2)" }}
            >
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">
                Still got questions?
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Ask Nduna — he knows MoneyDrive inside out.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNduna}
              className="shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors hover:opacity-90"
              style={{ background: "#E8520A", color: "#fff" }}
              data-ocid="manual.ask_nduna.button"
            >
              Ask Nduna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
