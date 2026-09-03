import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Cross2Icon } from "@radix-ui/react-icons";

import { WENDAO_APP_STORE_URL } from "./plans";

type CopyState = "idle" | "copied" | "error";

type AppStoreDownloadLinkProps = {
  language: "zh" | "en";
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
};

export function isIPhoneWeChatBrowser(userAgent = navigator.userAgent) {
  return /MicroMessenger/i.test(userAgent) && /iPhone/i.test(userAgent);
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy failed");
}

export default function AppStoreDownloadLink({
  language,
  className,
  children,
  onOpen,
}: AppStoreDownloadLinkProps) {
  const isZh = language === "zh";
  const [guideOpen, setGuideOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const closeGuide = () => {
    setGuideOpen(false);
    setCopyState("idle");
  };

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onOpen?.();
    if (!isIPhoneWeChatBrowser()) return;
    event.preventDefault();
    setCopyState("idle");
    setGuideOpen(true);
  };

  const handleCopy = async () => {
    try {
      await copyText(WENDAO_APP_STORE_URL);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const guide = guideOpen ? (
    <div
      className="wechat-browser-guide"
      role="dialog"
      aria-modal="true"
      aria-label={isZh ? "在默认浏览器中打开" : "Open in your default browser"}
    >
      <button className="wechat-browser-guide-backdrop" type="button" aria-label={isZh ? "关闭提示" : "Close guide"} onClick={closeGuide} />
      <div className="wechat-browser-guide-pointer" aria-hidden="true">
        <span>···</span>
        <i>↗</i>
      </div>
      <section className="wechat-browser-guide-panel">
        <button className="wechat-browser-guide-close" type="button" aria-label={isZh ? "关闭提示" : "Close guide"} onClick={closeGuide}>
          <Cross2Icon />
        </button>
        <small>WECHAT</small>
        <h2>{isZh ? "微信暂时无法直接打开 App Store" : "Open Wendao in your default browser"}</h2>
        <p>{isZh
          ? "请点击右上角 ···，选择“在默认浏览器中打开”，然后再次点击下载。"
          : "Tap ··· in the top-right, choose “Open in Default Browser,” then tap download again."}</p>
        <div className="wechat-browser-guide-actions">
          <button className="is-primary" type="button" onClick={closeGuide}>{isZh ? "知道了" : "Got it"}</button>
          <button className="is-secondary" type="button" onClick={() => void handleCopy()}>
            {isZh ? "复制 App Store 链接" : "Copy App Store link"}
          </button>
        </div>
        <p className="wechat-browser-guide-status" role="status" aria-live="polite">
          {copyState === "copied"
            ? (isZh ? "已复制，可粘贴到 Safari 打开" : "Copied — paste it into Safari to open")
            : copyState === "error"
              ? (isZh ? "复制失败，请长按链接复制" : "Could not copy. Press and hold the link instead.")
              : ""}
        </p>
      </section>
    </div>
  ) : null;

  return (
    <>
      <a className={className} href={WENDAO_APP_STORE_URL} target="_blank" rel="noreferrer" onClick={handleClick}>
        {children}
      </a>
      {guide && typeof document !== "undefined" ? createPortal(guide, document.body) : null}
    </>
  );
}
