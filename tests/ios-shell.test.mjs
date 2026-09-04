import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const capacitorConfig = readFileSync(new URL("../capacitor.config.ts", import.meta.url), "utf8");
const project = readFileSync(new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url), "utf8");
const infoPlist = readFileSync(new URL("../ios/App/App/Info.plist", import.meta.url), "utf8");
const englishInfoPlist = readFileSync(new URL("../ios/App/App/en.lproj/InfoPlist.strings", import.meta.url), "utf8");
const chineseInfoPlist = readFileSync(new URL("../ios/App/App/zh-Hans.lproj/InfoPlist.strings", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../ios/App/App/PrivacyInfo.xcprivacy", import.meta.url), "utf8");
const companionEnvCheck = readFileSync(new URL("../scripts/check-companion-client-env.mjs", import.meta.url), "utf8");
const buildManifestWriter = readFileSync(new URL("../scripts/write-build-manifest.mjs", import.meta.url), "utf8");
const iosWorkflow = readFileSync(new URL("../.github/workflows/ios-check.yml", import.meta.url), "utf8");

test("iOS and H5 builds share the same client build gate", () => {
  assert.match(packageJson.scripts["build:client"], /validate:chapters/);
  assert.match(packageJson.scripts["build:client"], /write-build-manifest/);
  assert.match(packageJson.scripts["ios:sync"], /check-companion-client-env.*build:client.*cap sync ios.*check-ios-sync/);
  assert.match(companionEnvCheck, /VITE_SUPABASE_URL/);
  assert.match(companionEnvCheck, /VITE_SUPABASE_ANON_KEY/);
  assert.match(companionEnvCheck, /VITE_COMPANION_API_URL/);
  assert.match(iosWorkflow, /VITE_SUPABASE_URL: \$\{\{ vars\.VITE_SUPABASE_URL \}\}/);
  assert.match(iosWorkflow, /VITE_SUPABASE_ANON_KEY: \$\{\{ vars\.VITE_SUPABASE_ANON_KEY \}\}/);
  assert.match(iosWorkflow, /VITE_COMPANION_API_URL: \$\{\{ vars\.VITE_COMPANION_API_URL \}\}/);
  assert.match(buildManifestWriter, /readSingleBuildSetting\("MARKETING_VERSION"\)/);
  assert.match(buildManifestWriter, /readSingleBuildSetting\("CURRENT_PROJECT_VERSION"\)/);
  assert.doesNotMatch(buildManifestWriter, /appVersion: "1\.0"/);
});

test("Capacitor app identity and bundled web directory are stable", () => {
  assert.match(capacitorConfig, /appId: "com\.yonge6\.wendao"/);
  assert.match(capacitorConfig, /webDir: "dist\/client"/);
  assert.match(capacitorConfig, /contentInset: "never"/);
  assert.match(capacitorConfig, /CapacitorHttp:[\s\S]*enabled: true/);
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.yonge6\.wendao;/);
  assert.match(project, /DEVELOPMENT_TEAM = L855ZVM679;/);
  assert.match(project, /TARGETED_DEVICE_FAMILY = 1;/);
  assert.match(project, /CURRENT_PROJECT_VERSION = 11;/);
  assert.match(project, /MARKETING_VERSION = 1\.5;/);
  assert.match(project, /WendaoWidgetExtension/);
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.yonge6\.wendao\.widget;/);
  assert.match(infoPlist, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.match(englishInfoPlist, /"CFBundleDisplayName" = "Wendao AI";/);
  assert.match(chineseInfoPlist, /"CFBundleDisplayName" = "三慢问道 AI";/);
});

test("privacy manifest is bundled and explicitly disables tracking", () => {
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(privacy, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(privacy, /NSPrivacyCollectedDataTypeOtherUserContent/);
  assert.match(privacy, /NSPrivacyCollectedDataTypeProductInteraction/);
  assert.match(privacy, /NSPrivacyCollectedDataTypePurchaseHistory/);
});
