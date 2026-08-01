import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const bundleId = "com.yonge6.wendao";
const teamId = "L855ZVM679";
const checks = [];
const add = (passed, label, detail) => checks.push({ passed, label, detail });

let xcodeVersion = "unavailable";
try {
  xcodeVersion = execFileSync("xcodebuild", ["-version"], { encoding: "utf8" }).trim().replace(/\n/g, " · ");
} catch {}
const xcodeMajor = Number(xcodeVersion.match(/Xcode (\d+)/)?.[1] || 0);
add(xcodeMajor >= 26, "Xcode 26+", xcodeVersion);

let identities = "";
try {
  identities = execFileSync("security", ["find-identity", "-v", "-p", "codesigning"], { encoding: "utf8" });
} catch {}
add(/Apple Distribution:/.test(identities), "Apple Distribution identity", /Apple Distribution:/.test(identities)
  ? "Distribution private key is available in the login keychain."
  : "Create or import an Apple Distribution certificate whose private key is present on this Mac.");

const profileDirectories = [
  path.join(os.homedir(), "Library/MobileDevice/Provisioning Profiles"),
  path.join(os.homedir(), "Library/Developer/Xcode/UserData/Provisioning Profiles"),
];
let matchingProfile = null;
for (const directory of profileDirectories) {
  if (!existsSync(directory)) continue;
  for (const filename of readdirSync(directory)) {
    if (!/\.(mobileprovision|provisionprofile)$/.test(filename)) continue;
    const decoded = spawnSync("security", ["cms", "-D", "-i", path.join(directory, filename)], { encoding: "utf8" });
    if (decoded.status !== 0) continue;
    const json = spawnSync("plutil", ["-convert", "json", "-o", "-", "-"], { input: decoded.stdout, encoding: "utf8" });
    if (json.status !== 0) continue;
    const profile = JSON.parse(json.stdout);
    const applicationIdentifier = profile.Entitlements?.["application-identifier"] || "";
    const isDistribution = profile.Entitlements?.["get-task-allow"] === false;
    if (applicationIdentifier === `${teamId}.${bundleId}` && isDistribution && new Date(profile.ExpirationDate) > new Date()) {
      matchingProfile = profile;
    }
  }
}
add(Boolean(matchingProfile), "App Store provisioning profile", matchingProfile
  ? `${matchingProfile.Name} · expires ${matchingProfile.ExpirationDate}`
  : `No valid App Store profile found for ${teamId}.${bundleId}.`);

const pbx = readFileSync(path.join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");
add(pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`), "Bundle identifier", bundleId);
add(pbx.includes(`DEVELOPMENT_TEAM = ${teamId};`), "Development team", teamId);
add(existsSync(path.join(root, "ios/App/App/PrivacyInfo.xcprivacy")), "Privacy manifest", "ios/App/App/PrivacyInfo.xcprivacy");
add(existsSync(path.join(root, "docs/app-store/release-readiness.md")), "Release checklist", "docs/app-store/release-readiness.md");

for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "BLOCKED"} · ${check.label} · ${check.detail}`);
}
const blocked = checks.filter((check) => !check.passed);
console.log(`\n${checks.length - blocked.length}/${checks.length} automated distribution checks passed.`);
if (blocked.length) process.exitCode = 2;
