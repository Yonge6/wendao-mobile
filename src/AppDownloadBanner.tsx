import AppStoreDownloadLink from './companion/AppStoreDownloadLink';

export default function AppDownloadBanner({ language, onClose }: { language: 'zh' | 'en'; onClose: () => void }) {
  const isZh = language === 'zh';
  return <aside className="app-download-banner" aria-label={isZh ? '下载三慢问道 App' : 'Download Wendao App'}>
    <button className="app-download-banner-close" type="button" onClick={onClose}
      aria-label={isZh ? '关闭下载横幅' : 'Dismiss app banner'}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    </button>
    <img src="/assets/wendao/app-icon.png" width="48" height="48" alt="" />
    <div className="app-download-banner-copy">
      <strong>{isZh ? '三慢问道 · AI 道德经' : 'Wendao AI: Daodejing'}</strong>
      <span>{isZh ? '慢读经典，随时问道 · iPhone / iPad' : 'Read, reflect, ask · iPhone / iPad'}</span>
    </div>
    <AppStoreDownloadLink language={language} className="app-download-banner-action">
      {isZh ? '下载 App' : 'Get App'}
    </AppStoreDownloadLink>
  </aside>;
}
