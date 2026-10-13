import { usageEvent } from "../productUsage";
import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

import AppStoreDownloadLink from "./AppStoreDownloadLink";
import { companionPublicConfig } from "./client";
import { membershipEntitlementIsActive } from "../readingAccess";
import type { CompanionAllowanceState, CompanionPlan } from "./allowance";
import {
  loadStoreKitProducts,
  purchaseStoreKit,
  restoreStoreKit,
  STOREKIT_PRODUCTS,
  type StoreKitProduct,
} from "./storekit";

type SubscriptionPanelProps = {
  language: "zh" | "en";
  session: Session | null;
  onSignOut?: () => Promise<void>;
  onMembershipChanged?: () => Promise<CompanionAllowanceState>;
  onOpenAccount?: () => void;
  onRequireSignIn?: () => void;
  onPlanChange?: (plan: CompanionPlan) => void;
  initialPlan?: "monthly" | "annual" | "lifetime";
};

export default function SubscriptionPanel({ language, session, onSignOut, onMembershipChanged, onOpenAccount, onRequireSignIn, onPlanChange, initialPlan = "annual" }: SubscriptionPanelProps) {
  const isZh = language === "zh";
  const native = Capacitor.isNativePlatform();
  useEffect(() => { usageEvent("paywall_view"); }, []);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | "lifetime">(initialPlan);
  const [busyPlan, setBusyPlan] = useState<"monthly" | "annual" | "lifetime" | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [nativeProducts, setNativeProducts] = useState<StoreKitProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(native);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedPlan(initialPlan);
  }, [initialPlan]);

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

  const choosePlan = (plan: CompanionPlan) => {
    setSelectedPlan(plan);
    onPlanChange?.(plan);
  };

  const beginCheckout = async () => {
    if (!session) { onRequireSignIn?.(); return; }
    const plan = selectedPlan;
    const config = companionPublicConfig();
    if (!config || busyPlan || !native) return;
    setBusyPlan(plan);
    setError("");
    setNotice("");
    try {
      usageEvent("purchase_request", { plan });
      const result = await purchaseStoreKit({
        plan,
        userId: session.user.id,
        apiUrl: config.apiUrl,
        accessToken: session.access_token,
      });
      usageEvent("purchase_result", { plan, result });
      if (result === "purchased" && plan !== "lifetime") {
        try {
          const current = await onMembershipChanged?.();
          setNotice(current && membershipEntitlementIsActive(current.entitlement)
            ? (isZh ? "会员已生效，可以继续问道。" : "Your membership is active. Continue with Wendao AI.")
            : (isZh ? "购买已完成，会员状态正在同步。请稍后重新检查。" : "Your purchase is complete and membership is syncing. Check again shortly."));
        } catch {
          setNotice(isZh ? "购买已完成，暂时未能刷新会员状态。请稍后重新检查。" : "Your purchase is complete, but membership could not refresh. Check again shortly.");
        }
      }
      if (result === "purchased" && plan === "lifetime") {
        setNotice(isZh ? "已永久解锁全部 81 章。" : "All 81 chapters are now unlocked forever.");
      }
      if (result === "pending") setNotice(isZh ? "购买正在等待 App Store 确认。" : "Your purchase is awaiting App Store approval.");
      setBusyPlan(null);
    } catch (nextError) {
      usageEvent("purchase_result", { plan, result: "failed" });
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法打开订阅。" : "Unable to open checkout."));
      setBusyPlan(null);
    }
  };

  const restore = async () => {
    const config = companionPublicConfig();
    if (!session || !config || !native || restoring) return;
    setRestoring(true);
    setError("");
    setNotice("");
    try {
      const result = await restoreStoreKit({ apiUrl: config.apiUrl, accessToken: session.access_token });
      usageEvent("restore_result", { result: result.productIds.length > 0 ? "found" : "empty" });
      let refreshFailed = false;
      if (result.verified > 0) {
        try { await onMembershipChanged?.(); }
        catch { refreshFailed = true; }
      }
      if (refreshFailed) {
        setNotice(isZh ? "购买记录已恢复，暂时未能刷新会员状态。请稍后重新检查。" : "Your purchases were restored, but membership could not refresh. Check again shortly.");
      } else if (result.productIds.length > 0) {
        setNotice(isZh ? "购买记录已恢复。" : "Your purchases have been restored.");
      } else setNotice(isZh ? "没有找到可恢复的购买。" : "No purchases were found to restore.");
    } catch (nextError) {
      usageEvent("restore_result", { result: "failed" });
      setError(nextError instanceof Error ? nextError.message : (isZh ? "恢复购买未完成。" : "Purchases could not be restored."));
    } finally {
      setRestoring(false);
    }
  };

  const nativePrice = (plan: "monthly" | "annual" | "lifetime") => nativeProducts.find(
    (product) => product.id === STOREKIT_PRODUCTS[plan],
  )?.displayPrice;

  const priceLabel = (plan: CompanionPlan) => native
    ? nativePrice(plan) ?? (loadingProducts ? (isZh ? "读取中…" : "Loading…") : (isZh ? "暂不可用" : "Unavailable"))
    : (isZh ? "在 App 查看价格" : "Price in the app");

  const renewalLabel = (plan: "monthly" | "annual") => `${priceLabel(plan)}/${isZh ? (plan === "annual" ? "年" : "月") : (plan === "annual" ? "year" : "month")}`;

  const checkMembership = async () => {
    if (checkingMembership || !onMembershipChanged) return;
    setCheckingMembership(true);
    setError("");
    setNotice("");
    try {
      const current = await onMembershipChanged();
      setNotice(membershipEntitlementIsActive(current.entitlement)
        ? (isZh ? "会员已生效。使用同一账号，可在网页和 App 继续问道。" : "Your membership is active. Continue on the web or app with the same account.")
        : (isZh ? "暂未检测到有效问道会员。请确认 App 与网页使用同一个账号；永久解锁章节不含 AI 会员。" : "No active Wendao membership was found. Use the same account in the app and web; the one-time chapter unlock does not include AI membership."));
    } catch {
      setError(isZh ? "网络或账号状态暂时无法确认，检查未完成。请稍后重试。" : "The network or account status could not be confirmed. The check did not complete; please retry.");
    } finally {
      setCheckingMembership(false);
    }
  };

  return (
    <section className="companion-subscription" aria-labelledby="companion-subscription-title">
      <span className="drawer-kicker">{selectedPlan === "lifetime" ? (isZh ? "完整阅读 · 永久解锁" : "Complete reading · permanent unlock") : (isZh ? "AI 问道会员" : "Wendao AI membership")}</span>
      <h3 id="companion-subscription-title">{selectedPlan === "lifetime" ? (isZh ? "一次解锁，慢慢读完 81 章" : "Unlock once. Read all 81 at your own pace.") : (isZh ? "选择一段同行的时间" : "Choose how long we travel together")}</h3>
      <p>{isZh ? "登录后每天可免费问道 3 条。订阅解锁 81 章、不限次数 AI、自动记忆与每周回看；也可一次买断全部章节。" : "After signing in, you can ask 3 free questions each day. Subscribe for all 81 chapters, unlimited AI, automatic memory, and weekly reflection, or unlock every chapter once and keep it forever."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <button
          className={`is-featured ${selectedPlan === "annual" ? "is-selected" : ""}`}
          type="button"
          aria-pressed={selectedPlan === "annual"}
          disabled={busyPlan !== null}
          onClick={() => choosePlan("annual")}
        >
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{`${isZh ? "年付" : "Annual"}${native ? ` ${priceLabel("annual")}` : ""}`}</strong>
          {!native ? <small className="companion-plan-price">{isZh ? "在 App 查看价格" : "Price in the app"}</small> : null}
          <small>{isZh ? "持续记录、自动记忆与每周回看；按年自动续费" : "Unlimited questions, memory, and weekly reflection; renewed annually"}</small>
        </button>
        <button
          className={selectedPlan === "monthly" ? "is-selected" : ""}
          type="button"
          aria-pressed={selectedPlan === "monthly"}
          disabled={busyPlan !== null}
          onClick={() => choosePlan("monthly")}
        >
          <strong>{`${isZh ? "月付" : "Monthly"}${native ? ` ${priceLabel("monthly")}` : ""}`}</strong>
          {!native ? <small className="companion-plan-price">{isZh ? "在 App 查看价格" : "Price in the app"}</small> : null}
          <small>{isZh ? "按月保持灵活；按月自动续费" : "Unlimited questions, renewed monthly"}</small>
        </button>
        <button
          className={`is-lifetime ${selectedPlan === "lifetime" ? "is-selected" : ""}`}
          type="button"
          aria-pressed={selectedPlan === "lifetime"}
          disabled={busyPlan !== null}
          onClick={() => choosePlan("lifetime")}
        >
          <span>{isZh ? "一次买断" : "One-time purchase"}</span>
          <strong>{`${isZh ? "永久解锁 81 章" : "Unlock all 81 forever"}${native ? ` ${priceLabel("lifetime")}` : ""}`}</strong>
          {!native ? <small className="companion-plan-price">{isZh ? "在 App 查看价格" : "Price in the app"}</small> : null}
          <small>{isZh ? "完整阅读永久保留；不含 AI 问答、记忆与每周回看" : "Permanent reading access; AI, memory, and weekly reflection are not included"}</small>
        </button>
      </div>
      {native ? <button
        className="companion-checkout-button"
        type="button"
        disabled={busyPlan !== null || loadingProducts || !nativePrice(selectedPlan)}
        onClick={() => void beginCheckout()}
      >
        {busyPlan
          ? (isZh ? "正在前往 App Store…" : "Opening the App Store…")
          : !session
            ? (isZh ? "登录后继续" : "Sign in to continue")
            : selectedPlan === "lifetime"
              ? (isZh ? "确认永久解锁" : "Unlock forever")
              : (isZh ? "确认并前往支付" : "Confirm and continue to payment")}
      </button> : <div className="companion-app-download">
        <p>{isZh
          ? "每天的 3 条免费问道可在网页和 App 使用。购买与续订请在 App 内完成；问道会员登录同一账号后，AI 对话、记忆与每周回看可跨端继续。"
          : "Your 3 free daily questions work on the web and app. Purchase or renew in the app; use the same account to continue member AI conversations, memory, and weekly reflection across both."}</p>
        <AppStoreDownloadLink className="companion-app-store-link" language={language}>
          {isZh ? "前往 App Store 下载" : "Download on the App Store"}<span aria-hidden="true">↗</span>
        </AppStoreDownloadLink>
        <p className="companion-plan-note">{isZh
          ? "永久解锁 81 章是 App 内的阅读权益，可通过 Apple 账号恢复；问道会员通过三慢问道账号同步。"
          : "The one-time 81-chapter unlock is app reading access, restored through your Apple account. Wendao membership syncs through your Wendao account."}</p>
        {session ? <button className="companion-text-button" type="button" disabled={checkingMembership} onClick={() => void checkMembership()}>
          {checkingMembership ? (isZh ? "正在检查…" : "Checking…") : (isZh ? "我已订阅，重新检查" : "I subscribed — check again")}
        </button> : <button className="companion-text-button" type="button" onClick={onRequireSignIn}>{isZh ? "登录并同步已有会员" : "Sign in to sync membership"}</button>}
      </div>}
      {native ? <p className="companion-plan-note">
        {selectedPlan === "lifetime"
          ? (isZh ? "一次购买，永久恢复；不自动续费。" : "One purchase, restorable forever, with no renewal.")
          : (isZh ? `按 ${renewalLabel(selectedPlan)}自动续费，直至取消。` : `${renewalLabel(selectedPlan)}, automatically renewed until cancelled.`)}
      </p> : null}
      <p className="companion-plan-note">{isZh ? "订阅将通过 App Store 安全完成，最终价格以 Apple 确认页为准。" : "Your subscription is securely handled by the App Store. Apple confirms the final price."}</p>
      <p className="companion-plan-legal">
        {native ? (isZh ? "继续即表示你同意" : "By continuing, you agree to the") : (isZh ? "App 内购买适用" : "In-app purchases use the")}{" "}
        <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer">
          {isZh ? "Apple 标准使用条款" : "Apple Standard EULA"}
        </a>
        {native ? (isZh ? "，并已阅读" : " and acknowledge the") : (isZh ? "；账号数据遵循" : "; account data is governed by the")}{" "}
        <a href="https://wendao.wonderelian.com/privacy.html" target="_blank" rel="noreferrer">
          {isZh ? "隐私政策" : "Privacy Policy"}
        </a>
        {isZh ? "。" : "."}
      </p>
      {native && session ? <button className="companion-text-button" type="button" disabled={restoring || busyPlan !== null} onClick={() => void restore()}>
        {restoring ? (isZh ? "正在恢复…" : "Restoring…") : (isZh ? "恢复购买" : "Restore purchases")}
      </button> : null}
      {notice ? <p className="companion-plan-note" role="status">{notice}</p> : null}
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
      {native ? (
        <button className="companion-text-button" type="button" disabled={loadingProducts || busyPlan !== null} onClick={() => void reloadNativeProducts()}>
          {loadingProducts ? (isZh ? "正在读取价格…" : "Loading prices…") : (isZh ? "重新读取价格" : "Retry prices")}
        </button>
      ) : null}
      {session ? <button className="companion-text-button" type="button" onClick={onOpenAccount}>
        {isZh ? "数据与账号" : "Data and account"}
      </button> : null}
      {session ? <button className="companion-text-button" type="button" onClick={() => void onSignOut?.()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button> : null}
    </section>
  );
}
