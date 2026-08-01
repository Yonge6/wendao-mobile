# Daily chapter recommendation

## Outcome

Replace the fixed Chapter 8 homepage with one chapter selected from all 81 chapters for the reader's local calendar date. The same date produces the same chapter after reload, while a later date produces a new deterministic draw.

## Experience

- Merge the recommendation and edition eyebrow into one compact line: `今日偶遇｜帛书乙本底本校读 · 对应今本第 X 章` (with an equivalent English line).
- Remove the redundant `01 乙本转写 / 02 校读正文 / 03 现代解读` navigation row while preserving the three clearly headed content layers below.
- Keep `目录 / Contents` as an explicit selection and `偶遇一章 / Chance` as an immediate re-draw. Once either is used, remove the daily marker so the page does not mislabel a user-selected chapter.
- Preserve progressive reading: reaching the end still opens the next chapter in canonical order.

## Implementation

Build a local `YYYY-MM-DD` key, hash it, and map the result across the existing 81-chapter dataset. No backend, storage, or scheduled job is required. H5 and iOS use the same React source and therefore share the behavior after the normal Capacitor sync.

## Verification

Runtime coverage checks the chapter range, same-day reload stability, bilingual disclosure, all 81 directory entries, explicit selection behavior, chance behavior, and progressive loading.
