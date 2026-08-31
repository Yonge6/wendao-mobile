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
  onSignOut: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState<"export" | "delete" | "manage" | null>(null);
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
    if (!config || confirmation !== "DELETE" || busy) return;
    setBusy("delete");
    setError("");
    try {
      await deleteCompanionAccount(config.apiUrl, session.access_token);
      await onSignOut();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "账号删除没有完成。" : "Account deletion did not complete."));
      setBusy(null);
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
        <p>{isZh ? "你可以导出自己的资料，或永久删除账号及云端内容。" : "Export your information or permanently delete your account and cloud data."}</p>
      </header>
      <button className="companion-account-action" type="button" disabled={busy !== null} onClick={() => void exportData()}>
        {busy === "export" ? (isZh ? "正在整理…" : "Preparing…") : (isZh ? "导出我的数据" : "Export my data")}
      </button>
      {!confirming ? (
        <button className="companion-text-button is-danger" type="button" onClick={() => setConfirming(true)}>{isZh ? "删除账号" : "Delete account"}</button>
      ) : (
        <div className="companion-delete-confirmation">
          <strong>{isZh ? "此操作不可恢复" : "This cannot be undone"}</strong>
          <p>{entitlementSource === "apple"
            ? (isZh ? "删除账号不会自动取消 App Store 订阅。请先在 App Store 管理订阅，再继续删除。" : "Deleting your account does not automatically cancel an App Store subscription. Manage it in the App Store before continuing.")
            : (isZh ? "账号、对话、记忆和云端资料会被永久删除；有效的 Stripe 订阅也会立即取消。" : "Your account, conversations, memories, and cloud data will be permanently deleted; an active Stripe subscription will also be cancelled immediately.")}</p>
          {Capacitor.getPlatform() === "ios" && entitlementSource === "apple" ? (
            <button className="companion-text-button" type="button" disabled={busy !== null} onClick={() => void manageApple()}>{isZh ? "先管理 App Store 订阅" : "Manage App Store subscription"}</button>
          ) : null}
          <label htmlFor="companion-delete-confirmation">{isZh ? "输入 DELETE 确认" : "Type DELETE to confirm"}</label>
          <input id="companion-delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoCapitalize="characters" autoComplete="off" />
          <div>
            <button type="button" onClick={() => { setConfirming(false); setConfirmation(""); }}>{isZh ? "取消" : "Cancel"}</button>
            <button className="is-danger" type="button" disabled={confirmation !== "DELETE" || busy !== null} onClick={() => void removeAccount()}>{busy === "delete" ? (isZh ? "正在删除…" : "Deleting…") : (isZh ? "永久删除" : "Delete permanently")}</button>
          </div>
        </div>
      )}
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
    </section>
  );
}
