import { useEffect, useMemo, useState } from "react";
import {
  CopyIcon,
  DownloadIcon,
  ImageIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import type { Chapter } from "./data/chapters";
import { saveCardImage, shareCardImage, shareLink } from "./native";
import {
  buildShareCardContent,
  renderShareCardDataUrl,
  SHARE_CARD_KINDS,
  shareKindLabel,
  type ShareCardKind,
  type ShareLanguage,
} from "./shareCard";

type ShareCardPanelProps = {
  chapter: Chapter;
  language: ShareLanguage;
  manualText?: string;
  profileReady: boolean;
  initialKind?: ShareCardKind;
  onAction?: (action: string, kind: ShareCardKind) => void;
};

export default function ShareCardPanel({
  chapter,
  language,
  manualText,
  profileReady,
  initialKind = "verse",
  onAction,
}: ShareCardPanelProps) {
  const isZh = language === "zh";
  const [kind, setKind] = useState<ShareCardKind>(initialKind);
  const [imageUrl, setImageUrl] = useState("");
  const [rendering, setRendering] = useState(true);
  const [feedback, setFeedback] = useState("");
  const content = useMemo(
    () => buildShareCardContent(chapter, language, kind, manualText),
    [chapter, kind, language, manualText],
  );

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    setImageUrl("");
    void renderShareCardDataUrl(content)
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFeedback(isZh ? "图片生成失败，请稍后重试" : "Could not create the image. Try again.");
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [content, isZh]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const selectKind = (nextKind: ShareCardKind) => {
    if (nextKind === "manual" && !profileReady) return;
    setKind(nextKind);
    setFeedback("");
    onAction?.("card_type", nextKind);
  };

  const shareImage = async () => {
    if (!imageUrl) return;
    const outcome = await shareCardImage(
      imageUrl,
      content.filename,
      isZh ? `三慢问道 · 第${chapter.id}章` : `Wendao · Chapter ${chapter.id}`,
      content.shareText,
      content.url,
    );
    if (outcome !== "cancelled") {
      setFeedback(outcome === "shared"
        ? (isZh ? "已打开系统分享" : "Share sheet opened")
        : outcome === "downloaded"
          ? (isZh ? "当前浏览器已保存图片" : "Image saved by your browser")
          : (isZh ? "暂时无法分享图片" : "Image sharing is unavailable"));
    }
    onAction?.(`image_${outcome}`, kind);
  };

  const saveImage = async () => {
    if (!imageUrl) return;
    const outcome = await saveCardImage(
      imageUrl,
      content.filename,
      isZh ? "保存三慢问道分享卡" : "Save Wendao share card",
    );
    if (outcome !== "cancelled") {
      setFeedback(outcome === "downloaded"
        ? (isZh ? "图片已保存" : "Image saved")
        : outcome === "shared"
          ? (isZh ? "请在系统面板选择“存储图像”" : "Choose Save Image in the system sheet")
          : (isZh ? "暂时无法保存" : "Saving is unavailable"));
    }
    onAction?.(`save_${outcome}`, kind);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(content.shareText);
      setFeedback(isZh ? "分享文字已复制" : "Share text copied");
      onAction?.("text_copied", kind);
    } catch {
      setFeedback(isZh ? "暂时无法复制" : "Copying is unavailable");
      onAction?.("text_unavailable", kind);
    }
  };

  const shareExactLink = async () => {
    const outcome = await shareLink(
      isZh ? `三慢问道 · 第${chapter.id}章` : `Wendao · Chapter ${chapter.id}`,
      isZh ? "读一章《道德经》，照见此刻的自己。" : "Read one chapter. Meet yourself anew.",
      content.url,
    );
    if (outcome !== "cancelled") {
      setFeedback(outcome === "shared"
        ? (isZh ? "已打开系统分享" : "Share sheet opened")
        : outcome === "copied"
          ? (isZh ? "章节链接已复制" : "Chapter link copied")
          : (isZh ? "暂时无法分享链接" : "Link sharing is unavailable"));
    }
    onAction?.(`link_${outcome}`, kind);
  };

  return (
    <div className="share-card-panel">
      <div className="share-kind-tabs" role="tablist" aria-label={isZh ? "分享卡类型" : "Share card type"}>
        {SHARE_CARD_KINDS.map((option) => {
          const disabled = option === "manual" && !profileReady;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={kind === option}
              aria-disabled={disabled}
              className={kind === option ? "is-active" : ""}
              disabled={disabled}
              onClick={() => selectKind(option)}
              key={option}
            >
              {shareKindLabel(option, language)}
            </button>
          );
        })}
      </div>

      {!profileReady ? (
        <p className="share-manual-note">
          {isZh ? "生成真实人生说明书后，可分享匿名说明书卡。" : "Create a verified life manual to share an anonymous manual card."}
        </p>
      ) : null}

      <div className="share-card-workspace">
        <figure
          className="share-card-preview"
          aria-label={`${content.primary} ${content.secondaryLabel} ${content.secondary}`}
        >
          {imageUrl ? (
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
            </div>
          )}
        </figure>

        <div className="share-card-controls">
          <div className="share-card-summary">
            <span>{content.chapterLabel}</span>
            <strong>{isZh ? `${content.label}卡` : `${content.label} card`}</strong>
          </div>

          <button
            type="button"
            className="share-action-primary"
            onClick={() => void shareImage()}
            disabled={!imageUrl || rendering}
          >
            <ImageIcon />
            {isZh ? "分享图片" : "Share image"}
          </button>
          <div className="share-action-grid">
            <button type="button" onClick={() => void saveImage()} disabled={!imageUrl || rendering}>
              <DownloadIcon />
              {isZh ? "保存图片" : "Save image"}
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
          <p className="share-action-feedback" aria-live="polite">{feedback}</p>
        </div>
      </div>
    </div>
  );
}
