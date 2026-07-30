# 问道移动端设计 QA

## Evidence

- Source visual truth: `/Users/yongyuan/Documents/道德经/最终方向/方案1最终精修-目录版.png`
- Implementation, chapter top: `qa-implementation-pinyin.png`
- Implementation, scrolled reading state: `qa-implementation-pinyin-scrolled.png`
- Combined comparison: `qa-comparison.png`
- CSS viewport: `393 × 852`
- Source normalization: `854 × 1828` downsampled and center-cropped to `393 × 852`
- Implementation capture: `393 × 852`, device scale factor `1`, `[data-testid="device-screen"]` measured at exactly `393 × 852`
- States: Chinese chapter top; Chinese content scrolled 560 px

## Findings

- No actionable P0, P1, or P2 findings remain.
- Typography: Noto Serif SC continues to match the selected literati reading style. Tone-marked Pinyin is set in Noto Sans SC at 8 px, aligned above each Han character without competing with the scripture.
- Spacing and layout: the fixed reading controls preserve the source header proportions. Extra vertical space introduced by Pinyin is consistent and keeps the original text dominant.
- Colors and tokens: deep teal, antique gold, ivory paper, and ink-mountain tones remain consistent with the source.
- Image quality: the generated xuan-paper and ink-mountain background remains sharp at the 393 × 852 target viewport with no stretching or visible seams.
- Copy and content: Pinyin appears only on Chinese original scripture; explanations, personalized guidance, and English mode remain unchanged.
- Textual completeness: all three prototype chapters now display the complete selected-edition text rather than a leading excerpt, with a visible `全文 · N句` marker. Chapter 8 contains all nine displayed lines through `夫唯不争，故无尤。`.
- Edition labeling: the primary reading is identified as a silk-text collation. Chapter 8 follows the supplied comparison book's `上善如水 / 有静` reading, while the Silk A, Silk B, and Wang Bi opening variants are stated separately.
- Interaction state: after scrolling 44 px, the composer transitions to 50% opacity and returns to full opacity on hover or focus. The top action area remains fixed and usable.
- Accessibility: controls retain semantic button labels, Chinese and English modes preserve language attributes, and no content is hidden by the fixed header or composer.
- Browser console: no errors or warnings.

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

final result: passed
