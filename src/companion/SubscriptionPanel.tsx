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
      <p>{isZh ? "有效会员不限问答次数。没有试用期，核心阅读、搜索与分享仍可免费使用。" : "Active members can ask unlimited questions. There is no trial; core reading, search, and sharing remain free."}</p>
      <div className="companion-plans" aria-label={isZh ? "订阅方案" : "Subscription plans"}>
        <article className="is-featured">
          <span>{isZh ? "推荐" : "Recommended"}</span>
          <strong>{isZh ? `年付 ¥${COMPANION_PLANS.annual.cny}` : `Annual US$${COMPANION_PLANS.annual.usd}`}</strong>
          <small>{isZh ? "持续记录、自动记忆与每周回看；海外基准 US$199.99" : "Unlimited questions, memory, and weekly reflection"}</small>
        </article>
        <article>
          <strong>{isZh ? `月付 ¥${COMPANION_PLANS.monthly.cny}` : `Monthly US$${COMPANION_PLANS.monthly.usd}`}</strong>
          <small>{isZh ? "按月保持灵活；海外基准 US$19.99" : "Unlimited questions, billed monthly"}</small>
        </article>
      </div>
      <p className="companion-plan-note">
        {isZh ? "其他国家和地区按美元基准显示当地商店价格。" : "Other countries and regions show localized storefront prices based on USD."}
      </p>
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>
        {isZh ? "退出当前账号" : "Sign out"}
      </button>
    </section>
  );
}
import { COMPANION_PLANS } from "./plans";

