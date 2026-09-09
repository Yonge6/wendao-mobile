import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";

import { getWendaoAppStoreUrl } from "./plans";

type AppStoreDownloadLinkProps = {
  language: "zh" | "en";
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
};

export function isIPhoneWeChatBrowser(userAgent = navigator.userAgent) {
  return /MicroMessenger/i.test(userAgent) && /iPhone/i.test(userAgent);
}

export default function AppStoreDownloadLink({
  language,
  className,
  children,
  onOpen,
}: AppStoreDownloadLinkProps) {
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onOpen?.();
    if (!isIPhoneWeChatBrowser()) return;
    event.preventDefault();
    const destination = new URL("/download.html", window.location.origin);
    destination.searchParams.set("lang", language);
    const chapter = new URL(window.location.href).searchParams.get("chapter");
    if (chapter && /^(?:[1-9]|[1-7][0-9]|8[01])$/.test(chapter)) {
      destination.searchParams.set("chapter", chapter);
    }
    // Navigate for real so WeChat hands this download URL to the external browser.
    window.location.assign(destination.href);
  };

  return (
    <a className={className} href={getWendaoAppStoreUrl(language)} target="_blank" rel="noreferrer" onClick={handleClick}>
      {children}
    </a>
  );
}
