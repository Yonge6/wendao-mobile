import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createStripeCheckout } from "./api";
import { companionPublicConfig } from "./client";
import { COMPANION_PLANS } from "./plans";
import {
  loadStoreKitProducts,
  purchaseStoreKit,
  restoreStoreKit,
  STOREKIT_PRODUCTS,
  type StoreKitProduct,
} from "./storekit";

type SubscriptionPanelProps = {
  language: "zh" | "en";
  session: Session;
  onSignOut: () => Promise<void>;
  onMembershipChanged: () => Promise<void>;
  onOpenAccount: () => void;
};

export default function SubscriptionPanel({ language, session, onSignOut, onMembershipChanged, onOpenAccount }: SubscriptionPanelProps) {
  const isZh = language === "zh";
  const native = Capacitor.isNativePlatform();
  const [busyPlan, setBusyPlan] = useState<"monthly" | "annual" | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [nativeProducts, setNativeProducts] = useState<StoreKitProduct[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!native) return;
    void loadStoreKitProducts()
      .then(setNativeProducts)
      .catch(() => setError(isZh ? "暂时无法读取 App Store 订阅方案。" : "App Store plans are temporarily unavailable."));
  }, [isZh, native]);

  const beginCheckout = async (plan: "monthly" | "annual") => {
    const config = companionPublicConfig();
    if (!config || busyPlan) return;
    setBusyPlan(plan);
    setError("");
    try {
      if (native) {
        const result = await purchaseStoreKit({
          plan,
          userId: session.user.id,
          apiUrl: config.apiUrl,
          accessToken: session.access_token,
        });
        if (result === "purchased") await onMembershipChanged();
        if (result === "pending") setNotice(isZh ? "购买正在等待 App Store 确认。" : "Your purchase is awaiting App Store approval.");
        setBusyPlan(null);
      } else {
        const result = await createStripeCheckout(config.apiUrl, session.access_token, plan);
        window.location.assign(result.url);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法打开订阅。" : "Unable to open checkout."));
      setBusyPlan(null);
    }
  };

  const restore = async () => {
    const config = companionPublicConfig();
    if (!config || !native || restoring) return;
    setRestoring(true);
    setError("");
    setNotice("");
    try {
      const count = await restoreStoreKit({ apiUrl: config.apiUrl, accessToken: session.access_token });
      if (count > 0) await onMembershipChanged();
      else setNotice(isZh ? "没有找到可恢复的有效订阅。" : "No active subscription was found to restore.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "恢复购买未完成。" : "Purchases could not be restored."));
    } finally {
      setRestoring(false);
    }
  };

  const nativePrice = (plan: "monthly" | "annual") => nativeProducts.find(
    (product) => product.id === STOREKIT_PRODUCTS[plan],
  )?.displayPrice;

  return (
    <section className="companion-subscription" aria-labelledby="companion-subscription-title">
      <span className="drawer-kicker">{isZh ? "问道同行会员" : "Wendao Companion membership"}</span>
      <h3 id="companion-subscription-title">{isZh ? "选择一段同行的时间" : "Choose how long we travel together"}</h3>
      <p>{isZh ? "有效会员不限问答次数。没有试用期，核心阅读、搜索与分享仍可免费使用。" : "Active members can ask unlimited questions. There is no trial; core reading, search, and sharing remain free."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <button className="is-featured" type="button" disabled={busyPlan !== null || (native && !nativePrice("annual"))} onClick={() => void beginCheckout("annual")}>
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{native
            ? `${isZh ? "年付" : "Annual"} ${nativePrice("annual") ?? "…"}`
            : (isZh ? `年付 ¥${COMPANION_PLANS.annual.cny}` : `Annual US$${COMPANION_PLANS.annual.usd}`)}</strong>
          <small>{isZh ? "持续记录、自动记忆与每周回看；海外基准 US$199.99" : "Unlimited questions, memory, and weekly reflection"}</small>
        </button>
        <button type="button" disabled={busyPlan !== null || (native && !nativePrice("monthly"))} onClick={() => void beginCheckout("monthly")}>
          <strong>{native
            ? `${isZh ? "月付" : "Monthly"} ${nativePrice("monthly") ?? "…"}`
            : (isZh ? `月付 ¥${COMPANION_PLANS.monthly.cny}` : `Monthly US$${COMPANION_PLANS.monthly.usd}`)}</strong>
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
      {native ? (
        <button className="companion-text-button" type="button" disabled={restoring || busyPlan !== null} onClick={() => void restore()}>
          {restoring ? (isZh ? "正在恢复…" : "Restoring…") : (isZh ? "恢复购买" : "Restore purchases")}
        </button>
      ) : null}
      {notice ? <p className="companion-plan-note" role="status">{notice}</p> : null}
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
      <button className="companion-text-button" type="button" onClick={onOpenAccount}>
        {isZh ? "数据与账号" : "Data and account"}
      </button>
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button>
    </section>
  );
}
