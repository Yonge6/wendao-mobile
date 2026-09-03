import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Session } from "@supabase/supabase-js";
import { useState } from "react";

import { deleteCompanionAccount, exportCompanionAccount } from "./api";
import { companionPublicConfig } from "./client";
import { manageStoreKit } from "./storekit";

export default function AccountPanel({
  session,
  language,
  entitlementSource,
  onBack,
  onSignOut,
}: {
  session: Session;
  language: "zh" | "en";
  entitlementSource: string | null;
  onBack: () => void;
  onSignOut: (mode: "switch" | "sign-out" | "deleted") => Promise<void>;
}) {
  const [confirming, setConfirming] = useState<"switch" | "sign-out" | "delete" | null>(null);
  const [busy, setBusy] = useState<"export" | "delete" | "manage" | "switch" | "sign-out" | null>(null);
  const [error, setError] = useState("");
  const isZh = language === "zh";

  const exportData = async () => {
    const config = companionPublicConfig();
    if (!config || busy) return;
    setBusy("export");
    setError("");
    try {
      const payload = await exportCompanionAccount(config.apiUrl, session.access_token);
      const content = JSON.stringify(payload, null, 2);
      const filename = `wendao-account-${payload.exportedAt.slice(0, 10)}.json`;
      if (Capacitor.isNativePlatform()) {
        const written = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "Wendao account export", files: [written.uri] });
      } else {
        const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法导出数据。" : "Your data could not be exported."));
    } finally {
      setBusy(null);
    }
  };

  const removeAccount = async () => {
    const config = companionPublicConfig();
    if (!config || busy) return;
    setBusy("delete");
    setError("");
    try {
      await deleteCompanionAccount(config.apiUrl, session.access_token);
      await onSignOut("deleted");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "账号删除没有完成。" : "Account deletion did not complete."));
      setBusy(null);
    }
  };

  const leaveSession = async (mode: "switch" | "sign-out") => {
    if (busy) return;
    setBusy(mode);
    setError("");
    try {
      await onSignOut(mode);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法退出登录。" : "Could not sign out right now."));
      setBusy(null);
      setConfirming(null);
    }
  };

  const manageApple = async () => {
    setBusy("manage");
    setError("");
    try {
      await manageStoreKit();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法打开 App Store 订阅。" : "App Store subscriptions could not be opened."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="companion-account-panel">
      <button className="companion-text-button" type="button" onClick={onBack}>← {isZh ? "返回对话" : "Back to conversation"}</button>
      <header>
        <span className="drawer-kicker">{isZh ? "数据与账号" : "Data and account"}</span>
        <h3>{isZh ? "你的记录，应当由你掌握。" : "Your record should remain in your hands."}</h3>
        <p>{isZh ? "切换或退出当前账号，不会删除会员、记录或云端内容。" : "Switching or signing out will not delete your membership, history, or cloud data."}</p>
      </header>
      <div className="companion-account-session-actions">
        <button className="companion-account-action" type="button" disabled={busy !== null} onClick={() => setConfirming("switch")}>
          {isZh ? "切换账号" : "Switch account"}
        </button>
        <button className="companion-account-action is-secondary" type="button" disabled={busy !== null} onClick={() => setConfirming("sign-out")}>
          {isZh ? "退出登录" : "Sign out"}
        </button>
      </div>
      <button className="companion-account-action" type="button" disabled={busy !== null} onClick={() => void exportData()}>
        {busy === "export" ? (isZh ? "正在整理…" : "Preparing…") : (isZh ? "导出我的数据" : "Export my data")}
      </button>
      <button className="companion-text-button is-danger" type="button" disabled={busy !== null} onClick={() => setConfirming("delete")}>{isZh ? "删除账号与数据" : "Delete account and data"}</button>
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
      {confirming ? (
        <div className="companion-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="companion-confirm-title" aria-describedby="companion-confirm-description">
          <button className="companion-confirm-backdrop" type="button" aria-label={isZh ? "取消" : "Cancel"} onClick={() => setConfirming(null)} />
          <section>
            <span className="drawer-kicker">{confirming === "delete" ? (isZh ? "不可恢复" : "Permanent") : (isZh ? "再次确认" : "Confirm")}</span>
            <h4 id="companion-confirm-title">{confirming === "switch"
              ? (isZh ? "确认切换账号？" : "Switch accounts?")
              : confirming === "sign-out"
                ? (isZh ? "确认退出登录？" : "Sign out?")
                : (isZh ? "确认删除账号与全部数据？" : "Delete your account and all data?")}</h4>
            <p id="companion-confirm-description">{confirming === "switch"
              ? (isZh ? "当前账号会安全退出，随后可立即登录另一个账号；会员与记录不会删除。" : "The current account will sign out, then you can immediately use another account. Nothing will be deleted.")
              : confirming === "sign-out"
                ? (isZh ? "只退出当前设备，会员与记录仍会保留。" : "This only signs out on this device. Your membership and history remain.")
                : entitlementSource === "apple"
                  ? (isZh ? "账号、对话、记忆和云端资料会永久删除。App Store 订阅不会自动取消。" : "Your account, conversations, memories, and cloud data will be permanently deleted. Your App Store subscription is not cancelled automatically.")
                  : (isZh ? "账号、对话、记忆和云端资料会永久删除；有效的 Stripe 订阅也会立即取消。" : "Your account, conversations, memories, and cloud data will be permanently deleted; an active Stripe subscription will also be cancelled immediately.")}</p>
            {confirming === "delete" && Capacitor.getPlatform() === "ios" && entitlementSource === "apple" ? (
              <button className="companion-text-button" type="button" disabled={busy !== null} onClick={() => void manageApple()}>{isZh ? "先管理 App Store 订阅" : "Manage App Store subscription"}</button>
            ) : null}
            <div className="companion-confirm-actions">
              <button type="button" disabled={busy !== null} onClick={() => setConfirming(null)}>{isZh ? "取消" : "Cancel"}</button>
              <button className={confirming === "delete" ? "is-danger" : "is-primary"} type="button" disabled={busy !== null} onClick={() => {
                if (confirming === "delete") void removeAccount();
                else void leaveSession(confirming);
              }}>
                {busy ? (isZh ? "正在处理…" : "Working…") : (isZh ? "确认" : "Confirm")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
