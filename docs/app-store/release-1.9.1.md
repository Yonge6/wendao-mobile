# Wendao AI 1.9.1 (23)

## Changes

- Practice paragraphs now use theme-aware ink instead of the generic #555555 paragraph color. Both section 03 and section 04 use a dark card surface in night mode so their gold labels and body copy remain readable.
- Chapter, essay and AI poster sharing sends only the PNG file through Web Share or Capacitor Share. No URL or text item accompanies the image. The complete poster retains its canonical QR, and Share link remains separate. Unsupported browser file sharing downloads the PNG.
- Browser PNG creation is synchronous inside the original tap to retain user activation.

## Release state

H5 is live at commit b8d6a8dfa79489edfb1e7cd04ced3c02db892260. CI run 34908163759 and iOS checks 34908163728 passed. The same CI artifact was staged and atomically activated on the Alibaba host. Public verification matched 97 relevant files including all 87 essay pages, HTML, current CSS/JS and the build manifest. The 81-chapter data hash is unchanged. Live browser inspection confirmed the night-mode card and paragraph colors and 1080px poster preview.

Rollback: /srv/wonderelian/backups/wendao-before-b8d6a8d-20260915.

App source: 447daa3. Version 1.9.1, build 23. A first attempt to upload 1.9 (23) was rejected because Apple confirmed 1.9 was already approved and its release train closed; the cached app list had still shown Waiting for Review. No submission was withdrawn. The version was incremented and the client resynced and archived again.

Upload succeeded at 2026-09-15 07:25 China time. Xcode reported that the uploaded package is processing and EXPORT SUCCEEDED. This is upload confirmation, not review submission. The 1.9.1 archive matches all 914 built client files.

Archive: ~/Library/Developer/Xcode/Archives/2026-09-15/Wendao AI 1.9.1 (23).xcarchive.

App Store Connect web login expired. Creating the 1.9.1 store version, saving metadata/screenshots, selecting the processed build and submitting for review require login to resume. These actions are not complete.

## Validation and assets

- 155 unit tests passed after final version changes.
- Seven targeted browser checks passed: web PNG-only payload, native-bridge PNG-only payload and cache cleanup, actual PNG download fallback, separate chapter link, immediate save/copy feedback, and both practice cards at 390px and 1100px in night mode.
- Native sharing was verified at the Capacitor bridge boundary; delivery to an external recipient was not exercised.
- Practice body and label contrast against the final card surface is at least 4.5:1.
- Runtime protection and 81-chapter / Silk B integrity gates passed in ios:sync; 914 client files synced.
- Four actual shared-UI night screenshots are under screenshots/night-1.9.1/{iphone,ipad}/{zh-Hans,en-US}/11-night-practice.jpg. iPhone: 1320x2868; iPad: 2064x2752; JPEG without alpha. They use native iOS navigation mode and contain no fabricated UI/text. They are shared-client captures, not physical-device screenshots.
- Localized What's New and reviewer notes include the fixes. Existing descriptions continue to explain the 87 Chinese essays and reading/AI purchase boundaries accurately. Suggested gallery placement: replace the old save/share screenshot on iPhone; append the night screenshot on iPad, retaining the 1.9 essay images.

Logs and readbacks: work/release-1.9-23/ and work/deploy-b8d6a8d/.
