# ADR-0002: Stream comic media in the iOS app

## Status

Accepted

## Context

The bilingual “Tao in Everyday Life” collection contains 163 display WebP files and 163 original PNG files. Bundling both sets added 1,374.9 MiB to the iOS web payload and made the installed package disproportionately large. Chapter text, navigation, reading access, and the native shell remain useful without those media files.

## Decision

- Keep the complete comic library in the H5/public build.
- Exclude `assets/wendao/comics` from the Capacitor bundle during `npm run ios:sync`.
- Keep all 81 chapter texts and comic metadata in the app.
- In the native app, load the display WebP from `https://wendao.wonderelian.com/` when its chapter is shown.
- Fetch the original PNG from the same origin only when the reader opens save or share.
- Let the system HTTP/WebView cache previously requested images.
- Fail iOS synchronization if comic media re-enters the native bundle or if the native web payload exceeds 250 MiB.

## Consequences

- The synchronized iOS web payload drops from about 1.4 GiB to 31.6 MiB before Apple packaging.
- Chapter text and the core reader still open offline; comics need a network connection until they have been cached by the system.
- Saving or sharing a comic needs a network connection to retrieve the original PNG.
- H5 behavior and public comic URLs remain unchanged.
- Future App Store review notes must describe chapter text as bundled and comics as loaded online, rather than claiming that every comic is available offline.

## Supersedes

This narrows ADR-0001’s offline-reading decision. The native UI and chapter dataset remain bundled; only comic media moves to on-demand delivery.
