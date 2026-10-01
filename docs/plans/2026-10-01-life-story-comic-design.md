# Chapter 32 comic pilot

Approved source: `work/chapter-32-comic-20261001/chapter-32-art-nouveau-long.png`.

Replace the default essay presentation with the complete approved comic in chapter 32 and its More drawer article. Preserve the authored reflection in a collapsed text disclosure and the existing single inline share action. Use a compressed WebP for reading and the complete original PNG, including the supplied brand footer, for sharing and saving. The existing share sheet also provides an enlarge/fit control with independent two-axis scrolling. No URLs or text accompany image sharing.

Keep the existing canonical situation URL and show the same comic there, with the complete essay available on demand. Do not change other chapters. Verify the mobile and desktop presentation, night mode, text disclosure, drawer navigation, image loading, enlarged scrolling, and downloaded PNG identity. Build with the existing GitHub Pages workflow, then publish its validated artifact to the authoritative Aliyun Nginx root `/srv/wonderelian/wendao.wonderelian.com` and read back production. GitHub Pages alone does not update the custom domain. Native builds consume the same source in their next release; this task does not submit a new binary.

## Release verification

- H5 release `922d6d9` is live on the custom domain; its 81-chapter manifest, canonical article, WebP and original PNG were read back. Both image SHA-256 hashes match the approved local assets.
- Mobile day/night reading, zoom and sideways scroll, exact PNG download, drawer and canonical article, English navigation, and existing chapter sharing passed browser checks. Runtime integrity and the production build passed.
- Previous production remains at `/srv/wonderelian/backups/wendao-before-922d6d9-20261001`. The deploy streamed the CI artifact to a separate staging directory before an atomic exchange.
- Existing App Store binary was not changed.
