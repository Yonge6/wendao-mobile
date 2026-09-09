(() => {
  const params = new URLSearchParams(window.location.search);
  const isEnglish = params.get("lang") === "en";
  const inWeChat = /MicroMessenger/i.test(navigator.userAgent);
  const storeLink = document.getElementById("app-store-link");
  // Read the fixed destination from the real fallback link, never from query input.
  const storeUrl = isEnglish ? storeLink.dataset.enUrl : storeLink.href;
  storeLink.href = storeUrl;
  const copyButton = document.getElementById("copy-link");
  const feedback = document.getElementById("copy-feedback");
  const title = document.getElementById("download-title");
  const description = document.getElementById("download-description");
  const guide = document.getElementById("wechat-guide");
  const backLink = document.getElementById("back-to-reading");
  let feedbackTimer;

  document.documentElement.lang = isEnglish ? "en" : "zh-CN";
  document.title = isEnglish ? "Download Wendao AI" : "下载三慢问道 AI";
  storeLink.textContent = isEnglish ? "Open App Store" : "打开 App Store";
  copyButton.textContent = isEnglish ? "Copy App Store link" : "复制 App Store 链接";
  copyButton.hidden = false;
  backLink.textContent = isEnglish ? "Return to reading" : "返回阅读";
  const readingUrl = new URL("/", location.origin);
  readingUrl.searchParams.set("lang", isEnglish ? "en" : "zh");
  const chapter = params.get("chapter");
  if (chapter && /^(?:[1-9]|[1-7][0-9]|8[01])$/.test(chapter)) readingUrl.searchParams.set("chapter", chapter);
  backLink.href = readingUrl.href;

  function notify(message) {
    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedbackTimer = window.setTimeout(() => { feedback.textContent = ""; }, 3000);
  }

  async function copyStoreUrl() {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(storeUrl);
          notify(isEnglish ? "Link copied. Paste it into your browser." : "已复制，可粘贴到浏览器打开");
          return;
        } catch { /* Older WeChat versions can reject the modern clipboard API. */ }
      }
      const field = document.createElement("textarea");
      field.value = storeUrl;
      field.readOnly = true;
      field.style.cssText = "position:fixed;opacity:0;font-size:16px";
      document.body.appendChild(field);
      let copied = false;
      try {
        field.select();
        field.setSelectionRange(0, field.value.length);
        copied = document.execCommand("copy");
      } finally { field.remove(); }
      if (!copied) throw new Error("COPY_UNAVAILABLE");
      notify(isEnglish ? "Link copied. Paste it into your browser." : "已复制，可粘贴到浏览器打开");
    } catch {
      notify(isEnglish ? "Press and hold Open App Store to copy the link." : "请长按“打开 App Store”复制链接");
    }
  }
  copyButton.addEventListener("click", () => { void copyStoreUrl(); });

  if (inWeChat) {
    title.textContent = isEnglish ? "Continue in your browser" : "在浏览器中继续下载";
    description.textContent = isEnglish ? "Open this page outside WeChat to continue to the App Store." : "请先在默认浏览器中打开此页，即可前往 App Store。";
    guide.hidden = false;
    guide.setAttribute("aria-label", isEnglish ? "Open in your default browser" : "在默认浏览器中打开");
    document.getElementById("browser-pointer").hidden = false;
    document.getElementById("guide-menu").textContent = isEnglish ? "Tap ··· at the top right of WeChat" : "点击微信右上角 ···";
    document.getElementById("guide-browser").textContent = isEnglish ? "Choose Open in Default Browser" : "选择“在默认浏览器中打开”";
    document.getElementById("guide-result").textContent = isEnglish ? "Your browser will continue to the App Store automatically. No second download tap is needed." : "浏览器打开后，将自动前往 App Store，无需再次点击下载。";
    document.getElementById("fallback-note").textContent = isEnglish ? "Or copy the App Store link and paste it into your browser." : "也可以复制 App Store 链接，粘贴到浏览器打开。";
    // Keep the guide visible if WeChat blocks direct App Store navigation.
    storeLink.addEventListener("click", (event) => {
      event.preventDefault();
      notify(isEnglish ? "Use ··· to open this page in your browser." : "请点右上角 ···，在默认浏览器中打开");
    });
    return;
  }

  title.textContent = isEnglish ? "Opening the App Store" : "正在前往 App Store";
  description.textContent = isEnglish ? "Continue to Wendao AI on the App Store." : "即将打开三慢问道 AI 下载页。";
  document.getElementById("fallback-note").textContent = isEnglish ? "If nothing opens, tap Open App Store above." : "如未自动跳转，请点击上方按钮。";
  window.location.replace(storeUrl);
})();
