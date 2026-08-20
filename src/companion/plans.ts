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
});

export const COMPANION_MEMBERSHIP = Object.freeze({
  hasTrial: false,
  unlimitedQuestions: true,
  localizationBase: "USD" as const,
});

export const WENDAO_APP_STORE_URL = "https://apps.apple.com/us/app/wendao-daodejing/id6796945428";
