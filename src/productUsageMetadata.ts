// UI labels are bilingual; analytics uses fixed identifiers, never hrefs or account/contact values.
const contactTargets = new Map([
  ['wonderelian', 'wonderelian'], ['WonderElian', 'wonderelian'],
  ['email', 'email'], ['邮箱', 'email'], ['Email', 'email'],
  ['red', 'red'], ['小红书', 'red'], ['RED', 'red'],
  ['douyin', 'douyin'], ['抖音', 'douyin'], ['Douyin', 'douyin'],
  ['x', 'x'], ['X', 'x'], ['tiktok', 'tiktok'], ['TikTok', 'tiktok'],
  ['wechat_channels', 'wechat_channels'], ['视频号', 'wechat_channels'], ['WeChat Channels', 'wechat_channels'],
]);
const relatedTargets = new Map([
  ['wonderelian', 'wonderelian'], ['yixiu', 'yixiu'], ['xiazi', 'xiazi'],
  ['style-atlas', 'style-atlas'], ['buer', 'buer'], ['human-design', 'buer'],
]);

export function canonicalUsageTarget(event: string, target: unknown): string | undefined {
  if (typeof target !== 'string') return undefined;
  if (event === 'contact_click') return contactTargets.get(target);
  if (event === 'related_product_click') return relatedTargets.get(target);
  if (event === 'companion_open' && (target === 'subscription' || target === 'lifetime')) return target;
  return undefined;
}

export function usageEventDetail(event: string, metadata: Record<string, string | number | boolean> = {}) {
  const { target, ...details } = metadata;
  const canonicalTarget = canonicalUsageTarget(event, target);
  return { ...details, ...(canonicalTarget ? { target: canonicalTarget } : {}), event };
}
