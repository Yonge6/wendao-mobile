import { usageEvent } from "./productUsage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CopyIcon,
  DownloadIcon,
  ImageIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import type { Chapter } from "./data/chapters";
import { openPhotosSettings, saveCardImage, shareCardImage, shareLink } from "./native";
import ComicImage from "./ComicImage";
import { loadComicOriginalDataUrl } from "./comicMedia";
import { ComicMediaError, type ComicMediaFailure } from "./comicMediaCore";
import {
  buildCompanionShareCardContent,
  buildShareCardContent,
  renderShareCardDataUrl,
  SHARE_CARD_KINDS,
  shareKindLabel,
  type ShareCardContent,
  type ShareCardKind,
  type ShareLanguage,
} from "./shareCard";

type ShareCardPanelProps = {
  chapter: Chapter;
  language: ShareLanguage;
  manualText?: string;
  customContent?: ShareCardContent;
  profileReady: boolean;
  initialKind?: ShareCardKind;
  companionShare?: { answer: string } | null;
  onCreateManual: () => void;
  onAction?: (action: string, kind: ShareCardKind) => void;
};

export default function ShareCardPanel({
  chapter,
  language,
  manualText,
  customContent,
  profileReady,
  initialKind = "verse",
  companionShare,
  onCreateManual,
  onAction,
}: ShareCardPanelProps) {
  const isZh = language === "zh";
  const [kind, setKind] = useState<ShareCardKind>(initialKind);
  const [imageUrl, setImageUrl] = useState("");
  const [rendering, setRendering] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string } | null>(null);
  const showFeedback = useCallback((message: string) => {
    setFeedback(message ? { message } : null);
  }, []);
  const [imageAction, setImageAction] = useState<"save" | "share" | null>(null);
  const [transfer, setTransfer] = useState<{ action: "save" | "share"; failure?: ComicMediaFailure } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const originalRef = useRef("");
  const transferController = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [comicZoomed, setComicZoomed] = useState(false);
  const [wechatAction, setWechatAction] = useState<"save" | "share" | null>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const needsManual = !customContent && !companionShare && kind === "manual" && !profileReady;
  const content = useMemo(
    () => customContent ?? (companionShare
      ? buildCompanionShareCardContent(chapter, language, companionShare.answer)
      : buildShareCardContent(chapter, language, kind, manualText)),
    [chapter, companionShare, customContent, kind, language, manualText],
  );
  const pinyinDescription = useMemo(() => (
    [...(content.primaryPinyin ?? []), ...(content.secondaryPinyin ?? [])]
      .map((line) => `${line.text} ${line.pinyin.join(" ")}`)
      .join(" ")
  ), [content.primaryPinyin, content.secondaryPinyin]);

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    transferController.current?.abort();
    originalRef.current = "";
    setWechatAction(null);
    setTransfer(null);
    setImageAction(null);
    setPermissionDenied(false);
    setRendering(true);
    setImageUrl("");
    if (needsManual || content.imageSource) {
      setRendering(false);
      return () => { mounted.current = false; transferController.current?.abort(); };
    }
    void renderShareCardDataUrl(content)
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) showFeedback(isZh ? "图片生成失败，请稍后重试" : "Could not create the image. Try again.");
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
      transferController.current?.abort();
    };
  }, [content, isZh, needsManual, showFeedback, renderAttempt]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    previewScrollRef.current?.scrollTo({ top: 0 });
    setComicZoomed(false);
  }, [chapter.id, kind, language]);

  const selectKind = (nextKind: ShareCardKind) => {
    setKind(nextKind);
    setFeedback(null);
    onAction?.("card_type", nextKind);
  };

  const cancelTransfer = () => {
    transferController.current?.abort();
    transferController.current = null;
    setTransfer(null);
    setImageAction(null);
  };
  const performImageAction = async (action: "save" | "share") => {
    if ((!imageUrl && !content.imageSource) || rendering || imageAction) return;
    setFeedback(null);
    setPermissionDenied(false);
    setImageAction(action);
    const controller = new AbortController();
    transferController.current = controller;
    const stillCurrent = () => mounted.current && !controller.signal.aborted && transferController.current === controller;
    try {
      let png = imageUrl;
      if (content.imageSource) {
        png = originalRef.current;
        if (!png) {
          setTransfer({ action });
          png = await loadComicOriginalDataUrl(content.imageSource, controller.signal);
          if (!stillCurrent()) return;
          originalRef.current = png;
        }
      }
      if (!stillCurrent()) return;
      setTransfer(null);
      usageEvent(action === "save" ? "save_request" : "share_request", { chapter: chapter.id, section: kind });
      const outcome = action === "save"
        ? await saveCardImage(png, content.filename, isZh ? "保存三慢问道分享卡" : "Save Wendao share card")
        : await shareCardImage(png, content.filename, customContent ? content.chapterTitle : (isZh ? `三慢问道 · 第${chapter.id}章` : `Wendao · Chapter ${chapter.id}`));
      if (!stillCurrent()) return;
      usageEvent(action === "save" ? "save_result" : "share_result", { chapter: chapter.id, section: kind, result: outcome });
      if (outcome === "preview") {
        setWechatAction(action);
        onAction?.(action === "save" ? "save_preview" : "image_preview", kind);
        return;
      }
      if (outcome === "permission-denied") {
        setPermissionDenied(true);
        showFeedback(isZh ? "相册权限未开启，可在设置中允许保存图片。" : "Photos access is off. Allow saving images in Settings.");
      } else if (outcome === "activation-required") {
        showFeedback(isZh ? "原图已准备好，请再点一次“分享图片”。" : "The original is ready. Tap Share image again.");
      }
      if (outcome !== "cancelled") {
        if (outcome !== "permission-denied" && outcome !== "activation-required") showFeedback(outcome === "saved"
          ? (isZh ? "已保存到相册" : "Saved to Photos") : outcome === "downloaded"
            ? (isZh ? "已发起图片下载" : "Image download requested") : outcome === "shared"
              ? (action === "save" ? (isZh ? "请在系统面板选择“存储图像”" : "Choose Save Image in the system sheet") : (isZh ? "已打开系统分享" : "Share sheet opened"))
              : (isZh ? (action === "save" ? "图片保存失败，请重试。" : "暂时无法分享图片，请重试。") : (action === "save" ? "Could not save the image. Try again." : "Image sharing is unavailable. Try again.")));
      }
      onAction?.(`${action === "save" ? "save" : "image"}_${outcome}`, kind);
    } catch (error) {
      if (stillCurrent()) setTransfer({ action, failure: error instanceof ComicMediaError ? error.reason : "unavailable" });
    } finally {
      if (stillCurrent()) { transferController.current = null; setImageAction(null); }
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(content.shareText);
      usageEvent("copy_result", { chapter: chapter.id, result: "copied" });
      showFeedback(isZh ? "已复制文字" : "Text copied");
      onAction?.("text_copied", kind);
    } catch {
      showFeedback(isZh ? "暂时无法复制" : "Copying is unavailable");
      usageEvent("copy_result", { chapter: chapter.id, result: "unavailable" });
      onAction?.("text_unavailable", kind);
    }
  };

  const shareExactLink = async () => {
    const outcome = await shareLink(
      customContent ? content.chapterTitle : (isZh ? `三慢问道 · 第${chapter.id}章` : `Wendao · Chapter ${chapter.id}`),
      content.url,
    );
    if (outcome !== "cancelled") {
      showFeedback(outcome === "shared"
        ? (isZh ? "已打开系统分享" : "Share sheet opened")
        : outcome === "copied"
          ? (isZh ? (customContent ? "文章链接已复制" : "章节链接已复制") : (customContent ? "Article link copied" : "Chapter link copied"))
          : (isZh ? "暂时无法分享链接" : "Link sharing is unavailable"));
    }
    usageEvent("link_result", { chapter: chapter.id, result: outcome });
    onAction?.(`link_${outcome}`, kind);
  };

  const pngImageUrl = originalRef.current || imageUrl;
  if (wechatAction && pngImageUrl) return (
    <div className="share-card-panel wechat-image-panel">
      <div className="wechat-image-instructions" role="status">
        <strong>{wechatAction === "save"
          ? (isZh ? "长按下方图片，选择保存到相册" : "Press and hold the image to save it to Photos")
          : (isZh ? "长按下方图片，选择分享或发送" : "Press and hold the image, then choose Share or Send")}</strong>
        <p>{wechatAction === "save"
          ? (isZh ? "完整长图可向下滑动，保存操作由微信完成。" : "Scroll to view the full image. Finish saving in WeChat.")
          : (isZh ? "如果没有发送选项，可先保存，再从微信相册发送。" : "If Send is unavailable, save it first and send it from your photo library.")}</p>
        <button type="button" onClick={() => setWechatAction(null)}>{isZh ? "返回操作" : "Back to actions"}</button>
      </div>
      <div className="wechat-image-scroll" key={`${kind}-${wechatAction}`}>
        <img src={content.imageSource || pngImageUrl}
          alt={isZh ? `${content.label}完整图片，可长按保存或发送` : `${content.label} full image; press and hold to save or send`}
          onError={(event) => { if (event.currentTarget.src !== pngImageUrl) event.currentTarget.src = pngImageUrl; }} />
      </div>
    </div>
  );

  return (
    <div className={`share-card-panel${content.imageSource ? " has-comic" : ""}`}>
      <div className="share-feedback-layer" role="status" aria-live="polite" aria-atomic="true">
        {feedback ? <p className="share-action-feedback">{feedback.message}</p> : null}
      </div>
      {!customContent && !companionShare ? <div className="share-kind-tabs" role="tablist" aria-label={isZh ? "分享卡类型" : "Share card type"}>
        {SHARE_CARD_KINDS.map((option) => {
          return (
            <button
              type="button"
              role="tab"
              aria-selected={kind === option}
              className={kind === option ? "is-active" : ""}
              onClick={() => selectKind(option)}
              key={option}
            >
              {shareKindLabel(option, language)}
            </button>
          );
        })}
      </div> : null}

      {content.imageSource ? <button type="button" className="comic-zoom-toggle" aria-pressed={comicZoomed}
        onClick={() => setComicZoomed(value => !value)}>
        {comicZoomed ? (isZh ? "适合屏幕" : "Fit to screen") : (isZh ? "放大阅读" : "Enlarge comic")}
        <span>{comicZoomed ? (isZh ? "可左右滑动看细节" : "Scroll sideways for details") : (isZh ? "完整长图 · 向下阅读" : "Full comic · Scroll to read")}</span>
      </button> : null}
      <div className="share-card-workspace">
        <div className="share-card-preview-scroll" ref={previewScrollRef} data-testid="share-card-preview-scroll">
          {needsManual ? (
            <section className="share-manual-intro" aria-labelledby="share-manual-title">
              <span className="drawer-kicker">{isZh ? "认识自己 · 多一种视角" : "Another lens on yourself"}</span>
              <h3 id="share-manual-title">{isZh ? "让这一章，也与你有关" : "See this chapter in your own life"}</h3>
              <p>{isZh
                ? "录入出生日期、时间和地点后，你可以生成人生说明书。它会结合人类图的反思视角与本章《道德经》，帮助你观察自己的做事节奏、选择方式和相处习惯，把阅读带回真实生活。"
                : "Enter your birth date, time and place to create a life manual. It brings a Human Design reflection lens to this chapter, helping you explore your pace, decisions and relationships—and bring your reading into daily life."}</p>
              <p className="share-manual-caveat">{isZh
                ? "这是一份自我探索的参考，不是科学结论，也不替你定义人生。生成后，可在这里分享匿名说明书卡，不包含姓名和出生资料。"
                : "This is a tool for self-exploration, not a scientific conclusion or a definition of who you are. Once created, you can share an anonymous card here without your name or birth details."}</p>
            </section>
          ) : <figure
            className={`share-card-preview${comicZoomed ? " is-comic-zoomed" : ""}`}
            aria-label={`${content.primary} ${pinyinDescription} ${content.secondaryLabel} ${content.secondary}`.trim()}
          >
            {content.previewImageSource ? <ComicImage src={content.previewImageSource} width={content.previewWidth} height={content.previewHeight} alt={isZh ? `${content.label}漫画预览` : `${content.label} comic preview`} language={language} /> : imageUrl ? (
              <img
                src={imageUrl}
                alt={isZh ? `${content.label}分享卡预览` : `${content.label} share-card preview`}
              />
            ) : (
              <div className="share-card-rendering" role="status">
                <span aria-hidden="true" />
                {rendering
                  ? (isZh ? "正在生成阅读卡" : "Creating your reading card")
                  : (isZh ? "等待重新生成" : "Waiting to retry")}
                {!rendering ? <button type="button" onClick={() => setRenderAttempt(value => value + 1)}>{isZh ? "重新生成" : "Retry image"}</button> : null}
              </div>
            )}
          </figure>}
        </div>

        <div className="share-card-controls">
          {transfer ? <div className={`share-download-state${transfer.failure ? " is-error" : ""}`} role="status" aria-live="polite">
            <p>{!transfer.failure ? (isZh ? "正在准备完整原图，可继续阅读…" : "Preparing the complete original. You can keep reading…")
              : transfer.failure === "offline" ? (isZh ? "当前离线，保存和分享原图需要联网。" : "You are offline. Connect to save or share the original.")
                : transfer.failure === "timeout" ? (isZh ? "原图下载较慢，已停止等待，请重试。" : "The original took too long to download. Try again.")
                  : (isZh ? "原图暂时未能下载，请重试。" : "The original could not download. Try again.")}</p>
            {transfer.failure ? <button type="button" onClick={() => void performImageAction(transfer.action)}>{isZh ? "重试" : "Retry"}</button>
              : <button type="button" onClick={cancelTransfer}>{isZh ? "取消下载" : "Cancel download"}</button>}
          </div> : null}
          {permissionDenied ? <div className="share-permission-repair"><button type="button" onClick={() => void openPhotosSettings().then(opened => {
            if (!opened) showFeedback(isZh ? "请打开系统设置，允许三慢问道添加照片。" : "Open system Settings and allow Wendao to add photos.");
          })}>{isZh ? "打开相册权限设置" : "Open Photos settings"}</button></div> : null}
          {needsManual ? (
            <button type="button" className="share-action-primary" onClick={onCreateManual}>
              {isZh ? "录入出生信息" : "Enter birth details"}
              <span aria-hidden="true">→</span>
            </button>
          ) : <>
          <button
            type="button"
            className="share-action-primary"
            onClick={() => void performImageAction("share")}
            disabled={(!imageUrl && !content.imageSource) || rendering || !!imageAction}
          >
            <ImageIcon />
            {imageAction === "share" ? (isZh ? "正在准备…" : "Preparing…") : (isZh ? "分享图片" : "Share image")}
          </button>
          <div className="share-action-grid">
            <button
              type="button"
              onClick={() => void performImageAction("save")}
              disabled={(!imageUrl && !content.imageSource) || rendering || !!imageAction}
              aria-busy={imageAction === "save"}
            >
              <DownloadIcon />
              {imageAction === "save" ? (isZh ? "正在保存…" : "Saving…") : (isZh ? "保存图片" : "Save image")}
            </button>
            <button type="button" onClick={() => void copyText()}>
              <CopyIcon />
              {isZh ? "复制文字" : "Copy text"}
            </button>
            <button type="button" onClick={() => void shareExactLink()} data-share-link={content.url}>
              <Link2Icon />
              {isZh ? "分享链接" : "Share link"}
            </button>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
}
