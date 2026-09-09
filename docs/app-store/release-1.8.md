# Wendao 1.8 (17) release — 2026-09-09

## Scope since App Store 1.7 (16)

- AI dialogue: simple, quiet contemporary language inspired by Laozi, occasional exact chapter quotation, natural follow-ups and endings; honest AI identity and existing grounding, safety and entitlement boundaries.
- Native share cards save directly to Photos without an app confirmation. First use retains the system add-only Photos permission. Save/copy results appear briefly in the upper-middle of the share panel.
- Lifetime reading price: China mainland CNY 9.90 (explicitly approved instead of unavailable 9.99), USA USD 7.00 as the base for other localized storefront prices. No subscription price changes; lifetime excludes AI.
- H5 WeChat download handoff from 4ccdf8b remains deployed; it is documented separately from iOS changes.

## Verified delivery

- Application source: d109fd91919bee294c2869f19e960849daaa489c.
- H5 GitHub build run 34355380028 succeeded. Its exact artifact is deployed to https://wendao.wonderelian.com/. Nine public files match artifact SHA-256 hashes; eight related production interaction tests passed.
- Production rollback: /srv/wonderelian/backups/wendao-before-d109fd9-20260909.
- API deployment dpl_DCw9SxghHKB25UdD2Fm8qPo5yJHD; production health revision `2026-09-09-laozi-dialogue` verified at https://wendao-companion-api.vercel.app/api/health.
- 148 node tests, 10 related local UI tests, runtime, TypeScript and 81-chapter checks passed. iOS sync verified 821 bundled files.
- Release archive succeeded, then upload succeeded at 21:14. App Store Connect processed build 17, UUID 1253a428-ce27-4dc0-8584-eb256f9962f9. The build is selected and saved on version 1.8.
- Real signed-in member account exercised Chinese first reply, follow-up, AI identity answer, and English response through production UI with synthetic demo questions. Model output remained plain and chapter-grounded, with no claim to be the historical Laozi. These are qualitative checks, not a guarantee that every reply will follow a length or tone target.
- iPhone 17 Pro Max simulator built and launched 1.8 (17). First Save Image requested the native add-only Photos permission, then showed Saved to Photos above the controls. Copy text showed the same-position brief toast without a dialog.
- English and Simplified Chinese promotional text, descriptions and What's New updated. Release notes include all unpublished iOS changes since 1.7 (16), not previously shipped iPad/search/history work.
- Added seventh localized iPhone screenshot for the actual native share panel, 1320 × 2868 JPEG. Existing six iPhone screenshots and localized iPad screenshots retained. The new screenshots contain actual app pixels; no synthetic conversation UI or mocked account state was used to capture them.

## Submitted at 21:26, 2026-09-09

App Store Connect accepted one item, iOS 1.8 (17), and shows **Waiting for Review**. Submission ID: `58e07416-57f8-4ab1-bea3-6ebde5eb908a`.

The version is set to release automatically after approval, immediately to all users, preserving ratings. Apple approval and public availability are still pending; upload or submission alone is not publication.

Both localized descriptions, promotional texts and release notes were read back and matched their source files exactly. Both iPhone localizations show 7/10 screenshots; English and Simplified Chinese each retain one 13-inch iPad screenshot.

