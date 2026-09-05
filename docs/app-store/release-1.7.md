# App Store 1.7 (15) release preparation

## Verified on 2026-09-05

- App Store Connect app: `6796945428`, bundle: `com.yonge6.wendao`, team: `L855ZVM679`.
- Live App Store Connect version 1.6 is Ready for Distribution with build 11. A new version is required for the work in local builds 12–14.
- Created version 1.7 in App Store Connect and submitted build 15 for review. Its current status is **Waiting for Review**.
- Saved English (US) and Simplified Chinese What's New for iPad support, contextual search, AI conversation continuity, scrolling/retry improvements, relevant memory retrieval, Life Manual share onboarding and startup improvements.
- Updated review notes for 1.7 (15), retaining the payment, privacy, AI-provider and publishing-permit disclosures. Existing descriptions, pricing, availability, contacts and screenshots were not changed.
- Retained automatic release after approval, immediate update availability, and existing ratings. This is a setting, not evidence of release.
- App and Widget use marketing version 1.7 and build number 15 in all four target/configuration combinations.
- Application source archive commit: `67b22b0` (release number change on top of feature commit `2447224`). Later changes to this record and the release-number assertion do not change the archived application source.
- `ios:sync` verified 818 bundled files and all 81 chapters. Runtime, TypeScript and chapter checks passed.
- Release archive succeeded: `/Users/yongyuan/Library/Developer/Xcode/Archives/2026-09-05/Wendao AI 1.7 (15).xcarchive`.
- Simulator build 1.7 (15) succeeded. Installed into the existing Wendao iPad 13-inch simulator; screenshot verification was interrupted by the Mac lock screen.
- `npm test`: 146/146 passed after updating the explicit release-number assertion to 1.7 (15).

## Submission completed at 14:38, 2026-09-05

- App Store Connect accepted iOS version **1.7 (15)** for review.
- Current authoritative status: **Waiting for Review** (`正在等待审核`).
- Review submission ID: `79c94f2d-50e7-470b-962e-bace403b3a60`.
- Apple states that review may take up to 48 hours and will send an email when the review is complete.
- The release remains configured to publish automatically after approval, immediately to all users, while preserving the existing rating.
- The first Simplified Chinese iPad media upload became stuck in processing. It was removed in Media Manager, converted to a clean 2064 × 2752 JPEG without alpha, re-uploaded successfully, and verified before submission. English and Simplified Chinese each have one localized 13-inch iPad screenshot.

## Historical preparation notes

### Continuation at 14:15–14:18, 2026-09-05

- Xcode Organizer now verifies **Uploaded to Apple**, version **1.7 (15)**, uploaded **13:57**. Do not upload this archive again.
- App Store Connect has processed build 15, ID `4b78bb03-dde2-4143-8cb7-2ae66edb83a7`. It was selected in the version form, but saving that selection was interrupted; verify the saved selection on resume.
- Inspected the actual updated iPad simulator reading screen after deliberately keeping chapter 8 free. The portrait layout rendered correctly.
- The Mac locked again before the simulator screenshot could be saved. No iPad screenshots were uploaded and no review submission was made. Unlock and keep the Mac unlocked during the remaining capture/submission workflow.

The initial account-blocker details below are historical; upload is now resolved. Remaining work is screenshots, saving/verifying the selected build and final review submission.

### Continuation after unlock at 14:19–14:23

- Build 15 is selected and saved on version 1.7.
- Captured and visually inspected authentic 13-inch iPad portrait screenshots from the 1.7 (15) simulator build in English and Simplified Chinese.
- Store upload files are JPEG, 2064 × 2752, without an alpha channel:
  - `docs/app-store/screenshots/ipad/en-US/01-reading.jpg`
  - `docs/app-store/screenshots/ipad/zh-Hans/01-reading.jpg`
- Uploaded the English screenshot as the default 13-inch iPad media and configured Simplified Chinese as an independent localization with its Chinese screenshot. App Store Connect shows 1/10 screenshots for each localization.
- App Store Connect showed “Add for Review” enabled. The submission was subsequently confirmed and completed at 14:38.

The earlier account and lock-screen blockers were resolved. Build 15 was uploaded once, processed, selected, paired with localized iPad screenshots, and submitted for review.

## Logs

- `/tmp/wendao-1.7.15-sync.log`
- `/tmp/wendao-1.7.15-archive.log`
- `/tmp/wendao-1.7.15-upload.log` (failed account access, not an upload success)
- `/tmp/wendao-1.7.15-simulator.log`
- `/tmp/wendao-1.7.15-tests.log`

H5 and the AI API already contain the feature work from `2447224`; this release preparation does not introduce another content dataset or change AI/payment behavior.
