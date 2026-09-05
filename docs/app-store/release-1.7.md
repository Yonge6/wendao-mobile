# App Store 1.7 (15) release preparation

## Verified on 2026-09-05

- App Store Connect app: `6796945428`, bundle: `com.yonge6.wendao`, team: `L855ZVM679`.
- Live App Store Connect version 1.6 is Ready for Distribution with build 11. A new version is required for the work in local builds 12–14.
- Created version 1.7 in App Store Connect. It remains Prepare for Submission; no review submission was made.
- Saved English (US) and Simplified Chinese What's New for iPad support, contextual search, AI conversation continuity, scrolling/retry improvements, relevant memory retrieval, Life Manual share onboarding and startup improvements.
- Updated review notes for 1.7 (15), retaining the payment, privacy, AI-provider and publishing-permit disclosures. Existing descriptions, pricing, availability, contacts and screenshots were not changed.
- Retained automatic release after approval, immediate update availability, and existing ratings. This is a setting, not evidence of release.
- App and Widget use marketing version 1.7 and build number 15 in all four target/configuration combinations.
- Application source archive commit: `67b22b0` (release number change on top of feature commit `2447224`). Later changes to this record and the release-number assertion do not change the archived application source.
- `ios:sync` verified 818 bundled files and all 81 chapters. Runtime, TypeScript and chapter checks passed.
- Release archive succeeded: `/Users/yongyuan/Library/Developer/Xcode/Archives/2026-09-05/Wendao AI 1.7 (15).xcarchive`.
- Simulator build 1.7 (15) succeeded. Installed into the existing Wendao iPad 13-inch simulator; screenshot verification was interrupted by the Mac lock screen.
- `npm test`: 146/146 passed after updating the explicit release-number assertion to 1.7 (15).

## Blocking conditions / next steps

### Continuation at 14:15–14:18, 2026-09-05

- Xcode Organizer now verifies **Uploaded to Apple**, version **1.7 (15)**, uploaded **13:57**. Do not upload this archive again.
- App Store Connect has processed build 15, ID `4b78bb03-dde2-4143-8cb7-2ae66edb83a7`. It was selected in the version form, but saving that selection was interrupted; verify the saved selection on resume.
- Inspected the actual updated iPad simulator reading screen after deliberately keeping chapter 8 free. The portrait layout rendered correctly.
- The Mac locked again before the simulator screenshot could be saved. No iPad screenshots were uploaded and no review submission was made. Unlock and keep the Mac unlocked during the remaining capture/submission workflow.

The initial account-blocker details below are historical; upload is now resolved. Remaining work is screenshots, saving/verifying the selected build and final review submission.

1. Unlock the Mac. Computer Use cannot capture or operate the simulator while locked; do not work around this restriction.
2. Sign in to the developer Apple Account in Xcode → Settings → Apple Accounts. The current list is empty. The sign-in dialog was opened for the user; no credentials were entered or collected.
3. Retry distribution of the existing 1.7 (15) archive in Xcode Organizer. The command-line export failed with `Failed to Use Accounts`; Organizer independently confirmed missing App Store Connect account access. No successful upload of build 15 exists yet.
4. Capture and inspect authentic iPad app screenshots in both languages. The 13-inch slot is empty and accepts 2064 × 2752, 2752 × 2064, 2048 × 2732 or 2732 × 2048 PNG images. Existing iPhone screenshots are inherited (six per language).
5. After upload and Apple processing, select build 15, check metadata/privacy/availability and attach iPad screenshots; add to review, submit and verify the final review status.

## Logs

- `/tmp/wendao-1.7.15-sync.log`
- `/tmp/wendao-1.7.15-archive.log`
- `/tmp/wendao-1.7.15-upload.log` (failed account access, not an upload success)
- `/tmp/wendao-1.7.15-simulator.log`
- `/tmp/wendao-1.7.15-tests.log`

H5 and the AI API already contain the feature work from `2447224`; this release preparation does not introduce another content dataset or change AI/payment behavior.
