# ADR-0001: Use Capacitor for the Wendao iOS App

## Status

Accepted

## Context

Wendao already ships a substantial bilingual H5 reading product with 81 chapters, textual-integrity validation, Human Design personalization, search, and a backend API. The iOS edition must stay aligned with that product without creating a second copy of chapter data or interpretation logic.

The App Store also requires more than a repackaged website. The app must remain useful offline, feel native on iPhone, and expose native capabilities while preserving the existing visual language.

## Decision

Use Capacitor 8 as a native iOS container around the existing React/Vite application.

- `src/` and `src/data/chapters.json` remain the only product and content source.
- The H5 build continues to deploy from `dist/client` to GitHub Pages.
- The iOS build runs the same validation and Vite build, then copies that exact output into the native app bundle with `cap sync ios`.
- The first iOS release adds native sharing, haptic feedback, status-bar integration, native HTTP for the existing API, and offline bundled reading.
- The app never loads the production website as its primary UI. Network access is used only for the existing Human Design, conversation, feedback, and event APIs.
- Native requests use Capacitor's bundled HTTP bridge so the installed app can reach those APIs without weakening their browser CORS allowlist.
- A generated build manifest records the Git commit and chapter-data hash in both the web bundle and iOS bundle.

## Consequences

### Positive

- One maintained UI, content model, and chapter dataset.
- H5 and iOS behavior remain testable with the existing Playwright suite.
- All 81 chapters work offline in the installed app.
- Native features can grow incrementally without rewriting the reading experience.
- App Store binaries can be traced to the exact H5 source commit.

### Negative

- App Store binary updates cannot be instantaneous; Apple processing and review remain separate from GitHub Pages deployment.
- Capacitor is a third-party SDK covered by Apple's privacy-manifest and SDK-signature requirements.
- A hybrid app must demonstrate durable utility and native integration to reduce Guideline 4.2 review risk.

### Neutral

- Content and UI are synchronized at source and build level. The public H5 may still reach production before the matching App Store binary is approved.

## Alternatives Considered

**Pure SwiftUI rewrite**

- Rejected because it creates two rendering systems and increases the risk of chapter, Pinyin, collation, and interpretation drift.
- It offers the strongest native feel, but the maintenance cost is disproportionate for the current product.

**Remote `WKWebView` loading `wendao.wonderelian.com`**

- Rejected because it depends on network availability and is more likely to be judged a repackaged website.
- It would provide immediate visual synchronization but weak offline and release integrity.

**React Native rewrite**

- Rejected for the same duplicate-rendering cost as SwiftUI, while retaining a JavaScript/native bridge and adding migration risk.

## References

- [Apple App Review Guidelines 4.2](https://developer.apple.com/app-store/review/guidelines/)
- [Apple third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)
- [Capacitor documentation](https://capacitorjs.com/docs)
