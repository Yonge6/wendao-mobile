# Wendao Experience Improvements Implementation Plan

**Goal:** Complete the approved H5/App audit improvements while retaining the current reading identity, canonical stories, account/payment boundaries and small native bundle.

**Architecture:** Reuse the existing React/Capacitor reader and companion components. Improve state recovery, dedicated purchase presentation, media loading and bounded caching; retain StoreKit prices and server-enforced free allowance. Public analytics remains opt-in and allowlisted.

**Tech Stack:** React, TypeScript, Vite, Capacitor iOS, Supabase, StoreKit, Node tests, browser QA.

## Design decision

The user approved all recommendations in the 2026-10-13 audit. Reuse existing components and tokens rather than introducing a second membership or reading architecture. A full redesign would create unnecessary inconsistency; isolated copy-only changes would leave the confirmed recovery bugs unresolved.

## Ownership and implementation

1. Root: `src/Prototype.tsx`, `src/prototype.css`, `AGENTS.md` and integration. Fix theme contrast, add comic/topic/chapter filters and thumbnails, offer received/silk directory order, progressive collation disclosure, compact scrolling app banner/composer, wider comic detail and media-cache controls. Preserve legacy URLs and contents.
2. AI task: `src/companion/CompanionPanel.tsx`, `CompanionAuth.tsx`, `SubscriptionPanel.tsx`, new allowance helper, related tests. Refresh on foreground/day rollover/failure; propagate current allowance to the reader; return membership result rather than a fixed failure notice; present purchase intent before sign-in and update H5 cross-platform copy. Coordinate dialog title/props with root; do not edit Prototype/CSS.
3. Media task: `src/LifeStoryContent.tsx`, `src/ShareCardPanel.tsx`, `src/shareCard.ts`, `src/lifeStoryShare.ts`, `src/lifeStoryAssets.ts`, `src/native.ts`, iOS Photos plugin if necessary, new cache/loader helpers and tests. WebP preview first, original PNG only on save/share; loading/offline/retry/timeout/cancellation; bounded persistent recent-image cache and clear operation; permission repair. Coordinate CSS classes with root.
4. Analytics task: `public/product-usage.js`, `src/productUsage.ts`, `growth/usage.py`, `tests/product-usage*`, `growth/test_usage.py` and related allowlist tests. Preserve safe target and entry enums, correctly count restored lifetime purchases, verify backend metadata survival. Coordinate restore line in SubscriptionPanel with AI task; do not edit that panel concurrently.

## Acceptance

- Night drawer body, quotation and practice are legible in both languages; day design remains consistent.
- Free AI allowance restores on UTC rollover, foreground and released failed reservation; quota failures are distinguishable from account/network failures.
- Membership refresh displays actual active/inactive/error outcome. Buying starts in a membership/unlock surface with rights/plan visibility before login, preserving the intended plan.
- Home states explicitly communicate daily free access and current remaining allowance.
- Comic reading and enlarging use lightweight WebP; original PNG is downloaded for file-only share/save. Slow/failing download has cancel/retry and does not freeze controls.
- Recently viewed comics have a bounded cache that can be cleared; text remains accessible offline.
- Comic collection can be filtered by search/theme/chapter, with lightweight thumbnails and distinct legacy-essay labels. Both directory orders remain searchable without consuming free choices.
- Mobile scroll compactness retains the closable App download banner; desktop comic detail uses useful reading width.
- Safe analytics target/source values reach the collector; lifetime restore is counted as found. Consent/test exclusions stay enforced.

## Validation and delivery

Run targeted behavioral tests, then `npm test`, `npm run check:runtime`, `npm run build:pages`, and `npm run ios:sync`. Browser QA at phone and desktop sizes covers Chinese/English, day/night, membership intent, comic filter/preview/error/retry and responsive chrome. Retain actual screenshots. Verify deployed H5 build and event metadata after deployment. Check native build tooling before claiming an App binary/install/review result; distinguish source sync from a signed build or Apple release.

Preserve all pre-existing untracked screenshots/work/build artifacts in the main checkout.
