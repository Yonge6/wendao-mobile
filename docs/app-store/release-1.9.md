# 1.9 (22) — Tao in everyday life

Submitted on 2026-09-13 at 22:13 Asia/Shanghai. App Store Connect readback: **Waiting for Review**, one submitted item, **1.9 (22)**. Automatic release after approval and immediate availability to all users are retained.

- App: 6796945428 / com.yonge6.wendao
- Build UUID: 61da0141-319f-4bc9-9d0a-484bfa64f616
- Submission: a96a3ba1-ad07-4505-bb32-34c9c5443cd8
- Review: https://appstoreconnect.apple.com/apps/6796945428/distribution/reviewsubmissions/details/a96a3ba1-ad07-4505-bb32-34c9c5443cd8
- Binary source: 32f49a3cd83e9a297800172388871b4027871c37, incorporating H5 afbd524 and all prior life-essay changes. Subsequent commits contain store assets, documentation and test maintenance only.
- Archive: ~/Library/Developer/Xcode/Archives/2026-09-13/Wendao AI 1.9 (22).xcarchive

## Product and store changes

87 Chinese essays cover all 81 chapters, with complete authored reflections, accurate source quotations and practices. Section 04 follows each chapter's insights; More contains the full collection. A single Share this layer action matches earlier sections and opens the complete essay poster. Link sharing remains inside the share panel and drawer. English navigation and descriptions explicitly identify the essays as Chinese.

Updated Simplified Chinese and US English promotion, descriptions, What's New and reviewer notes. The approved 1.8 functionality remains described accurately; 1.9 What's New covers this release's actual additions. Both locales' persisted field values were compared with the local copy after reloading.

Added 12 localized screenshots: three views for each of iPhone and iPad in both languages. They show section 04, essay-image sharing and the essay collection. iPhone now has 10 screenshots per locale; iPad has five. New content is within the first three screenshots. Existing accurate AI and reading assets remain. All new images were reread as complete Apple-hosted mzstatic thumbnails, including after navigation/reload.

Screenshot source: the actual shared React app UI, captured in Chromium with native-iOS platform navigation at 1320 × 2868 (iPhone) and 2064 × 2752 (iPad). No replacement article text or fabricated interface is injected. These new images are UI captures, not physical-device screenshots. The Release simulator app separately built, installed, launched and rendered its bundled reader on iPad. Native input automation was unreliable during this run, so interactive coverage below comes from the shared-client tests.

## Validation

- 155/155 unit checks passed.
- 338 of 339 browser checks passed in the full run. The remaining check used an ambiguous practice-card selector after section 04 introduced a second practice. Scoped it to section 03; its rerun passed (1/1). No application behavior was changed to satisfy a test.
- All 81 inline chapters and all 87 essays' sharing flows were covered in Chinese and English.
- Sites worker: 4/4 passed. Protected runtime, chapter and Silk B integrity checks passed during ios:sync.
- ios:sync verified 914 files and 81 chapters. Archived public assets byte-match dist/client, with zero mismatches.
- Release archive and Release simulator build succeeded. Xcode managed distribution upload succeeded; Apple processed and accepted build 22.
- Local readiness script found the distribution identity but not a managed App Store provisioning profile (6/7 checks). The actual managed archive/export/upload and processed Apple build provide distribution validation; the script result is not represented as 7/7.
- 12 new JPEG files passed dimensions and no-alpha checks. Apple accepted all images without reupload.
- No internal test membership is included. Production AI gateway, sign-in, StoreKit and existing entitlements are retained.

H5's functional change was already deployed and verified at afbd524 (1.8/21 version stamp). This release changes the native marketing version/build; it does not introduce a separate H5/app content source. Final H5 readback retained the same 81-chapter data hash as the native archive.

Local logs, saved field comparisons, thumbnail URLs and submission snapshot: work/release-1.9/ (excluded from publication).
