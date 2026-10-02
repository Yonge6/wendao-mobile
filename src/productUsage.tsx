import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { loadAnalyticsContext } from './companion/storekit';

export const usageConsentKey = 'wendao.usageConsent.v1';
export function usageConsent() { try { return localStorage.getItem(usageConsentKey) === 'granted'; } catch { return false; } }
export function usageEvent(event: string, metadata: Record<string, string | number | boolean> = {}) {
  window.dispatchEvent(new CustomEvent('wendao:usage', { detail: { event, ...metadata } }));
}
let started = false;
export function initializeUsage() {
  if (started) return; started = true;
  const ready = (context: object) => window.dispatchEvent(new CustomEvent('wendao:usage-ready', { detail: context }));
  if (Capacitor.isNativePlatform()) {
    void loadAnalyticsContext().then(context => ready({ ...context, surface: 'ios' })).catch(() => ready({ production: false, surface: 'ios', version: 'unknown' }));
  } else ready({ production: location.hostname === 'wendao.wonderelian.com', surface: 'h5', version: 'web' });
}
export function UsagePreference({ language }: { language: 'zh' | 'en' }) {
  const [enabled, setEnabled] = useState(usageConsent);
  const zh = language === 'zh';
  useEffect(() => { const update = () => setEnabled(usageConsent()); window.addEventListener('wendao:usage-consent', update); return () => window.removeEventListener('wendao:usage-consent', update); }, []);
  return <div className="drawer-nav-row"><span className="drawer-nav-icon" aria-hidden="true">◎</span><span><strong>{zh ? '帮助改进三慢问道' : 'Help improve Wendao'}</strong><small>{zh ? '自愿分享匿名使用统计，不含对话和出生资料；随时可关闭' : 'Optional anonymous usage statistics, without chats or birth details. Turn off anytime.'}</small></span><button type="button" role="switch" aria-checked={enabled} aria-label={zh ? '分享匿名使用统计' : 'Share anonymous usage statistics'} className={`theme-toggle ${enabled ? 'is-on' : ''}`} onClick={() => { const next = !enabled; try { localStorage.setItem(usageConsentKey, next ? 'granted' : 'denied'); } catch { return; } setEnabled(next); window.dispatchEvent(new Event('wendao:usage-consent')); }}><span /></button></div>;
}
