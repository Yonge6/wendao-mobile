# Night practice contrast and image sharing

The two practice blocks inherit a generic paragraph color (#555555), which is unsuitable on the night paper background. Give their paragraphs the existing theme-aware ink color and their labels the existing gold color. Preserve the layout and full content.

Image sharing currently submits the poster together with a URL and share text. Receiving apps can prioritize that URL. Submit only a PNG image item on both Capacitor and Web Share; keep the dedicated link action unchanged and keep the canonical QR in the poster. Decode the already-rendered data URL synchronously to retain the browser tap's user activation. Browsers without file-sharing support download the PNG.

Verify the browser and native-bridge payloads, image bytes, download fallback, separate link action, and computed contrast on both practice blocks at phone and wide widths. Then publish the same client to H5, sync and archive the iOS app, replace the pending 1.9 build with build 23, update release notes, and verify submission state.
