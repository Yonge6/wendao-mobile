import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { companionPublicConfig } from "./client";
import { WENDAO_APP_STORE_URL } from "./plans";
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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [busyPlan, setBusyPlan] = useState<"monthly" | "annual" | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [nativeProducts, setNativeProducts] = useState<StoreKitProduct[]>([]);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!native) return;
    void loadStoreKitProducts()
      .then(setNativeProducts)
      .catch(() => setError(isZh ? "暂时无法读取 App Store 订阅方案。" : "App Store plans are temporarily unavailable."));
  }, [isZh, native]);

  const beginCheckout = async () => {
    const plan = selectedPlan;
    const config = companionPublicConfig();
    if (!config || busyPlan || !native) return;
    setBusyPlan(plan);
    setError("");
    try {
      const result = await purchaseStoreKit({
        plan,
        userId: session.user.id,
        apiUrl: config.apiUrl,
        accessToken: session.access_token,
      });
      if (result === "purchased") await onMembershipChanged();
      if (result === "pending") setNotice(isZh ? "购买正在等待 App Store 确认。" : "Your purchase is awaiting App Store approval.");
      setBusyPlan(null);
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

  const checkMembership = async () => {
    if (checkingMembership) return;
    setCheckingMembership(true);
    setError("");
    setNotice("");
    try {
      await onMembershipChanged();
      setNotice(isZh
        ? "暂未检测到有效会员。请确认 App 与网页使用同一个账号，再稍后重试。"
        : "No active membership was found yet. Confirm that the app and web use the same account, then try again shortly.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法检查会员状态。" : "Unable to check membership right now."));
    } finally {
      setCheckingMembership(false);
    }
  };

  if (!native) {
    return (
      <section className="companion-subscription companion-app-download" aria-labelledby="companion-subscription-title">
        <span className="drawer-kicker">{isZh ? "问道同行 · iPhone App" : "Wendao Companion · iPhone app"}</span>
        <h3 id="companion-subscription-title">{isZh ? "在 App 里开始同行" : "Begin in the Wendao app"}</h3>
        <p>{isZh
          ? "问道同行现已先在 iPhone App 开放。下载三慢问道，用 Apple 或 Google 登录后，即可选择月付或年付会员，开始不限次数的 AI 问答。"
          : "Wendao Companion is currently available first in the iPhone app. Download Wendao, sign in with Apple or Google, and choose a monthly or annual membership for unlimited AI conversations."}</p>
        <div className="companion-app-download-card">
          <span>{isZh ? "在 App 中继续" : "Continue in the app"}</span>
          <strong>{isZh ? "完整阅读，与这一章深入对话" : "Read fully and reflect with each chapter"}</strong>
          <small>{isZh ? "自动记忆、每周回看与订阅均由 App 安全管理" : "Automatic memory, weekly reflection, and subscriptions are securely managed in the app"}</small>
        </div>
        <a className="companion-app-store-link" href={WENDAO_APP_STORE_URL} target="_blank" rel="noreferrer">
          {isZh ? "前往 App Store 下载" : "Download on the App Store"}
          <span aria-hidden="true">↗</span>
        </a>
        <p className="companion-plan-note">{isZh
          ? "已经在 App 内订阅？请在 App 与网页使用同一个登录账号，会员权益会自动同步。"
          : "Already subscribed in the app? Use the same sign-in on the app and web; your membership will sync automatically."}</p>
        <button className="companion-text-button" type="button" disabled={checkingMembership} onClick={() => void checkMembership()}>
          {checkingMembership ? (isZh ? "正在检查…" : "Checking…") : (isZh ? "我已订阅，重新检查" : "I subscribed — check again")}
        </button>
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

  return (
    <section className="companion-subscription" aria-labelledby="companion-subscription-title">
      <span className="drawer-kicker">{isZh ? "问道同行会员" : "Wendao Companion membership"}</span>
      <h3 id="companion-subscription-title">{isZh ? "选择一段同行的时间" : "Choose how long we travel together"}</h3>
      <p>{isZh ? "有效会员不限问答次数。没有试用期，核心阅读、搜索与分享仍可免费使用。" : "Active members can ask unlimited questions. There is no trial; core reading, search, and sharing remain free."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <button
          className={`is-featured ${selectedPlan === "annual" ? "is-selected" : ""}`}
          type="button"
          aria-pressed={selectedPlan === "annual"}
          disabled={busyPlan !== null || (native && !nativePrice("annual"))}
          onClick={() => setSelectedPlan("annual")}
        >
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{`${isZh ? "年付" : "Annual"} ${nativePrice("annual") ?? "…"}`}</strong>
          <small>{isZh ? "持续记录、自动记忆与每周回看；海外基准 US$199.99" : "Unlimited questions, memory, and weekly reflection"}</small>
        </button>
        <button
          className={selectedPlan === "monthly" ? "is-selected" : ""}
          type="button"
          aria-pressed={selectedPlan === "monthly"}
          disabled={busyPlan !== null || (native && !nativePrice("monthly"))}
          onClick={() => setSelectedPlan("monthly")}
        >
          <strong>{`${isZh ? "月付" : "Monthly"} ${nativePrice("monthly") ?? "…"}`}</strong>
          <small>{isZh ? "按月保持灵活；海外基准 US$19.99" : "Unlimited questions, billed monthly"}</small>
        </button>
      </div>
      <button
        className="companion-checkout-button"
        type="button"
        disabled={busyPlan !== null || !nativePrice(selectedPlan)}
        onClick={() => void beginCheckout()}
      >
        {busyPlan
          ? (isZh ? "正在前往 App Store…" : "Opening the App Store…")
          : (isZh ? "确认并前往支付" : "Confirm and continue to payment")}
      </button>
      <p className="companion-plan-note">
        {isZh ? "订阅将通过 App Store 安全完成。" : "Your subscription is securely handled by the App Store."}
      </p>
      <p className="companion-plan-legal">
        {isZh ? "继续即表示你同意" : "By continuing, you agree to the"}{" "}
        <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer">
          {isZh ? "Apple 标准使用条款" : "Apple Standard EULA"}
        </a>
        {isZh ? "，并已阅读" : " and acknowledge the"}{" "}
        <a href="https://wendao.wonderelian.com/privacy.html" target="_blank" rel="noreferrer">
          {isZh ? "隐私政策" : "Privacy Policy"}
        </a>
        {isZh ? "。" : "."}
      </p>
      <button className="companion-text-button" type="button" disabled={restoring || busyPlan !== null} onClick={() => void restore()}>
        {restoring ? (isZh ? "正在恢复…" : "Restoring…") : (isZh ? "恢复购买" : "Restore purchases")}
      </button>
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
