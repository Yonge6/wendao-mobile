# Wendao AI 1.9.8 (33)

Approved experience improvements for H5 and iOS:

- Readable night-mode comic reflection, quotations and exercises.
- Search, theme and chapter filters, thumbnails and bilingual comic browsing for all 81 chapters.
- Received-text and silk-manuscript Contents ordering; source collation notes use a compact disclosure.
- Separate reading and membership entry with preserved product intent and benefits before sign-in.
- Server-confirmed free AI allowance, daily reset and foreground refresh; truthful membership status and reading access sync.
- WebP preview/enlargement, recent preview cache with explicit clearing, and PNG original only on save/share.
- Cancel/retry original download and Photos permission Settings action; file-only image sharing.
- Compact download banner and AI entry while reading on small screens; wider desktop comic drawer.
- Opt-in analytics retain only safe action targets and sources, without queries or conversation contents.

## Validation

- Node tests: 202/202 passed; Python usage tests: 5/5 passed.
- Companion browser flows: 7/7 passed; reading/media integration: 11/11 passed again with retained production authentication configuration.
- Protected runtime integrity: all 28 files unchanged.
- Archive: `/Volumes/LaCie/Wendao-1.9.8-33.xcarchive`; ARCHIVE SUCCEEDED and codesign verified.
- Native app: 47.3 MiB; archive: 60 MiB; 1,001 bundled web files, no bundled comic PNG/WebP.
- Archive production Supabase configuration and canonical AI gateway verified without displaying keys.
- 12 current shared-native-UI screenshots captured and reviewed for iPhone/iPad in Simplified Chinese and English.
- Source implementation revision: `bad09c0c23a8913530ac7e4e1361466bd31e83cf`.

## Delivery

- H5 deployed at `https://wendao.wonderelian.com`, with full staged hashes and 162 Chinese/English canonical preview URLs verified before atomic activation.
- Public manifest, entry, banner, usage client, and Chinese/English chapter 32 canonical page hashes match the build. Live comic collection/filter UI verified in the browser.
- H5 rollback source: `/srv/wonderelian/backups/wendao-before-bad09c0-20261013`.
- Usage collector deployed; health HTTP 200, native-origin preflight HTTP 204, existing SQLite preserved. Backup: `/opt/wendao-growth/backup-usage-metadata-20261013T043035Z/usage.py`.
- Build 33 uploaded successfully and processed by Apple; build ID `46d4f330-31a6-46b5-b1a9-60c489005a06`.
- Simplified Chinese and English descriptions/promotional text/release notes and reviewer notes saved.
- All 12 new iPhone/iPad screenshots in Simplified Chinese and English finished Apple upload/processing. Original files, hashes and two resumed-upload receipts are retained.
- Submitted 1.9.8 (33) on 2026-10-13 at 13:39 Asia/Shanghai; Apple shows **Waiting for Review / 等待审核**. Submission ID: `9eaefb65-9109-4982-826b-ca7c4ac892d2`.
- App Store release is automatic after approval; immediate rollout and existing ratings are retained. H5 is live now; App Store 1.9.7 remains the public version until review approval.
- Permanent evidence: [Apple review readback](evidence-1.9.8/app-review-readback.json), [review screenshot](evidence-1.9.8/waiting-for-review.png), [public hashes](evidence-1.9.8/public-readback.json), [H5 release receipt](evidence-1.9.8/release-receipt.json).

## Verification boundary

- H5/shared native UI, unit and browser flows, production configuration and signed archive were verified. Native Photos writing and real StoreKit purchases were not repeated on a physical device in this release; the archive uses the existing native bridge with the updated permission and file-sharing flow.
- 47.3 MiB is the signed archived app size. Apple determines final App Store download/install size after processing and device thinning.
