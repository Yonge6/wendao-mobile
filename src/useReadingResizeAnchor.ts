import { useEffect } from "react";

/** Preserve the passage at the reading edge when the pane reflows. */
export function useReadingResizeAnchor() {
  useEffect(() => {
    const scroll = document.querySelector<HTMLElement>("[data-testid='mobile-scroll']");
    const header = document.querySelector<HTMLElement>(".reading-header-fixed");
    if (!scroll || !header) return;
    let width = scroll.clientWidth;
    let anchor: { element: HTMLElement; offset: number } | null = null;
    let atTop = true;
    const capture = () => {
      atTop = scroll.scrollTop < 1;
      const edge = header.getBoundingClientRect().bottom + 12;
      const elements = scroll.querySelectorAll<HTMLElement>(".chapter p, .chapter h1, .chapter h2, .chapter h3");
      const element = Array.from(elements).find((item) => item.getBoundingClientRect().bottom > edge);
      anchor = element ? { element, offset: element.getBoundingClientRect().top - edge } : null;
    };
    const onScroll = () => {
      // A resize can emit scroll before ResizeObserver restores the old passage.
      if (scroll.clientWidth === width) capture();
    };
    const observer = new ResizeObserver(() => {
      if (scroll.clientWidth === width) return;
      width = scroll.clientWidth;
      if (atTop) scroll.scrollTop = 0;
      else if (anchor?.element.isConnected) {
        const edge = header.getBoundingClientRect().bottom + 12;
        scroll.scrollTop += anchor.element.getBoundingClientRect().top - edge - anchor.offset;
      }
      capture();
    });
    capture();
    scroll.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(scroll);
    return () => { observer.disconnect(); scroll.removeEventListener("scroll", onScroll); };
  }, []);
}
