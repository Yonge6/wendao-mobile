import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";

function nativeModule({ platform = "web", save = async () => ({ saved: true }), openSettings = async () => undefined, share = async () => undefined, active = true } = {}) {
  const calls = [];
  const modules = {
    "@capacitor/core": { Capacitor: { getPlatform: () => platform, isNativePlatform: () => platform !== "web" } },
    "@capacitor/filesystem": { Directory: { Cache: "CACHE" }, Filesystem: {
      writeFile: async options => { calls.push(["write", options]); },
      getUri: async options => ({ uri: `file:///cache/${options.path}` }),
      deleteFile: async options => { calls.push(["delete", options]); },
    } },
    "@capacitor/haptics": { Haptics: {}, ImpactStyle: {} }, "@capacitor/share": { Share: { share: async options => { calls.push(["share", options]); } } },
    "@capacitor/splash-screen": { SplashScreen: {} }, "@capacitor/status-bar": { StatusBar: {}, Style: {} },
    "./companion/storekit": { saveStoreKitImage: save, openStoreKitSettings: openSettings },
  };
  const context = { ...Object.assign({}, ...Object.values(modules)), exports: {}, DOMException, File, Uint8Array, atob,
    navigator: { userAgent: "Browser", userActivation: { isActive: active }, canShare: () => true, share },
    document: { createElement: () => ({ click() { calls.push(["download"]); } }) } };
  const code = stripTypeScriptTypes(readFileSync(new URL("../src/native.ts", import.meta.url), "utf8"))
    .replace(/^import .*;$/gm, "")
    .replace(/^export \{.*\};$/gm, "")
    .replace(/^export /gm, "");
  vm.runInNewContext(`${code}\nObject.assign(exports, { shareCardImage, saveCardImage, openPhotosSettings });`, context);
  return { api: context.exports, calls, navigator: context.navigator };
}
const dataUrl = "data:image/png;base64,iVBORw0KGgo=";

test("native share sends a PNG file only and removes its temporary file after completion", async () => {
  const { api, calls } = nativeModule({ platform: "ios" });
  assert.equal(await api.shareCardImage(dataUrl, "comic.png", "Comic"), "shared");
  assert.equal(calls[0][0], "write");
  assert.equal(calls[0][1].data, "iVBORw0KGgo=");
  const payload = calls[1][1];
  assert.equal(payload.files[0], "file:///cache/comic.png");
  assert.equal(payload.files.length, 1);
  assert.equal("url" in payload, false);
  assert.equal("text" in payload, false);
  assert.equal(calls[2][0], "delete");
});

test("Photos permission denial is distinguishable and Settings repair reports the real outcome", async () => {
  let opened = false;
  const { api } = nativeModule({ platform: "ios", save: async () => { throw { code: "PHOTOS_PERMISSION_DENIED" }; }, openSettings: async () => { opened = true; } });
  assert.equal(await api.saveCardImage(dataUrl, "comic.png", "Comic"), "permission-denied");
  assert.equal(await api.openPhotosSettings(), true);
  assert.equal(opened, true);
  const failed = nativeModule({ platform: "ios", save: async () => { throw { code: "PHOTO_SAVE_FAILED" }; }, openSettings: async () => { throw new Error("Unavailable"); } });
  assert.equal(await failed.api.saveCardImage(dataUrl, "comic.png", "Comic"), "unavailable");
  assert.equal(await failed.api.openPhotosSettings(), false);
});

test("browser requests a new tap after asynchronous preparation, preserving file-only Web Share", async () => {
  let payload;
  const { api, navigator } = nativeModule({ active: false, share: async value => { payload = value; } });
  assert.equal(await api.shareCardImage(dataUrl, "comic.png", "Comic"), "activation-required");
  assert.equal(payload, undefined);
  navigator.userActivation.isActive = true;
  assert.equal(await api.shareCardImage(dataUrl, "comic.png", "Comic"), "shared");
  assert.equal(payload.files[0].type, "image/png");
  assert.equal(Object.keys(payload).length, 1);
});

test("WeChat save and share return a long-press preview without download or system sharing", async () => {
  let shared = false;
  const { api, navigator, calls } = nativeModule({ share: async () => { shared = true; } });
  navigator.userAgent = "MicroMessenger iPhone";
  assert.equal(await api.shareCardImage(dataUrl, "comic.png", "Comic"), "preview");
  assert.equal(await api.saveCardImage(dataUrl, "comic.png", "Comic"), "preview");
  assert.equal(shared, false);
  assert.equal(calls.length, 0);
});
