import { useEffect, useRef, useState } from "react";
import { invalidateComicPreview, loadComicPreview } from "./comicMedia";
import { ComicMediaError, type ComicMediaFailure } from "./comicMediaCore";

export default function ComicImage({ src, alt, width, height, language, lazy = false, onOpen, openLabel }: {
  src: string; alt: string; width?: number; height?: number; language: "zh" | "en"; lazy?: boolean; onOpen?: () => void; openLabel?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);
  const [attempt, setAttempt] = useState(0);
  const refreshSource = useRef("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | ComicMediaFailure>("loading");
  const isZh = language === "zh";
  useEffect(() => {
    if (visible || !container.current) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let objectUrl = "";
    const refresh = refreshSource.current === src;
    refreshSource.current = "";
    setUrl("");
    setStatus("loading");
    void loadComicPreview(src, controller.signal, { refresh }).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(error => {
      if (!controller.signal.aborted) setStatus(error instanceof ComicMediaError ? error.reason : "unavailable");
    });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, visible, attempt]);
  const image = url ? <img className="comic-media-image" src={url} width={width} height={height} alt={alt}
    decoding="async" draggable={false} onLoad={() => setStatus("ready")} onError={() => {
      // A valid RIFF header can still contain truncated/undecodable pixels. Never retry that cached blob.
      void invalidateComicPreview(src);
      setStatus(navigator.onLine ? "invalid" : "offline");
    }} /> : null;
  const failed = status !== "ready" && status !== "loading";
  const aspectRatio = width && height && !failed ? `${width} / ${height}` : undefined;
  return <div className={`comic-media${failed ? " is-error" : ""}${status === "loading" ? " is-loading" : ""}${aspectRatio ? " has-intrinsic-size" : ""}${status === "offline" ? " is-offline" : ""}`} ref={container} aria-busy={status === "loading"} style={{ aspectRatio }}>
    {image && (onOpen ? <button type="button" className="life-story-comic-open" onClick={onOpen} aria-label={openLabel ?? (isZh ? "放大阅读漫画" : "Read comic in detail")}>{image}</button> : image)}
    {status !== "ready" ? <div className="comic-media-state" role="status">
      <p>{status === "loading" ? (isZh ? "正在载入漫画…" : "Loading the comic…")
        : status === "offline" ? (isZh ? "这幅漫画尚未缓存，联网后可以继续看。正文和解读仍可阅读。" : "This comic is not cached yet. Reconnect to view it; the text and reflection are still available.")
          : status === "timeout" ? (isZh ? "漫画载入较慢，请重试。" : "The comic took too long to load. Try again.")
            : (isZh ? "漫画暂时未能载入，文字解读仍可阅读。" : "The comic could not load. You can still read its reflection.")}</p>
      {status !== "loading" ? <div className="comic-media-actions"><button type="button" onClick={() => { refreshSource.current = src; setAttempt(value => value + 1); }}>{isZh ? "重新载入" : "Retry image"}</button></div> : null}
    </div> : null}
  </div>;
}
