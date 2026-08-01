import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const chapterPath = path.join(root, "src/data/chapters.json");
const chapterBytes = readFileSync(chapterPath);
const chapters = JSON.parse(chapterBytes.toString("utf8"));

if (!Array.isArray(chapters) || chapters.length !== 81) {
  throw new Error(`Build manifest requires exactly 81 chapters; found ${chapters.length}.`);
}

let commit = process.env.GITHUB_SHA || "working-tree";
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  // A source archive may not contain .git; the remaining integrity fields still apply.
}

const outputDir = path.join(root, "dist/client");
mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, "wendao-build.json"), `${JSON.stringify({
  schemaVersion: 1,
  appName: "三慢问道",
  bundleId: "com.yonge6.wendao",
  appVersion: "1.0",
  buildNumber: 1,
  commit,
  chapterCount: chapters.length,
  chapterDataSha256: createHash("sha256").update(chapterBytes).digest("hex"),
}, null, 2)}\n`);

console.log(`Build manifest: 81 chapters · ${commit.slice(0, 7)}`);
