import React, { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
/** Web-only renderer: an iframe load is not evidence that the browser actually displayed the PDF. */
export default function OriginalPreview({
  uri,
  mime,
  onLoad,
  onError,
}: {
  uri: string;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}) {
  const { t } = useDiscovery();
  const canvas = useRef<HTMLCanvasElement | null>(null),
    callbacks = useRef({ onLoad, onError });
  useEffect(() => {
    callbacks.current = { onLoad, onError };
  }, [onLoad, onError]);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    if (mime !== "application/pdf") return;
    let alive = true,
      task:
        ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | undefined;
    void import("pdfjs-dist")
      .then((lib) => {
        if (!alive) return;
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = lib.getDocument({ url: uri, enableXfa: false });
        return task.promise;
      })
      .then((doc) => {
        if (alive && doc) {
          setPdf(doc);
          setPage(1);
        }
      })
      .catch(() => {
        if (alive) callbacks.current.onError();
      });
    return () => {
      alive = false;
      void task?.destroy();
    };
  }, [uri, mime]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let alive = true,
      render:
        | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
        | undefined;
    setBusy(true);
    void pdf
      .getPage(page)
      .then((p) => {
        if (!alive || !canvas.current) return;
        const el = canvas.current,
          width = Math.min(el.parentElement?.clientWidth || 346, 600),
          base = p.getViewport({ scale: 1 }),
          viewport = p.getViewport({ scale: width / base.width }),
          ratio = Math.min(window.devicePixelRatio || 1, 2);
        el.width = viewport.width * ratio;
        el.height = viewport.height * ratio;
        el.style.width = "100%";
        el.style.height = viewport.height + "px";
        const context = el.getContext("2d");
        if (!context) throw Error("CANVAS_UNAVAILABLE");
        render = p.render({
          canvas: el,
          canvasContext: context,
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        return render.promise;
      })
      .then(() => {
        if (alive) {
          setBusy(false);
          callbacks.current.onLoad();
        }
      })
      .catch((error) => {
        if (alive) {
          setBusy(false);
          callbacks.current.onError();
        }
      });
    return () => {
      alive = false;
      render?.cancel();
    };
  }, [pdf, page]);
  if (mime !== "application/pdf")
    return (
      <img
        src={uri}
        alt={t(
          "Original supplier document",
          "Оригинал документа",
          "Orijinal sənəd",
        )}
        onLoad={onLoad}
        onError={onError}
        style={{ width: "100%", objectFit: "contain" }}
      />
    );
  return (
    <div style={{ background: "#fff", minHeight: 240, width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 12,
          borderBottom: "1px solid " + colors.line,
          fontFamily: "Inter",
          gap: 10,
        }}
      >
        <button
          disabled={busy || page <= 1}
          onClick={() => setPage((n) => n - 1)}
          style={{ minHeight: 44, minWidth: 44 }}
          aria-label={t(
            "Previous page",
            "Предыдущая страница",
            "Əvvəlki səhifə",
          )}
        >
          ←
        </button>
        <span aria-live="polite">
          {pdf
            ? `${page} / ${pdf.numPages}`
            : t("Loading PDF…", "Загрузка PDF…", "PDF yüklənir…")}
        </span>
        <button
          disabled={busy || !pdf || page >= pdf.numPages}
          onClick={() => setPage((n) => n + 1)}
          style={{ minHeight: 44, minWidth: 44 }}
          aria-label={t("Next page", "Следующая страница", "Növbəti səhifə")}
        >
          →
        </button>
      </div>
      <canvas
        ref={canvas}
        role="img"
        aria-label={t(
          "Original PDF page",
          "Страница оригинального PDF",
          "Orijinal PDF səhifəsi",
        )}
      />
    </div>
  );
}
