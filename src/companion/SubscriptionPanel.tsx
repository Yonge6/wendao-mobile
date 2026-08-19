type SubscriptionPanelProps = {
  language: "zh" | "en";
  onSignOut: () => Promise<void>;
};

export default function SubscriptionPanel({ language, onSignOut }: SubscriptionPanelProps) {
  const isZh = language === "zh";
  return (
    <section className="companion-subscription" aria-labelledby="companion-subscription-title">
      <span className="drawer-kicker">{isZh ? "问道同行会员" : "Wendao Companion membership"}</span>
      <h3 id="companion-subscription-title">{isZh ? "选择一段同行的时间" : "Choose how long we travel together"}</h3>
      <p>{isZh ? "月付与年付都会开放，年付更从容。每月问答额度会在购买前清楚显示。" : "Monthly and annual plans will both be available, with annual highlighted. Your exact monthly question allowance is always shown before purchase."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <article className="is-featured">
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{isZh ? "年付" : "Annual"}</strong>
          <small>{isZh ? "适合持续记录、回看与实践" : "For ongoing reflection, memory, and practice"}</small>
        </article>
        <article>
          <strong>{isZh ? "月付" : "Monthly"}</strong>
          <small>{isZh ? "按月保持灵活" : "Keep it flexible month to month"}</small>
        </article>
      </div>
      <p className="companion-plan-note">
        {isZh ? "订阅购买将在价格与额度评测完成后接通。" : "Purchases will open after pricing and allowance evaluation is complete."}
      </p>
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button>
    </section>
  );
}

