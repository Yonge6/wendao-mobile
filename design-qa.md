# 三慢问道移动端设计 QA

## Evidence

- Source visual truth: `/Users/yongyuan/Documents/道德经/最终方向/方案1最终精修-目录版.png`
- Implementation, chapter top: `qa-implementation-pinyin.png`
- Implementation, scrolled reading state: `qa-implementation-pinyin-scrolled.png`
- Combined comparison: `qa-comparison.png`
- Primary public surface: responsive H5; full-width on mobile and a centered `720 px` reading column on larger screens
- Reference mobile viewport: `393 × 852`
- Source normalization: `854 × 1828` downsampled and center-cropped to `393 × 852`
- Implementation capture: `393 × 852`, device scale factor `1`, `[data-testid="device-screen"]` measured at exactly `393 × 852`
- States: Chinese chapter top; Chinese content scrolled 560 px

## Findings

- No actionable P0, P1, or P2 findings remain.
- Runtime surface: the public build no longer renders a simulated iPhone/Pixel shell, device picker, mock status bar, home indicator, or simulated keyboard. It opens directly as a normal H5 reading page with native browser scrolling and text input.
- Typography: Noto Serif SC continues to match the selected literati reading style. Tone-marked Pinyin is set in Noto Sans SC at 8 px, aligned above each Han character without competing with the scripture.
- Spacing and layout: the fixed reading controls preserve the source header proportions. Extra vertical space introduced by Pinyin is consistent and keeps the original text dominant.
- Colors and tokens: deep teal, antique gold, ivory paper, and ink-mountain tones remain consistent with the source.
- Image quality: the xuan-paper and ink-mountain artwork is now a single fixed, non-repeating viewport layer over a seamless paper color. At `scrollTop: 650` and `scrollTop: 1370`, computed `background-repeat` remained `no-repeat, no-repeat` and visual review found no horizontal join.
- Copy and content: Pinyin appears only on Chinese original scripture; explanations, personalized guidance, and English mode remain unchanged.
- Textual completeness: all three prototype chapters now display the complete selected-edition text rather than a leading excerpt, with a visible `全文 · N句` marker. Chapter 8 contains all nine displayed lines through `夫唯不争，故无尤。`.
- Edition labeling: the primary reading is now the Mawangdui Silk Text B witness. Chapter 8 directly preserves `上善如水 / 有争 / 所亚 / 正善治`; the common collation and Wang Bi variants are stated separately. Lacunae in Chapter 1 are explicitly labeled as supplied from Silk Text A rather than silently normalized.
- Interaction state: after scrolling 44 px, the composer transitions to 50% opacity and returns to full opacity on hover or focus. The top action area remains fixed and usable.
- Theme state: day and night modes both preserve readable scripture contrast. The corrected computed verse colors are `rgb(18, 63, 73)` in day mode and `rgb(219, 231, 227)` in night mode.
- Personal space: the right drawer exposes in-product Life Manual profile entry/editing, persistent night mode, About, and Feedback. It no longer links to Pluto. The dedicated API returns an engine-verified result and the H5 shows type, strategy, authority, profile, definition, and incarnation cross without rendering a BodyGraph.
- Conditional personalization: with no verified `chartHash`, all three chapters contain no `你的人生说明书` heading. Submitting a question opens the birth-information form. After the live calculation returned Generator / 2/4 / Emotional Authority, all chapters gained a chapter-specific Life Manual paragraph and the response sheet disclosed the same basis.
- Mobile forms: at `393 × 852`, birth date and time measured as separate stacked rows (`300.8 px` wide each) with no overlap. Composer, form, feedback, and admin password inputs compute to `16 px`, preventing iOS focus zoom without disabling page zoom.
- Birthplace time zone: the Life Manual form no longer exposes an IANA time-zone field. Mainland China, Hong Kong, Macau, and Taiwan use direct address inference; other places use Photon with ArcGIS fallback and `tz-lookup`. At `393 × 852`, both `武汉` and `Paris, France` completed the production Human Design calculation successfully.
- Product data: a synthetic profile, question, feedback, and allowlisted events were written through the production API, appeared in the password-protected phone console, and were removed after acceptance. The console showed overview, user, conversation, feedback, and event tabs.
- Contact surface: About contains the supplied email and seven social links. The Video Channel button opened the supplied `686 × 624` QR image in an in-product modal.
- Terminology: every visible occurrence of `你的出厂设置` has been replaced with `你的人生说明书`.
- Responsive behavior: the reading surface fills the mobile viewport without horizontal overflow; on desktop it remains a restrained 720 px column rather than stretching the scripture across the window.
- Accessibility: controls retain semantic button labels, Chinese and English modes preserve language attributes, and no content is hidden by the fixed header or composer.
- Browser console: no application errors or warnings during the accepted flow.

## Focused Region Evidence

- Original scripture region: every Han character in the four visible lines has a matching tone-marked syllable directly above it.
- Full-text invariant: the three prototype readings contain 9, 5, and 8 lines respectively; module startup validation rejects a verse whose Pinyin line or Han-character count is incomplete.
- Fixed header region: the header viewport top remains unchanged while the reading container reaches `scrollTop: 560`.
- Composer region: computed opacity is `0.5` while scrolled, with `:hover` and `:focus-within` restoring opacity to `1`.

## Comparison History

1. Initial build had a scrolling header, no Pinyin, and a fully opaque composer at every reading depth.
2. The header was moved outside `MobileScroll`, a scroll-state listener was added, and character-level Pinyin was introduced for all Chinese scripture lines in the three prototype chapters.
3. Visual review found the first 7 px Pinyin treatment too faint at device scale. It was increased to 8 px and its ink opacity was raised from 0.70 to 0.78.
4. Post-fix evidence in `qa-comparison.png` shows a stable fixed header, readable but subordinate Pinyin, and the lower-interference composer state.

## Primary Interactions Tested

- Scroll scripture while the top action area remains fixed.
- Open the directory from the fixed header after scrolling.
- Select a chapter and return to the chapter top.
- Confirm the composer fades after scrolling and restores at the top.
- Switch to English and confirm Pinyin is removed.
- Switch back to Chinese and confirm all Pinyin returns.
- Confirm the public surface contains no device preview controls or phone-frame markup.
- Open the H5 directory sheet and select a chapter.
- Submit a question without a verified profile and confirm Wendao opens the Life Manual form instead of generating a generic answer.
- Generate a real Human Design result through the production API, confirm the result-only interpretation appears, close the drawer, and verify chapter-level personalization becomes visible.
- Confirm the Life Manual form has no time-zone input, then calculate successfully with both a Chinese birthplace and an overseas birthplace.
- Submit a question after setup and confirm the response references the calculated type, profile, and authority.
- Open and close the right drawer at desktop and `393 × 852`; verify stacked date/time fields and no horizontal overflow.
- Submit feedback inside Wendao and confirm the success state does not navigate to GitHub.
- Open About, verify all supplied contact destinations, and open the Video Channel QR modal.
- Log into the phone data console with the configured server-side password; verify profile, conversation, feedback, and event records and feedback status controls.
- Toggle night reading on and off and verify the theme-aware scripture, drawer, header, and composer surfaces.
- Scroll the long Chapter 8 interpretation through the previously visible seam location and confirm the fixed background remains continuous.

final result: passed
