# App Review Notes · Version 1.4

## English (paste into App Store Connect)

Wendao AI is a bilingual Daodejing reading and chapter-grounded reflection app. Today’s recommended chapter is always free, and a reader may deliberately choose 10 additional chapters to keep free on the device. Merely opening Contents or search does not consume a choice.

Optional network features are found in the More drawer: Life Manual, questions, and feedback. Life Manual asks the user to voluntarily enter a name, birth date, exact birth time, and birthplace. It returns a foundational reading and 12 detailed reflective themes, and combines the verified summary with the theme of the current chapter. It does not render a BodyGraph and does not provide medical, psychological, legal, financial, or deterministic advice.

The optional Wendao AI service is the major feature in version 1.4. It responds from the current bundled chapter, the user's ongoing dialogue, and user-controlled memory. It requires Apple or Google sign-in and offers App Store auto-renewable monthly and annual subscriptions with no free trial. Either subscription unlocks all 81 chapters and unlimited AI questions. The separate non-consumable “Unlock All Chapters Forever” purchase unlocks the complete reading library permanently and does not include AI, memory, or weekly reflection. All three purchases use StoreKit, display localized App Store prices, and support Restore Purchases. The iOS app shows no Stripe checkout or external web-purchase link. H5 does not sell access and directs readers to the iPhone app.

AI responses are grounded in the current bundled chapter and processed by DeepSeek in China. The app clearly discloses this before sign-in. It does not provide medical, psychological, legal, financial, or deterministic advice, and immediate safety language receives a fixed crisis-support response rather than a model-generated answer.

The app uses only standard HTTPS encryption. `ITSAppUsesNonExemptEncryption` is set to false.

Version 1.4 is submitted for worldwide availability, including China mainland. The primary App Store category remains Lifestyle. The app includes bundled bilingual Daodejing reading content and does not claim to hold a China mainland internet publishing permit. A previous submission removed China mainland after Guideline 2.1 requested publication authorization; this submission intentionally asks App Review to reassess worldwide availability using the complete and current product, category, metadata, and review notes. If additional authorization is required, please tell us the exact document or availability change needed.

Suggested review path:

1. Launch the app and read today’s recommended chapter offline.
2. Open Contents, choose a locked chapter, and confirm that the app offers one of 10 permanent free chapter choices before showing the StoreKit options.
3. Switch between Chinese and English in the fixed reading header.
4. Open More → Wendao AI, sign in with Apple, and inspect monthly, annual, and one-time lifetime StoreKit options plus Restore Purchases. No separate demo credentials are required because sign-in is federated; App Review may use its Apple sandbox account and test the submitted purchases without a real charge.

## 中文备份

三慢问道 AI 是一款中英文《道德经》阅读与章节 AI 反思 App。今日推荐章节始终免费，读者还可以主动选择 10 章永久保留；仅浏览目录或搜索不会消耗名额。

“更多”抽屉中包含自愿使用的联网功能：人生说明书、提问与反馈。人生说明书会在用户主动输入称呼、出生日期、准确时间和出生地点后，返回基础解读与 12 个详细的自我观察主题，并与当前章节主题结合。应用不绘制 BodyGraph，不提供医疗、心理、法律、财务或确定性的命运判断。

版本 1.4 的主要功能“AI 问道”是付费 AI 反思服务，回应以当前章节、持续对话和用户可控记忆为依据。使用前必须以 Apple 或 Google 登录。iOS 仅通过 StoreKit 提供无免费试用的月付、年付订阅与一次性“永久解锁全部章节”：订阅解锁 81 章及不限次数 AI，一次性买断只解锁完整阅读且不含 AI。三种购买均可恢复。App 不显示 Stripe 或外部购买链接；H5 不销售权益，只引导下载 iPhone App。

版本 1.4 申请全球供应，包含中国大陆。主要类别仍为“生活”。应用包含中英文《道德经》离线阅读内容，不声称持有中国大陆网络出版许可；此前曾按 Guideline 2.1 的要求移除中国大陆，本次主动提交完整、真实的当前产品与说明，请 App Review 正式复核。如仍需许可或调整供应范围，请明确告知所需材料。
