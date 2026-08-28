# 三慢问道 AI App Store 发布清单

## 已锁定的首版技术信息

- App 名称：`三慢问道：AI 问道`（英文 `Wendao AI: Tao Companion`）
- App Store Connect Apple ID：`6796945428`
- Bundle ID：`com.yonge6.wendao`
- 当前准备版本：`1.3 (6)`
- 最低系统：iOS 15；首版仅支持 iPhone
- 上架范围：除中国大陆外的 174 个可选国家与地区；中国大陆因图书内容出版许可要求暂不分发
- 发布方式：审核通过后手动发布
- 主分类：生活（Lifestyle）；次分类：图书（Books）
- 隐私政策：`https://wendao.wonderelian.com/privacy.html`
- 支持网址：`https://wendao.wonderelian.com/`
- 定价：免费；首版无 App 内购买

Apple Developer App ID 与 App Store Connect 应用记录均已创建；产品名、Bundle ID、SKU 和 Apple ID 现为首版发布身份，不随意更换。

## 商店文案草案

副标题：`以《道德经》回应真实处境`

推广短句：`不是通用聊天。AI 问道以你正在读的章节、持续对话和可控记忆为依据，陪你看清处境、辨认选择、落下一步。`

关键词：`老子,帛书,国学,哲学,阅读,冥想,人生,古籍,拼音,智慧,反思`

审核备注：完整 81 章无需登录即可离线阅读。版本 1.3 的主要更新“AI 问道”使用当前章节、持续对话和用户可控记忆生成反思回应；使用前必须通过 Apple 或 Google 登录，并以 StoreKit 订阅。有效会员不限次数提问，可管理记忆、恢复购买、导出资料与删除账号。应用不提供医疗、心理、法律、财务或确定性的命运判断。

## 每次发布固定流程

1. 内容与 H5 改动进入同一提交，运行 `npm run ios:sync`；脚本会逐文件比较 `dist/client` 和 iOS 内置包，并核对 81 章清单。
2. 运行 `npm run test`、`npm run test:runtime`、`npm run test:sites` 和 `npm run ios:build:simulator`。
3. 将 H5 发布并验证正式域名；App 二进制使用同一提交创建 Archive。App Store 审核导致的上线时间差不等于代码分叉。
4. 运行 `npm run ios:distribution:readiness`。所有项目为 PASS 后，才能执行 Archive、Validate App 和 Distribute App。
5. App Store Connect 中确认隐私问卷与 `PrivacyInfo.xcprivacy` 一致，再上传 6.9 英寸 iPhone 中英文截图。

## 当前发布进度

- `com.yonge6.wendao` 明确 App ID 已于 2026-08-01 注册完成。
- App Store Connect 应用记录已于 2026-08-01 创建，Apple ID 为 `6796945428`，SKU 为 `WENDAO-IOS-1`。
- Xcode 托管签名已完成版本 `1.0 (1)` 的归档、导出和 App Store Connect 上传；命令行钥匙串目前仍只枚举到开发证书，因此 `ios:distribution:readiness` 的本地证书与描述文件探测仍会显示 `BLOCKED`，不把实际上传成功静默改写为脚本通过。
- 12 张中英文 6.9 英寸商店海报均已通过本地尺寸、透明通道与语言分组校验；英文（美国）与简体中文本地化现各使用 6 张当前真实界面截图。
- 英文（美国）已设为 App 主语言。中英文名称、副标题、描述、关键词、推广文本、支持网址、营销网址和隐私政策网址均已保存，其中英文描述已按当前三层文本、逐句今译、本章主旨、三条生活启发与人生说明书能力重写。
- 主分类为图书、次分类为生活；年龄分级、内容版权和审核联系信息已配置。
- App 隐私问卷已发布：姓名、其他联系信息、其他用户内容、用户 ID、产品交互和其他数据按实际用途披露；均不用于跟踪。
- 定价为免费，供应范围已配置为除中国大陆外的 174 个国家和地区，审核通过后手动发布。
- 构建版本 `1.0 (3)` 已完成真机与模拟器构建、Archive、App Store 导出和上传，并已安装至“永歌14PM”。该构建内含完整 81 章离线阅读内容与最新“沿途所作”入口。

## 当前审核状态

- 2026-08-14，Apple 以 Guideline 2.1 要求补充中国大陆图书内容出版许可，iOS `1.0 (2)` 因而被拒。
- 中国大陆随即从供应范围移除；当前配置为其余 174 个国家和地区。已在审核消息中说明不在中国大陆分发，并同步更新商店描述、审核备注与 6 张新版截图。
- 原拒绝审核单已移除；构建已更新为 `1.0 (3)`，并向 App Review 补充说明英文主语言、更新后的商店资料以及不在中国大陆分发。
- 2026-08-15，英文（美国）与简体中文商店本地化均已保留并完成：两种语言各有 6 张当前真实界面的 6.9 英寸 iPhone 截图，中文推广文本、描述与关键词也已重新保存；英文（美国）仍为主语言。
- `1.0 (3)` 已加入新审核单并正式提交。App Store Connect 提交编号为 `18101686-dc8e-4232-9c98-3aa4c0cafd45`，当前状态为“正在等待审核 / 等待审核”。审核通过后仍按“手动发布”设置由开发者确认上线。
- 若未来取得与开发者主体一致且有效的出版许可，再单独评估恢复中国大陆分发。

## 2026-08-14 回归结果

- `npm run test`：26/26 通过。
- `npm run validate:chapters`：81/81 章与帛书完整性校验通过。
- `npm run build`：通过，构建清单为 81 章。
- `npm run test:runtime`：47/47 通过；320/390/720 px、目录搜索、连续阅读与中英文结构均在覆盖范围内。
- `npm run test:sites`：4/4 通过。
- `npm run ios:assets:validate`：12/12 张中英文海报通过，均为 1290 × 2796 PNG 且无透明通道。
- `npm run ios:build:simulator`：通过。
- Xcode 托管签名完成 `1.0 (3)` Archive 与上传；App Store Connect 已显示该构建“正在等待审核”。
