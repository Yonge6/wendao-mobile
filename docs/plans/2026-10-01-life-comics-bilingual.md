# Bilingual life comics

The user requested English reflections and English images on 2026-10-01. This extends the ongoing 81-chapter rollout; it does not replace or cancel the remaining Chinese chapters.

- Keep one distinct verified Style Atlas style per chapter. The English edition retains that chapter's characters, panel sequence and visual style. Generate English lettering in ego ChatGPT at High, using the reviewed Chinese pages as references; never present a Chinese image as the English edition.
- Translate the actual rendered story, with natural English jokes and reflections grounded in its visible details. Retain the supplied original brand footer and replace only the QR target with the English canonical article.
- Store English editorial content separately in `growth/copy-en.json`, keyed by the existing stable slug. Localize reader, archive, reflection, quote attribution, practice, copy text, share image and share link together. Chinese remains the unchanged default.
- English public articles live at `/situations/<slug>/en/`; the reader uses its existing `lang=en` switch. Style links keep the same style ID and switch their language parameter.
- Missing translations remain explicitly identified as Chinese. A translated reflection with an unfinished English comic does not reuse the Chinese image: it temporarily offers the English text. Do not describe the bilingual rollout as complete until all 81 English images and reflections are visually checked and publicly verified.
- Pilot: chapter 32. Then the remaining reviewed comics, with later Chinese chapters entering the English queue only after their own visual review.
- Acceptance: language changes select matching WebP and original PNG, image-only sharing stays image-only, English QR/link opens the English article, Chinese links/assets remain unchanged, and all 81 chapters retain unique styles.

Current browser gate: ego TaskSpace 51 returned `cloudflare_challenge` and was handed back to the user. Generation must wait for the user's verification/resume; local editorial and integration work can continue.
