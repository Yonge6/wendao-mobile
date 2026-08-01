# Wendao iOS App Store Implementation Plan

> **For Codex:** Execute this plan task-by-task in the existing repository. Do not create a worktree. Preserve the H5 deployment and chapter data as the source of truth.

**Goal:** Build an App Store-ready iPhone edition of Wendao that shares the H5 product source and cannot silently drift from it.

**Architecture:** Capacitor 8 packages the existing React/Vite output into a native iOS app. The web and iOS builds run the same chapter and runtime gates. A build manifest and byte-level sync audit prove which web commit is embedded in the app.

**Tech Stack:** React 19, Vite 8, TypeScript, Capacitor 8, Swift Package Manager, Xcode 26, iOS 15+.

---

### Task 1: Record architecture and product constraints

**Files:**

- Create: `docs/adr/0001-capacitor-shared-web-core.md`
- Modify: `AGENTS.md`

**Steps:**

1. Document why Capacitor is chosen over SwiftUI and a remote web wrapper.
2. State that chapter data and UI live only in the current React/Vite source.
3. State that App Store approval prevents truly simultaneous binary release.
4. Record native minimum-functionality features and privacy constraints.

### Task 2: Add Capacitor and generate the iOS project

**Files:**

- Create: `capacitor.config.ts`
- Create: `ios/`
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**

1. Install Capacitor 8 core, CLI, iOS, Haptics, Share, Splash Screen, and Status Bar packages.
2. Configure app ID `com.yonge6.wendao`, app name `三慢问道`, and `webDir: dist/client`.
3. Add iOS with `npx cap add ios`.
4. Set deployment target to iOS 15.0, version 1.0.0, build 1, team `L855ZVM679`, phone and iPad support, and Chinese/English localizations.
5. Add a valid app privacy manifest.

### Task 3: Add shared native integrations

**Files:**

- Create: `src/native.ts`
- Modify: `src/Prototype.tsx`
- Modify: `src/prototype.css`

**Steps:**

1. Initialize native status-bar behavior and native HTTP only on Capacitor.
2. Add subtle haptics to chance selection, chapter continuation, and successful native actions.
3. Add a bilingual share action to the existing drawer.
4. Use the Capacitor Share sheet in iOS and Web Share/clipboard fallback in H5.
5. Keep all existing browser behavior intact.

### Task 4: Prove web/iOS synchronization

**Files:**

- Create: `scripts/write-build-manifest.mjs`
- Create: `scripts/check-ios-sync.mjs`
- Create: `tests/ios-sync.test.mjs`
- Modify: `package.json`

**Steps:**

1. Generate a manifest containing commit, app version, chapter count, and chapter-data SHA-256.
2. Add `ios:sync` to run runtime checks, chapter validation, TypeScript, Vite, manifest generation, and `cap sync ios`.
3. Compare `dist/client` against `ios/App/App/public`, excluding native-only metadata.
4. Fail if the iOS bundle does not contain 81 chapters or if hashes differ.
5. Add an unsigned simulator build command.

### Task 5: Add continuous iOS compatibility checks

**Files:**

- Create: `.github/workflows/ios-check.yml`

**Steps:**

1. Run dependency installation and `npm run ios:sync` on macOS.
2. Build the simulator target without signing.
3. Upload the build manifest as a CI artifact.
4. Keep App Store upload manual until distribution credentials and the App Store record exist.

### Task 6: Build and inspect the app

**Steps:**

1. Run all unit, textual-integrity, runtime, and sites tests.
2. Run `npm run ios:sync`.
3. Build with Xcode for the available iOS simulator.
4. Launch the app and verify chapter 8, directory search, chance selection, continuous reading, drawer, bilingual mode, and offline startup.
5. Confirm no horizontal overflow and no JavaScript or native console errors.

### Task 7: Prepare App Store delivery

**Files:**

- Create: `docs/app-store/release-readiness.md`
- Create: `scripts/check-ios-distribution.mjs`
- Modify: `package.json`

**Steps:**

1. Audit Xcode version, iOS SDK, team, bundle ID, version/build, distribution identity, provisioning profile, privacy manifest, and archive contents.
2. Prepare bilingual name, subtitle, description, keywords, privacy URL, support URL, review notes, and screenshot checklist.
3. Archive only after the bundle ID is registered and distribution signing is available.
4. Upload through Xcode or Transporter only after an App Store Connect record exists.
