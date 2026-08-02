# Reading-moment sharing

## Outcome

Turn sharing from a generic product link into a focused reading moment. A reader can create a fixed 9:19.5 card (1080 × 2340, close to a modern iPhone screen) for the current chapter, share or save the image, copy the accompanying text, or send a deep link that opens the same chapter and reading layer.

## Four cards

- **Original text**: one or two opening lines from the Silk B base reading, paired with their aligned modern translation.
- **Interpretation**: the chapter's philosophical structure item, kept within a readable poster length.
- **Inspiration**: the chapter-specific `对我们的启发 / What this teaches us` item, paired with the daily practice.
- **Life manual**: the chapter-specific personalized advice produced from a verified chart. It is disabled until a verified chart exists and never includes the reader's name, birth date, birth time, birthplace, or chart hash.

The card does not attempt to reproduce the full chapter. Its QR code and share URL carry the reader to the complete source.

## Card anatomy

The card uses Wendao's mist-gold paper, deep teal text, pale ink atmosphere, antique-gold rules, and existing serif/sans typography. It contains:

1. Card type and received chapter number.
2. One primary passage, capped by the fixed card composition rather than silently cut mid-sentence.
3. One contextual companion: translation, source line, practice, or privacy disclosure.
4. `三慢问道 / WENDAO`, the line `读一章《道德经》，照见此刻的自己。`, the exact chapter QR code, and the public domain.

## Interaction

Sharing begins inside the reading flow, not in the drawer. Each of the three reading layers ends with a quiet `分享此刻 / Share this moment` action that opens the matching recommended card. A compact share action beside the chapter metadata offers the original-text recommendation immediately. When a reader selects text inside a chapter, a contextual `分享所选 / Share selection` control appears beside that passage and uses the selected text as the card's primary content.

The share sheet contains the four type controls, a live preview, and actions for sharing the image, saving it, copying the text, and sharing the exact link. It clearly labels whether the current card uses `你的选择 / Your selection` or `本章推荐 / Recommended`, but exposes no pixel dimensions, device names, or production specifications. The AI composer remains hidden while the sheet is open.

Deep links use `?chapter=<1-81>&section=<verse|meaning|inspiration|manual>&lang=<zh|en>`. The H5 reads these parameters on first load, opens the requested chapter, and scrolls to the requested layer. The QR always uses the public HTTPS URL, so an iOS share still resolves when received on another device.

## Validation

Automated coverage verifies in-reading entry points, selected-text cards, recommended cards, all four card modes, anonymity of life-manual cards, QR presence, downloadable PNG output, exact deep-link parameters, same chapter opening from a deep link, and no horizontal overflow at 320, 390, and 720 px. The normal 81-chapter, Silk B, H5, and iOS synchronization gates remain required.
