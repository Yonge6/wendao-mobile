import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { useState } from "react";

import { createStripeCheckout } from "./api";
import { companionPublicConfig } from "./client";
import { COMPANION_PLANS } from "./plans";

type SubscriptionPanelProps = {
  language: "zh" | "en";
  session: Session;
  onSignOut: () => Promise<void>;
};

export default function SubscriptionPanel({ language, session, onSignOut }: SubscriptionPanelProps) {
  const isZh = language === "zh";
  const native = Capacitor.isNativePlatform();
  const [busyPlan, setBusyPlan] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState("");

  const beginCheckout = async (plan: "monthly" | "annual") => {
    const config = companionPublicConfig();
    if (!config || native || busyPlan) return;
    setBusyPlan(plan);
    setError("");
    try {
      const result = await createStripeCheckout(config.apiUrl, session.access_token, plan);
      window.location.assign(result.url);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法打开订阅。" : "Unable to open checkout."));
      setBusyPlan(null);
    }
  };

  return (
    <section className="companion-subscription" aria-labelledby="companion-subscription-title">
      <span className="drawer-kicker">{isZh ? "问道同行会员" : "Wendao Companion membership"}</span>
      <h3 id="companion-subscription-title">{isZh ? "选择一段同行的时间" : "Choose how long we travel together"}</h3>
      <p>{isZh ? "有效会员不限问答次数。没有试用期，核心阅读、搜索与分享仍可免费使用。" : "Active members can ask unlimited questions. There is no trial; core reading, search, and sharing remain free."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <button className="is-featured" type="button" disabled={native || busyPlan !== null} onClick={() => void beginCheckout("annual")}>
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{isZh ? `年付 ¥${COMPANION_PLANS.annual.cny}` : `Annual US$${COMPANION_PLANS.annual.usd}`}</strong>
          <small>{isZh ? "持续记录、自动记忆与每周回看；海外基准 US$199.99" : "Unlimited questions, memory, and weekly reflection"}</small>
        </button>
        <button type="button" disabled={native || busyPlan !== null} onClick={() => void beginCheckout("monthly")}>
          <strong>{isZh ? `月付 ¥${COMPANION_PLANS.monthly.cny}` : `Monthly US$${COMPANION_PLANS.monthly.usd}`}</strong>
          <small>{isZh ? "按月保持灵活；海外基准 US$19.99" : "Unlimited questions, billed monthly"}</small>
        </button>
      </div>
      <p className="companion-plan-note">
        {native
          ? (isZh ? "订阅将通过 App Store 安全完成。" : "Your subscription is securely handled by the App Store.")
          : (busyPlan
            ? (isZh ? "正在打开安全结账页…" : "Opening secure checkout…")
            : (isZh ? "其他国家和地区按美元基准显示当地商店价格。" : "Other countries and regions show localized storefront prices based on USD."))}
      </p>
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button>
    </section>
  );
}
