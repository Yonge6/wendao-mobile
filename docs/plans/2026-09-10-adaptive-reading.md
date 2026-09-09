# Adaptive reading and review replacement

User-approved design: preserve the paper-and-ink reader, with reading on the left and the existing AI conversation on the right when the available window is wide enough. Narrow windows retain one full-screen conversation. Resize must never recreate the conversation or interrupt a request.

1. Add an app-owned adaptive workspace hook and styles in `src/Prototype.tsx`, `src/prototype.css`, and `src/useReadingResizeAnchor.ts`. Use available CSS width, not a device name, orientation, or presumed fold angle. Keep existing authentication, subscriptions, and chapter content.
2. At 800 CSS px and above, present two independently scrollable panes. Below 800 px, retain the existing dialog. Preserve the reading anchor, current chapter, draft, history, and streaming request. Keep keyboard and safe-area handling.
3. Add meaningful Playwright coverage for breakpoint transitions, draft and stream continuity, reading position, pane scrolling, English, and short windows. Run runtime, chapter, TypeScript, unit, and focused UI checks.
4. Increment all iOS targets to 1.8 (19), sync the validated shared web bundle, archive and upload. Verify iPhone and iPad native launches and capture actual native screenshots in both languages. Do not fabricate an iPhone Duo screenshot or claim device validation without an official runtime/device.
5. Publish and verify the matching H5 artifact. Preserve rollback artifacts.
6. Once build 19 is processed and replacement materials are ready, remove build 17's waiting submission, update both locales and reviewer notes with all unpublished 1.8 changes plus adaptive reading, select 19, and submit. Verify the final Apple review state and automatic release selection.

Environment at start: Xcode 26.6, iOS 26.5 simulator; no iPhone Duo runtime. Existing 1.8 (17) remains waiting for review until replacement readiness.

Native QA caught English header wrapping in build 18; build 19 fixes the header flex width and adds a regression assertion. Build 18 was uploaded but is not intended for review.
