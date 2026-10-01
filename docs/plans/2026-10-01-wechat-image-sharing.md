# WeChat image save/send

The existing H5 image actions request an anchor download when Web Share is unavailable, then report a completed download. That route does not complete the user's save/send flow in WeChat.

Return a distinct preview outcome for the WeChat web surface before attempting Web Share or downloads. In the existing share sheet, show a plain image with persistent long-press instructions and a return action. Use the public original PNG for comics and the locally generated PNG for other cards; do not upload private generated cards. Keep the sheet close control outside the scrollable image and allow the browser's context menu and native image selection. Explain that send can fall back to saving and choosing the image in WeChat. Report ordinary browser downloads as requested rather than saved to Photos. Native App APIs keep their existing behavior.

Validation: seven browser scenarios passed, including iPhone/Android WeChat user agents, comic and generated chapter images, bypass of download and Web Share even when file sharing is advertised, no false saved message, return navigation, normal-browser image identity, and day/night reading. Runtime integrity and TypeScript checks passed. After the user unlocked iPhone Mirroring, the live iPhone WeChat flow was tested: Save opened the long-press image, the native Save to Photos action added the chapter 32 image to Photos at 13:37, and Share opened a system sheet identifying a PNG image of 3.5 MB with WeChat as a target. No message was sent to a recipient.

## All-browser App download banner

Show one dismissible, theme-aware banner above the reading toolbar on all H5 browsers, including desktop Web, and on public editorial reading pages. It includes the real App icon, localized name, iPhone/iPad availability, download action and close button. Session storage shares dismissal across reloads and navigation; native App builds omit it. Safari uses the same banner to avoid duplicating its browser-specific Smart App Banner. The existing iPhone WeChat download guide remains the handoff to App Store. Download guide and administrative pages do not show an additional promotion over the task they already perform.
