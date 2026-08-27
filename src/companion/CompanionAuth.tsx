import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  installNativeAuthListener,
  signOutCompanion,
  startCompanionSignIn,
  type CompanionAuthProvider,
} from "./auth";
import { companionClient } from "./client";

type CompanionAuthProps = {
  language: "zh" | "en";
  children: (session: Session, signOut: () => Promise<void>) => ReactNode;
};

let cachedSession: Session | null | undefined;

export default function CompanionAuth({ language, children }: CompanionAuthProps) {
  const [session, setSession] = useState<Session | null>(cachedSession ?? null);
  const [loading, setLoading] = useState(cachedSession === undefined);
  const [busyProvider, setBusyProvider] = useState<CompanionAuthProvider | null>(null);
  const [error, setError] = useState("");
  const isZh = language === "zh";

  useEffect(() => {
    const client = companionClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    void client.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) throw sessionError;
        cachedSession = data.session;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        cachedSession = null;
        setSession(null);
        setLoading(false);
        setError("AUTH_STATUS_FAILED");
      });
    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      cachedSession = nextSession;
      setSession(nextSession);
      setLoading(false);
    });
    let nativeListener: Awaited<ReturnType<typeof installNativeAuthListener>> = null;
    void installNativeAuthListener((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "AUTH_FAILED");
    }).then((listener) => {
      nativeListener = listener;
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      void nativeListener?.remove();
    };
  }, []);

  const signIn = async (provider: CompanionAuthProvider) => {
    setBusyProvider(provider);
    setError("");
    try {
      await startCompanionSignIn(provider);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "AUTH_FAILED");
    } finally {
      setBusyProvider(null);
    }
  };

  if (loading) {
    return <div className="companion-loading" role="status">{isZh ? "正在确认登录状态…" : "Checking your sign-in…"}</div>;
  }
  if (session) {
    return children(session, signOutCompanion);
  }

  return (
    <section className="companion-auth" aria-labelledby="companion-auth-title">
      <span className="drawer-kicker">{isZh ? "问道同行" : "Wendao Companion"}</span>
      <h3 id="companion-auth-title">
        {isZh ? "让每一次提问，延续成一段理解自己的路。" : "Let each question become part of a longer path toward understanding yourself."}
      </h3>
      <p>
        {isZh
          ? "登录后，对话、记忆与会员权益会在网页和 iPhone 之间同步。人生说明书不是使用 AI 的前提。"
          : "Sign in to keep conversations, memories, and membership in sync across the web and iPhone. A life manual is never required."}
      </p>
      <div className="companion-auth-actions">
        <button type="button" onClick={() => void signIn("apple")} disabled={busyProvider !== null}>
          <strong></strong>
          <span>{busyProvider === "apple" ? (isZh ? "正在前往 Apple…" : "Opening Apple…") : (isZh ? "使用 Apple 登录" : "Continue with Apple")}</span>
        </button>
        <button type="button" onClick={() => void signIn("google")} disabled={busyProvider !== null}>
          <strong>G</strong>
          <span>{busyProvider === "google" ? (isZh ? "正在前往 Google…" : "Opening Google…") : (isZh ? "使用 Google 登录" : "Continue with Google")}</span>
        </button>
      </div>
      <p className="companion-disclosure">
        {isZh
          ? "问道同行为付费 AI 服务，没有免费问答。AI 回答由 DeepSeek 在中国处理；开启自动记忆后，只保存与你的长期思考真正相关的摘要，你可以随时查看、修改、暂停或清除。"
          : "Wendao Companion is a paid AI service with no free questions. DeepSeek processes AI responses in China. With automatic memory enabled, only summaries relevant to your longer journey are saved; you can review, edit, pause, or clear them at any time."}
      </p>
      {error ? (
        <p className="form-message is-error">
          {error === "COMPANION_NOT_CONFIGURED"
            ? (isZh ? "登录服务尚未配置完成。阅读功能不受影响。" : "Sign-in is not configured yet. Reading remains fully available.")
            : error === "AUTH_STATUS_FAILED"
              ? (isZh ? "暂时无法确认登录状态，请检查网络后重试。" : "We could not confirm your sign-in. Check your connection and try again.")
            : (isZh ? "登录没有完成，请重试。" : "Sign-in did not complete. Please try again.")}
        </p>
      ) : null}
    </section>
  );
}
