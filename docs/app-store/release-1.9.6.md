# Wendao AI 1.9.6 (31)

## Scope

This release follows the Yixiu 1.19 App Store treatment for Apple's iPhone Duo without copying Yixiu product content. Wendao remains a universal iPhone and iPad app and adapts from current window geometry rather than device names or fold-state APIs.

## Product and QA

- Added regression coverage for the iPhone Duo outer-window size (466 x 678 CSS points) and unfolded-window size (669 x 951 CSS points).
- Verified the reading header, chapter content, directory, More drawer and AI entry remain within the active window with no horizontal overflow.
- Existing 800-point reader-and-conversation workspace behavior remains unchanged; narrower Duo windows keep the single-column reading flow.
- Captured native Simplified Chinese and English outer-display screenshots at 1398 x 2034. No stretched or fabricated inner-display screenshot is used.

## App Store creative assets

Prepared independent bilingual title and search-result creatives at Apple's required dimensions:

- Title: 3840 x 1646 PNG, Chinese and English.
- Search result: 3840 x 2560, English PNG and Chinese JPEG (the JPEG is a visually equivalent lightweight upload fallback after App Store Connect stalled while processing the PNG).
- Artwork uses the Wendao icon, restrained teal/gold palette, and Daodejing reading/reflection positioning. No price, QR code, fabricated UI or device mockup appears in these marketing assets.

## What is new — English

Wendao now adapts to the new iPhone Duo display sizes, with the reading experience, directory, More drawer and AI conversation fitting the active window. This update also refreshes the App Store presentation with bilingual creative assets. Existing reading access, membership benefits and prices are unchanged.

## 更新说明 — 简体中文

三慢问道现已适配新款 iPhone Duo 的显示尺寸，阅读、目录、更多抽屉与 AI 对话会随当前窗口自然调整。本次也更新了中英文 App Store 展示素材。现有阅读权益、会员功能和价格保持不变。

## Native screenshot evidence

- `wendao-1.9.6-duo-zh.png`: 1398 x 2034, SHA-256 `a02412cf4185b26309dc95780a21952c2a9a13e918c54fd722caa75fbfc0576c`
- `wendao-1.9.6-duo-en.png`: 1398 x 2034, SHA-256 `696b5cb1dc70c97fb90aa341e5691dcc24c218953219a88fa732f314c106a091`

## Submission

- Archive: `Wendao-1.9.6-31.xcarchive`, codesign verified, `ARCHIVE SUCCEEDED`.
- Upload: build 31 uploaded and processed by Apple; App Store Connect build ID `272de0c2-8228-4648-b4f2-a42c46ade3ff`.
- Version record: build 31 is bound to iOS 1.9.6. Simplified Chinese and English metadata, native iPhone Duo screenshots, title creatives and search-result creatives are saved in App Store Connect.
- Review: submitted at 2026-10-09 16:06 CST; submission ID `1d1ae92d-0e3d-41fa-9ebb-d86fb29c9dcc`; App Store Connect state `Waiting for Review` (`等待审核`). This is submitted, not approved or released.
