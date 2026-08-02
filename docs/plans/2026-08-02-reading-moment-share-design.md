# Reading-moment sharing

## Outcome

Turn sharing from a generic product link into a complete, deliberately typeset chapter poster. Every poster stays 1080 px wide, begins around a 1:2 ratio (2160 px high), and grows vertically with its real content instead of shrinking, cropping, or presenting an excerpt as the whole. A reader can share or save the image, copy the accompanying text, or send a deep link that opens the same chapter and reading layer.

## Four cards

- **Original text**: the full Silk B base reading, paired with its full aligned modern translation.
- **Interpretation**: the complete interpretation rendered by the reading product as the primary text, paired with the full original as its source.
- **Inspiration**: the complete chapter-specific `对我们的启发 / What this teaches us` item, paired with the full original.
- **Life manual**: the chapter-specific personalized advice produced from a verified chart, paired with `对我们的启发 / What this teaches us`. It is disabled until a verified chart exists and never includes the reader's name, birth date, birth time, birthplace, or chart hash.

## Card anatomy

The card uses Wendao's mist-gold paper, deep teal text, pale ink atmosphere, antique-gold rules, and existing serif/sans typography. It contains:

1. Card type and received chapter number.
2. The complete primary text, with the poster height calculated from its wrapped line count.
3. A complete contextual companion in a distinct editorial field.
4. `三慢问道 / WENDAO`, the line `读一章《道德经》，照见此刻的自己。`, the exact chapter QR code, and the public domain.

Source line breaks use the normal text line height. Only an actual blank paragraph creates additional paragraph space, and the companion field follows the primary text with one controlled transition gap rather than a fixed empty middle.

## Interaction

Sharing begins inside the reading flow, not in the drawer. Each of the three reading layers ends with a quiet `分享这一层 / Share this layer` action that opens the matching complete poster. A compact share action beside the chapter metadata opens the full original-text poster immediately. Text selection remains available for ordinary copying but does not create a separate share mode.

The share sheet contains the four type controls, a live preview at the generated poster's real aspect ratio, and actions for sharing the image, saving it, copying the text, and sharing the exact link. It exposes no pixel dimensions, device names, production specifications, or explanatory filler around the preview. The AI composer remains hidden while the sheet is open.

Deep links use `?chapter=<1-81>&section=<verse|meaning|inspiration|manual>&lang=<zh|en>`. The H5 reads these parameters on first load, opens the requested chapter, and scrolls to the requested layer. The QR always uses the public HTTPS URL, so an iOS share still resolves when received on another device.

## Validation

Automated coverage verifies in-reading entry points, full primary and secondary content for all four card modes, dynamic poster height on long chapters, anonymity of life-manual cards, QR presence, downloadable PNG output, exact deep-link parameters, same chapter opening from a deep link, absence of selection-share UI, and no horizontal overflow at 320, 390, and 720 px. The normal 81-chapter, Silk B, H5, and iOS synchronization gates remain required.
