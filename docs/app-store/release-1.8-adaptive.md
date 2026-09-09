# 1.8 (19) adaptive workspace release

App 6796945428 · com.yonge6.wendao · source fa6b2a757a4cb3673663222112fccc790133d101.

## Changes

At 800 CSS px and wider, opening AI creates a reader and conversation side by side, capped at 720 px per pane. A narrower window retains the existing dialog. The same conversation component stays mounted across size changes, preserving drafts, cloud history and the in-flight request. A passage anchor preserves the reader's position when its column reflows. Global sheets remain above the wide conversation.

All unpublished 1.8 improvements remain included: quiet modern Laozi-inspired dialogue, direct Photos save, higher save/copy feedback, and lower lifetime reading price (China mainland CNY9.90, USD7 base elsewhere). No subscription price, reading data or AI entitlement changes were made in this adaptation.

## Verification

- 148 unit checks pass; protected runtime and 81-chapter validation pass.
- 10 existing conversation checks plus 3 adaptive checks pass. Draft/history and one streaming request survive repeated 390/799/800/820/1024/1366 px changes and short windows.
- 6 related product checks pass: iPad portrait, landscape, narrow multitasking; iPhone viewport; reduced-height search.
- English header wrapping discovered in native build 18 was fixed in 19 and covered by a regression assertion.
- Two production UI checks pass in Chinese and English, including independent reading access, directory access beside AI and passage restoration.
- Native iPhone 17 Pro Max and iPad Pro 13-inch simulator builds installed and launched; iPad portrait/landscape and both language layouts inspected. Screenshots are actual iOS 26.5 simulator pixels. The simulator's raw landscape PNG was rotated upright and converted to JPEG without compositing or fabricated UI.
- No iPhone Duo simulator/device was available in Xcode 26.6. No device-specific API, fold-angle support or actual Duo validation is claimed. Apple's official specifications: https://www.apple.com/iphone-duo/specs/ . Layout uses current window width and does not infer points from physical pixel resolution.

## Delivery

- H5 production https://wendao.wonderelian.com/ reports 1.8 (19), exact source fa6b2a7; public files match the final CI artifact.
- GitHub Pages workflow 34390958644 and iOS workflow 34390958662 succeeded for fa6b2a7.
- Rollback directory: /srv/wonderelian/backups/wendao-before-fa6b2a7-20260910. Previous shipped d109fd9 is also preserved under /srv/wonderelian/backups/wendao-before-41748a3-20260910.
- Archive: ~/Library/Developer/Xcode/Archives/2026-09-10/Wendao AI 1.8 (19).xcarchive.
- Apple upload succeeded; processed build UUID c8f7362a-3dab-41c6-b2c5-6ce204e6a955.
- Build 18 (e93591b3-909f-4581-96bf-f5bef6af570f) was uploaded during native QA and is superseded by 19; do not submit it.
- Old waiting submission 58e07416-57f8-4ab1-bea3-6ebde5eb908a was removed only after replacement readiness.
- English and Simplified Chinese promotion, description, What's New, and reviewer notes saved; build 19 selected. Both iPad locales now include the native wide screenshot, with the existing reading screenshot retained. The English wide screenshot is first; the Chinese upload was retried after Apple processing stalled. All seven iPhone screenshots retained.
- Automatic release after approval, immediate updates for all users, and existing ratings preserved.

Final review submission: successfully submitted on 2026-09-10 at 03:20 Asia/Shanghai. Apple readback shows 1.8 (19), one submitted item, Waiting for Review. Submission ID: 9b5b9e5b-3d18-4ae1-9bbb-773ce6231676.

Review URL: https://appstoreconnect.apple.com/apps/6796945428/distribution/reviewsubmissions/details/9b5b9e5b-3d18-4ae1-9bbb-773ce6231676

The Chinese wide screenshot stalled during processing. Only that new image was deleted and reuploaded, then Apple validation and final submission succeeded. Readback evidence: work/release-adaptive/apple-submission19.txt.

Local evidence: work/release-adaptive/ contains archive/upload logs, final unit and UI results, public-verification19.json and deployment logs. It is excluded from published artifacts by .vercelignore.
