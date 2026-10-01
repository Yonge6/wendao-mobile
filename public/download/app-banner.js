(() => {
  const key = 'wendao-app-banner-dismissed';
  try { if (sessionStorage.getItem(key) === '1') return; } catch { /* Storage can be unavailable. */ }
  const banner = document.createElement('aside');
  const english = document.documentElement.lang.startsWith('en');
  banner.className = 'app-download-banner';
  banner.setAttribute('aria-label', '下载三慢问道 App');
  banner.innerHTML = '<button class="app-download-banner-close" type="button" aria-label="关闭下载横幅"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button><img src="/assets/wendao/app-icon.png" width="48" height="48" alt=""><div class="app-download-banner-copy"><strong>三慢问道 · AI 道德经</strong><span>慢读经典，随时问道 · iPhone / iPad</span></div><a class="app-download-banner-action" target="_blank" rel="noreferrer" href="https://apps.apple.com/cn/app/%E4%B8%89%E6%85%A2%E9%97%AE%E9%81%93-ai-%E9%81%93%E5%BE%B7%E7%BB%8F/id6796945428">下载 App</a>';
  banner.querySelector('button').addEventListener('click', () => {
    try { sessionStorage.setItem(key, '1'); } catch { /* Keep dismissal for this page. */ }
    banner.remove();
    document.body.classList.remove('has-app-banner');
  });
  const download = banner.querySelector('a');
  if (english) {
    banner.setAttribute('aria-label', 'Download Wendao');
    banner.querySelector('button').setAttribute('aria-label', 'Dismiss download banner');
    banner.querySelector('strong').textContent = 'Wendao AI: Daodejing';
    banner.querySelector('.app-download-banner-copy span').textContent = 'Read, reflect, ask · iPhone / iPad';
    download.textContent = 'Get the app';
    download.href = 'https://apps.apple.com/us/app/wendao-ai-daodejing/id6796945428';
  }
  if (/MicroMessenger/i.test(navigator.userAgent) && /iPhone/i.test(navigator.userAgent)) {
    download.href = `/download.html?lang=${english ? 'en' : 'zh'}`;
    download.removeAttribute('target');
  }
  document.body.prepend(banner);
  document.body.classList.add('has-app-banner');
})();
