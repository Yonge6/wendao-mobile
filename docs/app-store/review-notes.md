# App Review Notes · Version 1.3

## English (paste into App Store Connect)

Wendao AI is a bilingual Daodejing reading and chapter-grounded reflection app. No login or purchase is required for the complete 81-chapter reading experience, which remains bundled locally and available offline.

Optional network features are found in the More drawer: Life Manual, questions, and feedback. Life Manual asks the user to voluntarily enter a name, birth date, exact birth time, and birthplace. It returns a foundational reading and 12 detailed reflective themes, and combines the verified summary with the theme of the current chapter. It does not render a BodyGraph and does not provide medical, psychological, legal, financial, or deterministic advice.

The optional Wendao AI service is the major feature in version 1.3. It responds from the current bundled chapter, the user's ongoing dialogue, and user-controlled memory. It requires Apple or Google sign-in and offers App Store auto-renewable monthly and annual subscriptions with no free trial. Active members may ask unlimited questions and can inspect, pause, delete, or clear automatic memory. The iOS app uses StoreKit only: it does not show Stripe checkout or any external web-purchase link. H5 does not currently sell memberships; Apple subscription entitlements are honored there after sign-in.

AI responses are grounded in the current bundled chapter and processed by DeepSeek in China. The app clearly discloses this before sign-in. It does not provide medical, psychological, legal, financial, or deterministic advice, and immediate safety language receives a fixed crisis-support response rather than a model-generated answer.

The app uses only standard HTTPS encryption. `ITSAppUsesNonExemptEncryption` is set to false.

China mainland has been removed from App availability. This version is configured for distribution in 174 other countries and regions and will not be distributed in China mainland.

Suggested review path:

1. Launch the app and read Chapter 8 offline.
2. Open Contents and search for “上善如水” or “water”.
3. Switch between Chinese and English in the fixed reading header.
4. Open More → Wendao AI, sign in with Apple, and inspect the monthly/annual StoreKit plans, restore purchases, memory controls, chapter-grounded conversation, and weekly reflection. No separate demo credentials are required because sign-in is federated; App Review may use its Apple sandbox account and test the submitted subscriptions without a real charge.

## 中文备份

三慢问道 AI 是一款中英文《道德经》阅读与章节 AI 反思 App。完整 81 章及核心阅读界面无需登录或购买，随 App 本地打包并可离线使用。

“更多”抽屉中包含自愿使用的联网功能：人生说明书、提问与反馈。人生说明书会在用户主动输入称呼、出生日期、准确时间和出生地点后，返回基础解读与 12 个详细的自我观察主题，并与当前章节主题结合。应用不绘制 BodyGraph，不提供医疗、心理、法律、财务或确定性的命运判断。

版本 1.3 的主要更新“AI 问道”是付费 AI 反思服务，回应以当前章节、持续对话和用户可控记忆为依据。使用前必须以 Apple 或 Google 登录。iOS 仅通过 StoreKit 提供无免费试用的月付与年付自动续期订阅，不显示 Stripe 或任何外部购买链接；H5 当前不销售会员，Apple 订阅权益可在登录后同步使用。有效会员问答不限次数，并可查看、暂停、删除或清空自动记忆。AI 回答由位于中国的 DeepSeek 处理；医疗、心理、法律、财务与紧急安全场景均有明确边界。

中国大陆已从 App 供应范围移除；本版本仅在其余 174 个国家和地区分发，不在中国大陆 App Store 上架。
