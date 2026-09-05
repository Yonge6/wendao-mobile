import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

import AppStoreDownloadLink from "./AppStoreDownloadLink";
import { companionPublicConfig } from "./client";
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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | "lifetime">("annual");
  const [busyPlan, setBusyPlan] = useState<"monthly" | "annual" | "lifetime" | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [nativeProducts, setNativeProducts] = useState<StoreKitProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(native);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const reloadNativeProducts = useCallback(async () => {
    if (!native) return;
    setLoadingProducts(true);
    setError("");
    try {
      const products = await loadStoreKitProducts();
      setNativeProducts(products);
      if (products.length === 0) {
        setError(isZh
          ? "未能从 App Store 读取价格。请确认网络和 App Store 账号地区后重试；商品刚开放时，Apple 同步也可能需要一点时间。"
          : "Prices could not be loaded from the App Store. Check your connection and App Store region, then retry. Newly available products can also take a little time to sync.");
      } else if (products.length < Object.keys(STOREKIT_PRODUCTS).length) {
        setError(isZh
          ? "部分方案仍在由 App Store 同步。你可以先选择已经显示价格的方案，或稍后重新读取。"
          : "Some plans are still syncing with the App Store. You can choose a plan with a visible price now, or retry shortly.");
      }
    } catch {
      setNativeProducts([]);
      setError(isZh
        ? "暂时无法连接 App Store 读取价格，请检查网络后重试。"
        : "The App Store could not be reached for prices. Check your connection and retry.");
    } finally {
      setLoadingProducts(false);
    }
  }, [isZh, native]);

  useEffect(() => {
    if (!native) return;
    void reloadNativeProducts();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void reloadNativeProducts();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [native, reloadNativeProducts]);

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
      if (result === "purchased" && plan !== "lifetime") await onMembershipChanged();
      if (result === "purchased" && plan === "lifetime") {
        setNotice(isZh ? "已永久解锁全部 81 章。" : "All 81 chapters are now unlocked forever.");
      }
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
      const result = await restoreStoreKit({ apiUrl: config.apiUrl, accessToken: session.access_token });
      if (result.verified > 0) await onMembershipChanged();
      if (result.productIds.length > 0) {
        setNotice(isZh ? "购买记录已恢复。" : "Your purchases have been restored.");
      } else setNotice(isZh ? "没有找到可恢复的购买。" : "No purchases were found to restore.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "恢复购买未完成。" : "Purchases could not be restored."));
    } finally {
      setRestoring(false);
    }
  };

  const nativePrice = (plan: "monthly" | "annual" | "lifetime") => nativeProducts.find(
    (product) => product.id === STOREKIT_PRODUCTS[plan],
  )?.displayPrice;

  useEffect(() => {
    if (!native || loadingProducts) return;
    const hasProduct = (plan: "monthly" | "annual" | "lifetime") => nativeProducts.some(
      (product) => product.id === STOREKIT_PRODUCTS[plan],
    );
    if (hasProduct(selectedPlan)) return;
    const availablePlan = (["annual", "monthly", "lifetime"] as const).find(hasProduct);
    if (availablePlan) setSelectedPlan(availablePlan);
  }, [loadingProducts, native, nativeProducts, selectedPlan]);

  const priceLabel = (plan: "monthly" | "annual" | "lifetime") => nativePrice(plan)
    ?? (loadingProducts ? (isZh ? "读取中…" : "Loading…") : (isZh ? "暂不可用" : "Unavailable"));

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
        <span className="drawer-kicker">{isZh ? "AI 问道 · App" : "Wendao AI · App"}</span>
        <h3 id="companion-subscription-title">{isZh ? "在 App 里开始同行" : "Begin in the Wendao app"}</h3>
        <p>{isZh
          ? "AI 问道现已先在 App 开放。下载三慢问道 AI，用 Apple 或 Google 登录后，即可选择月付或年付会员，开始不限次数的章节 AI 对话。"
          : "Wendao AI is currently available first in the app. Download Wendao AI, sign in with Apple or Google, and choose a monthly or annual membership for unlimited chapter-grounded conversations."}</p>
        <div className="companion-app-download-card">
          <span>{isZh ? "在 App 中继续" : "Continue in the app"}</span>
          <strong>{isZh ? "完整阅读，与这一章深入对话" : "Read fully and reflect with each chapter"}</strong>
          <small>{isZh ? "自动记忆、每周回看与订阅均由 App 安全管理" : "Automatic memory, weekly reflection, and subscriptions are securely managed in the app"}</small>
        </div>
        <AppStoreDownloadLink className="companion-app-store-link" language={language}>
          {isZh ? "前往 App Store 下载" : "Download on the App Store"}
          <span aria-hidden="true">↗</span>
        </AppStoreDownloadLink>
        <p className="companion-plan-note">{isZh
          ? "已经在 App 内开通？请回到 App 阅读全部章节，并继续 AI 问道。"
          : "Already unlocked access in the app? Return to the app to read every chapter and continue with Wendao AI."}</p>
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
      <span className="drawer-kicker">{isZh ? "AI 问道会员" : "Wendao AI membership"}</span>
      <h3 id="companion-subscription-title">{isZh ? "选择一段同行的时间" : "Choose how long we travel together"}</h3>
      <p>{isZh ? "今日一章与自选 10 章免费。订阅解锁完整阅读与 AI；也可一次买断全部章节。" : "Today’s chapter and 10 chapters you choose are free. Subscribe for full reading plus AI, or unlock every chapter once and keep them forever."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <button
          className={`is-featured ${selectedPlan === "annual" ? "is-selected" : ""}`}
          type="button"
          aria-pressed={selectedPlan === "annual"}
          disabled={busyPlan !== null || (native && !nativePrice("annual"))}
          onClick={() => setSelectedPlan("annual")}
        >
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{`${isZh ? "年付" : "Annual"} ${priceLabel("annual")}`}</strong>
          <small>{isZh ? "持续记录、自动记忆与每周回看；海外基准 US$199.99" : "Unlimited questions, memory, and weekly reflection"}</small>
        </button>
        <button
          className={selectedPlan === "monthly" ? "is-selected" : ""}
          type="button"
          aria-pressed={selectedPlan === "monthly"}
          disabled={busyPlan !== null || (native && !nativePrice("monthly"))}
          onClick={() => setSelectedPlan("monthly")}
        >
          <strong>{`${isZh ? "月付" : "Monthly"} ${priceLabel("monthly")}`}</strong>
          <small>{isZh ? "按月保持灵活；海外基准 US$19.99" : "Unlimited questions, billed monthly"}</small>
        </button>
        <button
          className={`is-lifetime ${selectedPlan === "lifetime" ? "is-selected" : ""}`}
          type="button"
          aria-pressed={selectedPlan === "lifetime"}
          disabled={busyPlan !== null || (native && !nativePrice("lifetime"))}
          onClick={() => setSelectedPlan("lifetime")}
        >
          <span>{isZh ? "一次买断" : "One-time purchase"}</span>
          <strong>{`${isZh ? "永久解锁 81 章" : "Unlock all 81 forever"} ${priceLabel("lifetime")}`}</strong>
          <small>{isZh ? "完整阅读永久保留；不含 AI 问答、记忆与每周回看" : "Permanent reading access; AI, memory, and weekly reflection are not included"}</small>
        </button>
      </div>
      <button
        className="companion-checkout-button"
        type="button"
        disabled={busyPlan !== null || loadingProducts || !nativePrice(selectedPlan)}
        onClick={() => void beginCheckout()}
      >
        {busyPlan
          ? (isZh ? "正在前往 App Store…" : "Opening the App Store…")
          : selectedPlan === "lifetime"
            ? (isZh ? "确认永久解锁" : "Unlock forever")
            : (isZh ? "确认并前往支付" : "Confirm and continue to payment")}
      </button>
      <p className="companion-plan-note">
        {selectedPlan === "lifetime"
          ? (isZh ? "一次购买，永久恢复；不自动续费。" : "One purchase, restorable forever, with no renewal.")
          : (isZh ? "订阅将通过 App Store 安全完成。" : "Your subscription is securely handled by the App Store.")}
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
      {error ? (
        <button className="companion-text-button" type="button" disabled={loadingProducts} onClick={() => void reloadNativeProducts()}>
          {loadingProducts ? (isZh ? "正在读取价格…" : "Loading prices…") : (isZh ? "重新读取价格" : "Retry prices")}
        </button>
      ) : null}
      <button className="companion-text-button" type="button" onClick={onOpenAccount}>
        {isZh ? "数据与账号" : "Data and account"}
      </button>
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button>
    </section>
  );
}
