import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { buildAuditPlan, planMarkdown } from "./silk-auto-proofread-core.mjs";

const root = new URL("../", import.meta.url);
const generated = new URL("../generated/", import.meta.url);
const jsonUrl = new URL("silk-auto-proofread-plan.json", generated);
const markdownUrl = new URL("silk-auto-proofread-plan.md", generated);
const chapters = JSON.parse(await readFile(new URL("src/data/chapters.json", root), "utf8"));
const plan = buildAuditPlan(chapters);
const refresh = process.argv.includes("--refresh-plan");

await mkdir(generated, { recursive: true });
if (refresh || !existsSync(jsonUrl)) {
  await writeFile(jsonUrl, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(markdownUrl, planMarkdown(plan));
  console.log(`Wrote ${plan.additionAudits.length} addition audits to generated/silk-auto-proofread-plan.{json,md}.`);
} else {
  console.log("Preserved the existing pre-fix plan. Use --refresh-plan only when intentionally replacing that baseline.");
}

const counts = plan.summary.categoryCounts;
console.log(JSON.stringify({
  totalAdditions: plan.summary.totalAdditions,
  structuralErrors: counts["structural-error"],
  clearTranscriptionFixesWithinAdditions: counts["clear-transcription-fix"],
  stronglySupportedFixesWithinAdditions: counts["strongly-supported-fix"],
  receivedTextContaminationRisks: counts["received-text-contamination"],
  conflictingWitnesses: counts["conflicting-witnesses"],
  insufficientEvidence: counts["insufficient-evidence"],
  requiresImageReview: plan.summary.requiresImageReview,
  pendingNonAdditionSafeFixes: plan.safeFixes.length,
  resolvedNonAdditionSafeFixes: plan.resolvedFixes.length,
}, null, 2));
