import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const webDir = path.join(root, "dist/client");
const iosDir = path.join(root, "ios/App/App/public");

function filesUnder(directory, relative = "") {
  return readdirSync(path.join(directory, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const next = path.join(relative, entry.name);
      return entry.isDirectory() ? filesUnder(directory, next) : [next];
    })
    .filter((file) => ![".DS_Store", "cordova.js", "cordova_plugins.js"].includes(file))
    .sort();
}

function digest(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

if (!existsSync(webDir) || !existsSync(iosDir)) {
  throw new Error("Run the web build and `npx cap sync ios` before checking iOS synchronization.");
}

const webFiles = filesUnder(webDir);
const iosFiles = filesUnder(iosDir);
const expected = JSON.stringify(webFiles);
const actual = JSON.stringify(iosFiles);
if (expected !== actual) {
  const onlyWeb = webFiles.filter((file) => !iosFiles.includes(file));
  const onlyIos = iosFiles.filter((file) => !webFiles.includes(file));
  throw new Error(`iOS web bundle is stale. Only web: ${onlyWeb.join(", ") || "none"}; only iOS: ${onlyIos.join(", ") || "none"}.`);
}

for (const relative of webFiles) {
  const webFile = path.join(webDir, relative);
  const iosFile = path.join(iosDir, relative);
  if (!statSync(iosFile).isFile() || digest(webFile) !== digest(iosFile)) {
    throw new Error(`iOS web bundle differs from dist/client: ${relative}`);
  }
}

const manifest = JSON.parse(readFileSync(path.join(iosDir, "wendao-build.json"), "utf8"));
if (manifest.chapterCount !== 81 || !/^[a-f0-9]{64}$/.test(manifest.chapterDataSha256)) {
  throw new Error("Invalid Wendao build manifest in the iOS bundle.");
}

console.log(`iOS sync verified: ${webFiles.length} files · ${manifest.chapterCount} chapters · ${manifest.commit.slice(0, 7)}`);
