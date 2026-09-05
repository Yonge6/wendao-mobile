import { useEffect, useMemo, useRef, useState } from "react";
import {
  CopyIcon,
  DownloadIcon,
  ImageIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import type { Chapter } from "./data/chapters";
import { runtimeSurface, saveCardImage, shareCardImage, shareLink } from "./native";
import {
  buildCompanionShareCardContent,
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
  companionShare?: { answer: string } | null;
  onCreateManual: () => void;
  onAction?: (action: string, kind: ShareCardKind) => void;
};

export default function ShareCardPanel({
  chapter,
  language,
  manualText,
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
  const [feedback, setFeedback] = useState("");
  const [saveConfirming, setSaveConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const needsManual = !companionShare && kind === "manual" && !profileReady;
  const content = useMemo(
    () => companionShare
      ? buildCompanionShareCardContent(chapter, language, companionShare.answer)
      : buildShareCardContent(chapter, language, kind, manualText),
    [chapter, companionShare, kind, language, manualText],
  );
  const pinyinDescription = useMemo(() => (
    [...(content.primaryPinyin ?? []), ...(content.secondaryPinyin ?? [])]
      .map((line) => `${line.text} ${line.pinyin.join(" ")}`)
      .join(" ")
  ), [content.primaryPinyin, content.secondaryPinyin]);

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    setImageUrl("");
    if (needsManual) {
      setRendering(false);
      return;
    }
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
  }, [content, isZh, needsManual]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    previewScrollRef.current?.scrollTo({ top: 0 });
    setSaveConfirming(false);
  }, [chapter.id, kind, language]);

  const selectKind = (nextKind: ShareCardKind) => {
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
    setSaving(true);
    try {
      const outcome = await saveCardImage(
        imageUrl,
        content.filename,
        isZh ? "保存三慢问道分享卡" : "Save Wendao share card",
      );
      if (outcome !== "cancelled") {
        setFeedback(outcome === "saved"
          ? (isZh ? "已经保存到相册" : "Saved to Photos")
          : outcome === "downloaded"
            ? (isZh ? "图片已下载" : "Image downloaded")
            : outcome === "shared"
              ? (isZh ? "请在系统面板选择“存储图像”" : "Choose Save Image in the system sheet")
              : (isZh ? "保存失败，请检查相册权限后重试" : "Could not save. Check Photos access and try again."));
      }
      onAction?.(`save_${outcome}`, kind);
      if (outcome === "saved" || outcome === "downloaded" || outcome === "shared") {
        setSaveConfirming(false);
      }
    } finally {
      setSaving(false);
    }
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
      {!companionShare ? <div className="share-kind-tabs" role="tablist" aria-label={isZh ? "分享卡类型" : "Share card type"}>
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
            className="share-card-preview"
            aria-label={`${content.primary} ${pinyinDescription} ${content.secondaryLabel} ${content.secondary}`.trim()}
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
          </figure>}
        </div>

        <div className="share-card-controls">
          {needsManual ? (
            <button type="button" className="share-action-primary" onClick={onCreateManual}>
              {isZh ? "录入出生信息" : "Enter birth details"}
              <span aria-hidden="true">→</span>
            </button>
          ) : <>
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
            <button
              type="button"
              onClick={() => {
                setFeedback("");
                setSaveConfirming(true);
              }}
              disabled={!imageUrl || rendering}
            >
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
          {saveConfirming ? (
            <div className="share-save-confirmation" role="group" aria-label={isZh ? "确认保存图片" : "Confirm image save"}>
              <p>{isZh ? "确认保存这张图片？" : "Save this image now?"}</p>
              <div>
                <button type="button" onClick={() => setSaveConfirming(false)} disabled={saving}>
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button type="button" className="is-confirm" onClick={() => void saveImage()} disabled={saving}>
                  {saving
                    ? (isZh ? "正在保存…" : "Saving…")
                    : runtimeSurface() === "ios"
                      ? (isZh ? "保存到相册" : "Save to Photos")
                      : (isZh ? "下载图片" : "Download image")}
                </button>
              </div>
            </div>
          ) : null}
          {feedback ? <p className="share-action-feedback" aria-live="polite">{feedback}</p> : null}
          </>}
        </div>
      </div>
    </div>
  );
}
