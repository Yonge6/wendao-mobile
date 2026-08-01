# 三慢问道 App Store 发布清单

## 已锁定的首版技术信息

- App 名称：`三慢问道`（英文 `Wendao`）
- Bundle ID：`com.yonge6.wendao`
- 版本：`1.0 (1)`
- 最低系统：iOS 15；支持 iPhone 与 iPad
- 主分类：图书（Books）；次分类：生活（Lifestyle）
- 隐私政策：`https://wendao.wonderelian.com/privacy.html`
- 支持网址：`https://wendao.wonderelian.com/`
- 定价：免费；首版无 App 内购买

在 Apple Developer 后台创建 App ID 或 App Store Connect 记录前，产品名和 Bundle ID 仍可调整；创建后应把它们视为发布身份，不随意更换。

## 商店文案草案

副标题：`帛书乙本《道德经》慢读`

推广短句：`慢下来，读原典，也读自己。完整 81 章、帛书乙本底本校读、逐句今译与可实践的生活启发。`

关键词：`道德经,老子,帛书,国学,阅读,哲学,冥想,人生`

审核备注：应用无需登录即可离线阅读完整 81 章。人生说明书为可选功能，用户主动录入出生日期、时间和地点后生成简要结果；不绘制 BodyGraph，不提供医疗、心理或命运判定。底部提问功能当前明确标注为体验版回应。网络可用时，反馈、匿名产品事件及用户主动提交的个性化资料会发送至三慢问道服务。

## 每次发布固定流程

1. 内容与 H5 改动进入同一提交，运行 `npm run ios:sync`；脚本会逐文件比较 `dist/client` 和 iOS 内置包，并核对 81 章清单。
2. 运行 `npm run test`、`npm run test:runtime`、`npm run test:sites` 和 `npm run ios:build:simulator`。
3. 将 H5 发布并验证正式域名；App 二进制使用同一提交创建 Archive。App Store 审核导致的上线时间差不等于代码分叉。
4. 运行 `npm run ios:distribution:readiness`。所有项目为 PASS 后，才能执行 Archive、Validate App 和 Distribute App。
5. App Store Connect 中确认隐私问卷与 `PrivacyInfo.xcprivacy` 一致，再上传 6.9 英寸 iPhone 与 13 英寸 iPad 截图。

## 当前外部阻塞

- 为 `com.yonge6.wendao` 注册明确 App ID。
- 在本机创建或导入含私钥的 Apple Distribution 证书。
- 创建对应的 App Store provisioning profile。
- 在 App Store Connect 创建应用记录，确认名称可用、SKU、分类、年龄分级、隐私问卷和联系人。
- 完成首版截图、描述、审核联系信息与版权信息后上传构建。
