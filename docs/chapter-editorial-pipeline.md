# 81 章编辑与校验管线

三慢问道将“帛书乙本转写”、“校读恢复”和“现代解释”分层存储，传世文本另作参照，不把任何一份现代整理本冒充帛书乙本原帛。

- `src/data/chapters.json` 是站点读取的 81 章快照，按帛书篇次排列，同时保留今本 1–81 章号。
- `src/data/sources.json` 记录来源、用途、访问日期和已知来源异常。
- `scripts/build-chapter-data.mjs` 重建快照；它在 `sources.silkBTranscription` 保留乙本 `□/○` 缺损符号，在 `zh.reconstructedVerse` 以 `〔〕` 标出恢复字，在 `zh.additions` 记录每个校补字的位置、对齐依据、参考范围与复核状态，并对来源中误标为第 67 章的“小邦寡民”按正文纠为第 80 章。
- `scripts/chapter-literal-translations.mjs` 保存原创现代汉语逐句直译；生成后进入 `zh.lineByLineTranslation`，必须与 `zh.reconstructedVerse` 一句对一句、顺序完全一致。
- `scripts/check-silk-integrity.mjs` 阻断高风险通行本措辞、缺失的三层字段和未标记的新增文字。
- `scripts/validate-chapters.mjs` 是构建总门槛：章数和章号唯一性、正文长度对照、每行汉字/拼音严格等数、声调、中英结构、三层解释、四个生活视角、人生说明书、今日一练与帛书严谨性检查。

编辑原则：

1. 主文标识为“帛书乙本底本校读 / Silk B Base Reading”，明确它是整理阅读版本，不是影印转写。
2. 第一层 `sources.silkBTranscription` 保留乙本转写；`□/○` 永远表示见证缺损或漫漶，不得在这一层静默填字。
3. 第二层 `zh.reconstructedVerse` 承载可读字、补文、断句和拼音；恢复字或超出转写字位的新增字必须置于 `〔〕`，其总说明写入 `sources.reconstructionNotes`，逐字信息写入 `zh.additions`。自动对齐只证明字位性质，不能证明具体补字来源，因此在图版人工复核前统一标记为 `confidence: "review-required"`。
4. 第三层 `zh.explanation` 保持现代解释；版本校勘只更新其中的校读说明，不改写既有生活解读。
5. `直译` 先按“校读原句 → 现代汉语”完整列出每一句，再进入思想结构；不能用章节主题摘要代替翻译。直译对象是校读恢复文本，须同时声明 `〔〕` 仍是校补，不是乙本原字。
6. 自动的逐位差异和缺损对齐只是人工复核索引，不是学术校勘记，也不宣称代表惟一的王弼定本。
7. 英文原典层使用 James Legge 公共领域译文作传世文本对照，页内明示它不是对每一个残损乙本字形的直译。

重建与校验：

```bash
npm run data:chapters
npm run validate:chapters
npm run check:silk
npm run test:silk
npm run test:runtime
npm run build:pages
```

人工校读优先修正 `scripts/build-chapter-data.mjs` 中的审校覆盖和古汉语多音字规则，然后重建快照；不要直接改生成的 JSON 而不留依据。
