(() => {
  'use strict';
  const page = document.body.dataset.page;
  if (!["start", "explaining", "finishing", "comparing", "boundaries", "choosing", "finishing-carefully", "saying-no", "waiting-for-reply", "help-without-taking-over", "disagree-gently", "room-to-rest", "enough-for-today", "first-small-step", "reversible-decision", "letting-go-of-cost", "without-an-answer", "beginner-again", "less-supervision", "repair-after-mistake", "reading-a-difficult-line"].includes(page)) return;
  const safeGet = (key, store = localStorage) => { try { return store.getItem(key); } catch { return null; } };
  const safeSet = (key, value, store = localStorage) => { try { store.setItem(key, value); } catch {} };
  const uid = () => crypto.randomUUID();
  let visitor;
  try { visitor = JSON.parse(safeGet('wendao-growth-visitor')); } catch {}
  if (!visitor?.id || Date.now() - visitor.created > 30 * 86400000) {
    visitor = { id: uid(), created: Date.now() };
    safeSet('wendao-growth-visitor', JSON.stringify(visitor));
  }
  const session = safeGet('wendao-growth-session', sessionStorage) || uid();
  safeSet('wendao-growth-session', session, sessionStorage);
  const params = new URLSearchParams(location.search);
  if (params.get('ops_test') === '1') safeSet('wendao-growth-test', '1', sessionStorage);
  const test = safeGet('wendao-growth-test', sessionStorage) === '1';
  const allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  let campaign = {};
  try { campaign = JSON.parse(safeGet('wendao-growth-campaign', sessionStorage)) || {}; } catch {}
  if (params.has('utm_source')) {
    campaign = {};
    for (const key of allowed) {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) campaign[key] = value;
    }
    safeSet('wendao-growth-campaign', JSON.stringify(campaign), sessionStorage);
  }
  const day = new Date().toLocaleDateString('sv-SE');
  const pending = new Set();
  const choice = document.getElementById('analytics-choice');
  const optedOut = () => safeGet('wendao-growth-optout') === '1' || navigator.globalPrivacyControl === true;
  function showChoice() {
    if (!choice) return;
    choice.textContent = optedOut() ? '匿名阅读统计已关闭' : '关闭匿名阅读统计';
    choice.setAttribute('aria-pressed', String(optedOut()));
  }
  choice?.addEventListener('click', () => {
    safeSet('wendao-growth-optout', optedOut() ? '0' : '1');
    showChoice();
  });
  showChoice();
  async function track(event, target = '') {
    if (optedOut()) return;
    const key = `wendao-growth:${day}:${page}:${event}:${target}:${test}`;
    if (safeGet(key, sessionStorage) || pending.has(key)) return;
    pending.add(key);
    const payload = { event_id: uid(), visitor: visitor.id, session, page, event, target, campaign, test };
    for (let attempt = 0; attempt < 3 && !optedOut(); attempt++) {
      try {
        const result = await fetch('/__growth/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true });
        if (result.ok) { safeSet(key, '1', sessionStorage); break; }
        if (result.status >= 400 && result.status < 500) break;
      } catch {}
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500));
    }
    pending.delete(key);
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === '/privacy.html') continue;
    for (const key of allowed) if (campaign[key]) url.searchParams.set(key, campaign[key]);
    if (test) url.searchParams.set('ops_test', '1');
    link.href = url.toString();
    link.addEventListener('click', () => {
      if (link.dataset.action) void track(link.dataset.action, url.searchParams.get('chapter') || 'daily');
    });
  }
  void track('view');
  const article = document.getElementById('reading-body');
  if (!article) return;
  let foreground = 0, last = performance.now(), reached = false;
  function sample() {
    const now = performance.now();
    if (document.visibilityState === 'visible') {
      const box = article.getBoundingClientRect();
      if (box.bottom > 0 && box.top < innerHeight) {
        foreground += Math.min(now - last, 1500);
        const threshold = box.height <= innerHeight ? box.bottom : box.top + box.height * 0.6;
        reached ||= threshold <= innerHeight && box.bottom > 0;
      }
    }
    last = now;
    if (foreground >= 45000 && reached) { void track('engaged'); clearInterval(timer); }
  }
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  const timer = setInterval(sample, 1000);
})();
