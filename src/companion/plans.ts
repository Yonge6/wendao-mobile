export const COMPANION_PLANS = Object.freeze({
  monthly: Object.freeze({
    id: "wendao_companion_monthly",
    cny: 68,
    usd: 19.99,
    interval: "month" as const,
  }),
  annual: Object.freeze({
    id: "wendao_companion_annual",
    cny: 698,
    usd: 199.99,
    interval: "year" as const,
  }),
  lifetime: Object.freeze({
    id: "wendao_reading_lifetime",
    cny: 9.9,
    usd: 7,
    interval: "lifetime" as const,
  }),
});

export const COMPANION_MEMBERSHIP = Object.freeze({
  hasTrial: false,
  unlimitedQuestions: true,
  localizationBase: "USD" as const,
});

export const WENDAO_APP_STORE_URL = "https://apps.apple.com/us/app/wendao-ai-daodejing/id6796945428";
export const WENDAO_APP_STORE_REVIEW_URL = `${WENDAO_APP_STORE_URL}?action=write-review`;

export function getWendaoAppStoreUrl(language: "zh" | "en") {
  return language === "zh"
    ? "https://apps.apple.com/cn/app/%E4%B8%89%E6%85%A2%E9%97%AE%E9%81%93-ai-%E9%81%93%E5%BE%B7%E7%BB%8F/id6796945428"
    : WENDAO_APP_STORE_URL;
}
