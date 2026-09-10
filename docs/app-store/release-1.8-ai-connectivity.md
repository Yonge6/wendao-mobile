# 1.8 (21) AI connectivity release

Source: 29fb22ddc22490d3607e5693e8689f9d48457a66. Supersedes build 19 for review; retains its adaptive layout and prior 1.8 product improvements.

## Diagnosis and fix

A physical iPhone timed out connecting to the legacy Vercel hostname after 12 seconds (NSURLErrorDomain -1001), while the owned website remained reachable. Build 20 repaired native streaming but did not resolve that network route. Build 21 uses the owned HTTPS gateway documented in ../deployment/ai-gateway.md. TLS verification, authentication and membership checks remain enabled.

Native SSE uses original WebKit fetch so response chunks and cancellation reach the interface. Connecting, slow connection and generation now have separate progress states; an unconnected request no longer claims the AI is composing.

## Verified delivery

- 150 unit checks and 14 conversation UI checks passed. Protected runtime and 81-chapter validation passed.
- Both GitHub workflows passed: Pages 34434739127 and iOS 34434739159.
- Production H5 manifest reports build 21 and source 29fb22d. The public HTML, download page and application/AI bundles match the CI artifact. An authenticated test question returned a complete response through the owned gateway.
- Installed 1.8 (21) on the paired physical iPhone. Owned API health returned HTTP 200 in 1.73 seconds; the old hostname still timed out. The user confirmed a complete AI answer after installation.
- Production rollback: /srv/wonderelian/backups/wendao-before-29fb22d-20260910. Nginx rollback: /srv/wonderelian/backups/nginx-before-wendao-api-20260910.conf.
- Release archive: ~/Library/Developer/Xcode/Archives/2026-09-10/Wendao AI 1.8 (21).xcarchive.
- Apple upload succeeded at 11:56 Asia/Shanghai on 2026-09-10 and finished processing. Build UUID ec7a658a-0512-4491-b66c-96ef88fc8da1.
- Removed prior waiting submission 9b5b9e5b-3d18-4ae1-9bbb-773ce6231676. Selected and saved build 21; Chinese and English What's New and reviewer notes include this repair. Existing screenshots retained.

## Final review readback

Submitted successfully on 2026-09-10 at 12:03 Asia/Shanghai. App Store Connect shows one submitted item, 1.8 (21), Waiting for Review. Automatic release after approval is retained.

Submission ID: ccde630a-0175-48d3-a88d-50c0b37d55b7.

https://appstoreconnect.apple.com/apps/6796945428/distribution/reviewsubmissions/details/ccde630a-0175-48d3-a88d-50c0b37d55b7

The first add-for-review attempt displayed an empty agreement-update notice. Both existing agreements read as active; refreshing the app page resolved it. No agreement was accepted or changed.

Evidence logs and public asset hashes are under work/release-adaptive/ (excluded from published artifacts).
