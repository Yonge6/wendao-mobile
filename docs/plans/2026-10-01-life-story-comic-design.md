# Chapter 32 comic pilot

Approved source: `work/chapter-32-comic-20261001/chapter-32-art-nouveau-long.png`.

Replace the default essay presentation with the complete approved comic in chapter 32 and its More drawer article. Preserve the authored reflection in a collapsed text disclosure and the existing single inline share action. Use a compressed WebP for reading and the complete original PNG, including the supplied brand footer, for sharing and saving. The existing share sheet also provides an enlarge/fit control with independent two-axis scrolling. No URLs or text accompany image sharing.

Keep the existing canonical situation URL and show the same comic there, with the complete essay available on demand. Do not change other chapters. Verify the mobile and desktop presentation, night mode, text disclosure, drawer navigation, image loading, enlarged scrolling, and downloaded PNG identity. Build with the existing GitHub Pages workflow, then publish its validated artifact to the authoritative Aliyun Nginx root `/srv/wonderelian/wendao.wonderelian.com` and read back production. GitHub Pages alone does not update the custom domain. Native builds consume the same source in their next release; this task does not submit a new binary.

## Release verification

- H5 release `922d6d9` is live on the custom domain; its 81-chapter manifest, canonical article, WebP and original PNG were read back. Both image SHA-256 hashes match the approved local assets.
- Mobile day/night reading, zoom and sideways scroll, exact PNG download, drawer and canonical article, English navigation, and existing chapter sharing passed browser checks. Runtime integrity and the production build passed.
- Previous production remains at `/srv/wonderelian/backups/wendao-before-922d6d9-20261001`. The deploy streamed the CI artifact to a separate staging directory before an atomic exchange.
- Existing App Store binary was not changed.

## Follow-up corrections

The inline comic omits its duplicate outer title and chapter metadata. The collapsed reflection now explains Xiaolin's box, coriander interruption, three-minute talk, and the final notebook/plant details before connecting them to chapter 32. A single art-style line opens the verified Art Nouveau detail with an external-link icon; its URL is not displayed. The new `chapter-32-art-nouveau-qr` assets preserve the original 12 panels and logo combination, with a smaller logo on the left and a vertically centered H5 QR on the right, without a QR caption. The QR resolves to the canonical public story. The old assets remain for existing links.

The QR was decoded from the finished full-size PNG with Apple's Vision framework. Day/night mobile comic reading and exact PNG sharing, drawer/canonical article checks, type checking, content integrity and protected-runtime checks passed.
