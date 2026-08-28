import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const locales = ["zh-Hans", "en-US"];
const files = [
  "01-ai-wendao.png",
  "02-reading.png",
  "03-text-layers.png",
  "04-for-you.png",
  "05-search.png",
  "06-life-manual.png",
];

const errors = [];
for (const locale of locales) {
  for (const filename of files) {
    const absolutePath = path.join(root, "docs/app-store/screenshots/final", locale, filename);
    if (!existsSync(absolutePath)) {
      errors.push(`${locale}/${filename}: missing`);
      continue;
    }
    const metadata = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", "-g", "hasAlpha", absolutePath], { encoding: "utf8" });
    if (!/pixelWidth: 1290/.test(metadata) || !/pixelHeight: 2796/.test(metadata)) {
      errors.push(`${locale}/${filename}: must be 1290 × 2796`);
    }
    if (!/hasAlpha: no/.test(metadata)) {
      errors.push(`${locale}/${filename}: alpha channel is not allowed`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated 12 localized App Store posters: 1290 × 2796 PNG, no alpha.");
