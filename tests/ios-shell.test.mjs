import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const capacitorConfig = readFileSync(new URL("../capacitor.config.ts", import.meta.url), "utf8");
const project = readFileSync(new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url), "utf8");
const infoPlist = readFileSync(new URL("../ios/App/App/Info.plist", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../ios/App/App/PrivacyInfo.xcprivacy", import.meta.url), "utf8");

test("iOS and H5 builds share the same client build gate", () => {
  assert.match(packageJson.scripts["build:client"], /validate:chapters/);
  assert.match(packageJson.scripts["build:client"], /write-build-manifest/);
  assert.match(packageJson.scripts["ios:sync"], /build:client.*cap sync ios.*check-ios-sync/);
});

test("Capacitor app identity and bundled web directory are stable", () => {
  assert.match(capacitorConfig, /appId: "com\.yonge6\.wendao"/);
  assert.match(capacitorConfig, /webDir: "dist\/client"/);
  assert.match(capacitorConfig, /contentInset: "never"/);
  assert.match(capacitorConfig, /CapacitorHttp:[\s\S]*enabled: true/);
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.yonge6\.wendao;/);
  assert.match(project, /DEVELOPMENT_TEAM = L855ZVM679;/);
  assert.match(project, /TARGETED_DEVICE_FAMILY = 1;/);
  assert.match(infoPlist, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
});

test("privacy manifest is bundled and explicitly disables tracking", () => {
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(privacy, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(privacy, /NSPrivacyCollectedDataTypeOtherUserContent/);
  assert.match(privacy, /NSPrivacyCollectedDataTypeProductInteraction/);
  assert.match(privacy, /NSPrivacyCollectedDataTypePurchaseHistory/);
});
