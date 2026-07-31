import { readFile, writeFile } from "node:fs/promises";
import { applyAllowedFixes } from "./silk-auto-proofread-core.mjs";

const root = new URL("../", import.meta.url);
const chaptersUrl = new URL("src/data/chapters.json", root);
const sourcesUrl = new URL("src/data/sources.json", root);
const planUrl = new URL("generated/silk-auto-proofread-plan.json", root);
const write = process.argv.includes("--write");
const chaptersText = await readFile(chaptersUrl, "utf8");
const sourcesText = await readFile(sourcesUrl, "utf8");
const plan = JSON.parse(await readFile(planUrl, "utf8"));
const chapters = JSON.parse(chaptersText);
const sources = JSON.parse(sourcesText);
const result = applyAllowedFixes(chapters, sources, plan);

console.log(`${write ? "WRITE" : "DRY-RUN"}: ${result.changes.length} allowed fix(es) would be applied.`);
for (const change of result.changes) {
  console.log(`Chapter ${change.chapterId}: ${change.originalCharacter} -> ${change.finalCharacter}`);
  console.log(`Fields: ${change.modifiedFields.join(", ")}`);
}

if (write && result.changes.length) {
  await writeFile(chaptersUrl, `${JSON.stringify(result.chapters, null, 2)}\n`);
  await writeFile(sourcesUrl, `${JSON.stringify(result.sources, null, 2)}\n`);
  console.log(`Applied ${result.changes.length} fix(es). No confidence value was changed.`);
} else if (!write) {
  if (chaptersText !== await readFile(chaptersUrl, "utf8") || sourcesText !== await readFile(sourcesUrl, "utf8")) {
    throw new Error("Dry-run modified a source file");
  }
  console.log("Dry-run completed without modifying files.");
} else {
  console.log("No change was necessary; the safe fixes are already applied.");
}
