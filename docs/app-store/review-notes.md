# App Review Notes · Version 1.1 draft

## English (paste into App Store Connect)

Wendao is a bilingual Daodejing reading app. No login or purchase is required for the complete 81-chapter reading experience, which remains bundled locally and available offline.

Optional network features are found in the More drawer: Life Manual, questions, and feedback. Life Manual asks the user to voluntarily enter a name, birth date, exact birth time, and birthplace. It returns a foundational reading and 12 detailed reflective themes, and combines the verified summary with the theme of the current chapter. It does not render a BodyGraph and does not provide medical, psychological, legal, financial, or deterministic advice.

The optional Wendao Companion is a paid AI reflection service. It requires Apple or Google sign-in and offers App Store auto-renewable monthly and annual subscriptions with no free trial. Active members may ask unlimited questions and can inspect, pause, delete, or clear automatic memory. The iOS app uses StoreKit only: it contains no Stripe checkout or external purchase link. Existing web memberships are honored after sign-in without steering users to web payment.

AI responses are grounded in the current bundled chapter and processed by DeepSeek in China. The app clearly discloses this before sign-in. It does not provide medical, psychological, legal, financial, or deterministic advice, and immediate safety language receives a fixed crisis-support response rather than a model-generated answer.

The app uses only standard HTTPS encryption. `ITSAppUsesNonExemptEncryption` is set to false.

China mainland has been removed from App availability. This version is configured for distribution in 174 other countries and regions and will not be distributed in China mainland.

Suggested review path:

1. Launch the app and read Chapter 8 offline.
2. Open Contents and search for “上善如水” or “water”.
3. Switch between Chinese and English in the fixed reading header.
4. Open More → My Wendao, sign in with the review account, and inspect the monthly/annual StoreKit plans, restore purchases, memory controls, and weekly reflection.

## 中文备份

三慢问道是一款中英文《道德经》阅读 App。完整 81 章及核心阅读界面无需登录或购买，随 App 本地打包并可离线使用。

“更多”抽屉中包含自愿使用的联网功能：人生说明书、提问与反馈。人生说明书会在用户主动输入称呼、出生日期、准确时间和出生地点后，返回基础解读与 12 个详细的自我观察主题，并与当前章节主题结合。应用不绘制 BodyGraph，不提供医疗、心理、法律、财务或确定性的命运判断。

可选的“问道同行”是付费 AI 反思服务，使用前必须以 Apple 或 Google 登录。iOS 仅通过 StoreKit 提供无免费试用的月付与年付自动续期订阅，不显示 Stripe 或任何外部购买链接；已有网页会员登录后可以直接使用。有效会员问答不限次数，并可查看、暂停、删除或清空自动记忆。AI 回答以当前章节为依据，由位于中国的 DeepSeek 处理；医疗、心理、法律、财务与紧急安全场景均有明确边界。

中国大陆已从 App 供应范围移除；本版本仅在其余 174 个国家和地区分发，不在中国大陆 App Store 上架。
