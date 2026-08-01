# 三慢问道 App Store 发布清单

## 已锁定的首版技术信息

- App 名称：`三慢问道`（英文 `Wendao: Daodejing`）
- App Store Connect Apple ID：`6796945428`
- Bundle ID：`com.yonge6.wendao`
- 版本：`1.0 (1)`
- 最低系统：iOS 15；首版仅支持 iPhone
- 上架范围：全球所有可选国家与地区；若中国大陆单独要求备案材料，则如实保留该地区待办，不影响其他地区提交
- 发布方式：审核通过后手动发布
- 主分类：图书（Books）；次分类：生活（Lifestyle）
- 隐私政策：`https://wendao.wonderelian.com/privacy.html`
- 支持网址：`https://wendao.wonderelian.com/`
- 定价：免费；首版无 App 内购买

Apple Developer App ID 与 App Store Connect 应用记录均已创建；产品名、Bundle ID、SKU 和 Apple ID 现为首版发布身份，不随意更换。

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
5. App Store Connect 中确认隐私问卷与 `PrivacyInfo.xcprivacy` 一致，再上传 6.9 英寸 iPhone 中英文截图。

## 当前发布进度

- `com.yonge6.wendao` 明确 App ID 已于 2026-08-01 注册完成。
- App Store Connect 应用记录已于 2026-08-01 创建，Apple ID 为 `6796945428`，SKU 为 `WENDAO-IOS-1`。
- Xcode 托管签名已完成版本 `1.0 (1)` 的归档、导出和 App Store Connect 上传；命令行钥匙串目前仍只枚举到开发证书，因此 `ios:distribution:readiness` 的本地证书与描述文件探测仍会显示 `BLOCKED`，不把实际上传成功静默改写为脚本通过。
- 12 张中英文 6.9 英寸商店海报均已通过本地尺寸、透明通道与语言分组校验。为清除 App Store Connect 的英文截屏“上传中”僵尸状态，提交前删除了英文独立截屏组；当前英文商店页继承 6 张中文主语言截屏，本地 6 张英文海报仍完整保留，待 Apple 素材后台稳定后在后续元数据版本恢复。
- 中英文名称、副标题、描述、关键词、支持网址、营销网址和隐私政策网址均已保存。
- 主分类为图书、次分类为生活；年龄分级、内容版权和审核联系信息已配置。
- App 隐私问卷已发布：姓名、其他联系信息、其他用户内容、用户 ID、产品交互和其他数据按实际用途披露；均不用于跟踪。
- 定价为免费，供应范围已配置为全部 175 个国家和地区，审核通过后手动发布。
- 构建版本 `1.0 (1)` 已绑定到 iOS 1.0，内含同一提交生成的 81 章离线阅读内容。

## 当前审核状态

- 2026-08-01 21:34（CST），App Store Connect 已确认“已提交 1 个项目”，iOS `1.0 (1)` 状态为“正在等待审核”。此前“仍有截屏在上传中”的素材处理阻塞已清除。
- 当前状态不是已上架；仍需等待 Apple 审核，审核通过后按“手动发布”设置由开发者确认上线。
- 中国大陆虽已列入供应范围，但如审核或当地分发要求补充 ICP/备案等合规材料，需按实际要求处理；此配置不代表已经获得当地分发批准。

## 2026-08-01 回归结果

- `npm run test`：24/24 通过。
- `npm run validate:chapters`：81/81 章与帛书完整性校验通过。
- `npm run build`：通过，构建清单为 81 章、提交 `48382f0`。
- `npm run test:runtime`：24/24 通过；320/390/720 px、目录搜索、连续阅读与中英文结构均在覆盖范围内。
- `npm run test:sites`：4/4 通过。
- `npm run ios:assets:validate`：12/12 张中英文海报通过，均为 1290 × 2796 PNG 且无透明通道。
- `npm run ios:distribution:readiness`：5/7 通过；两个未通过项仅反映命令行无法枚举 Apple Distribution 私钥和 App Store 描述文件，实际 Xcode 托管签名上传已成功。
