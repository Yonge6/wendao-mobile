# WeChat image save/send

The existing H5 image actions request an anchor download when Web Share is unavailable, then report a completed download. That route does not complete the user's save/send flow in WeChat.

Return a distinct preview outcome for the WeChat web surface before attempting Web Share or downloads. In the existing share sheet, show a plain image with persistent long-press instructions and a return action. Use the public original PNG for comics and the locally generated PNG for other cards; do not upload private generated cards. Keep the sheet close control outside the scrollable image and allow the browser's context menu and native image selection. Explain that send can fall back to saving and choosing the image in WeChat. Report ordinary browser downloads as requested rather than saved to Photos. Native App APIs keep their existing behavior.

Validation: seven browser scenarios passed, including iPhone/Android WeChat user agents, comic and generated chapter images, bypass of download and Web Share even when file sharing is advertised, no false saved message, return navigation, normal-browser image identity, and day/night reading. Runtime integrity and TypeScript checks passed. Physical-device verification is pending because iPhone Mirroring requires the user's Mac unlock; emulation cannot verify WeChat's actual Photos write or send menu.
