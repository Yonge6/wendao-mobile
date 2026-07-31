import { readFile } from "node:fs/promises";
import { inspectChapterIntegrity } from "./silk-integrity-core.mjs";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));
const issues = chapters.flatMap(inspectChapterIntegrity);

if (issues.length) {
  console.error(issues.map((issue) => `${issue.severity} ${issue.message}`).join("\n"));
  console.error(`Silk integrity check failed with ${issues.length} P0 error(s).`);
  process.exit(1);
}

console.log(`Checked ${chapters.length} chapters: Silk B transcription, marked reconstruction supplies, references, notes, and high-risk received phrases all pass.`);
