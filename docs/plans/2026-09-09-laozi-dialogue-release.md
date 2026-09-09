# Wendao 1.8: Quiet Laozi-Inspired Dialogue and Lifetime Pricing Implementation Plan

> Execute the approved scope in this session; preserve unrelated screenshot and device-build files.

**Goal:** Give AI dialogue the plain, quiet feel of consulting a wise elder grounded in Laozi, lower lifetime reading pricing, publish H5/API, and submit iOS with accurate materials and automatic release after approval.

**Architecture:** Keep the single server-side bilingual instruction builder and canonical chapter context. Keep identity as AI, exact source quotation, relevant memory, paid AI access and immediate safety handling. StoreKit remains the price authority; lifetime reading remains separate from AI subscription.

**Tech Stack:** React/Vite, Node, DeepSeek, Supabase, Capacitor/StoreKit, Xcode, App Store Connect, Aliyun Nginx.

## 1. Prices
- Confirm `com.yonge6.wendao.reading.lifetime` and worldwide availability in App Store Connect.
- Set USA base to exactly US$7.00; localize other storefronts through Apple, with mainland China override requested at CNY9.99. Inspect all supported price points before choosing any alternative.
- Update `src/companion/plans.ts`, existing `tests/companion-plans.test.mjs`, and AGENTS. Read back the saved schedule; distinguish it from StoreKit propagation.

## 2. Dialogue
- Update `api/_lib/context.mjs` bilingual instructions: simple contemporary language, listen before interpreting, at most one relevant metaphor or supplied quote, no theatrical archaism or invented attribution. Use Laozi's non-forcing, discernment and enoughness where relevant without prescribing passivity. Do not force a practice or question at every ending.
- Update entry/empty state copy in `src/companion/CompanionPanel.tsx` and the owning public reading entry in `src/Prototype.tsx` where present.
- Preserve context budget, privacy, memory handling, native/H5 entitlement and safety response flow.
- Validate existing context/respond/safety tests plus representative synthetic real-model conversations in Chinese and English (no private user data). Check quotation accuracy and multi-turn continuity manually.

## 3. Product and materials
- Use “借老子的智慧，聊眼前的困惑” and equivalent English; keep AI identity visible and avoid literal impersonation claims.
- Review `docs/app-store/metadata/{zh-Hans,en-US}.md`, `screenshot-copy.md`, existing screenshots and review notes. Update descriptions, promotional text, what's new and AI-focused screenshots only when they misrepresent the final product. Never fabricate paid-user or model conversations in marketing screenshots.
- Keep exact regional prices out of globally shared screenshots. Use verified store price display.

## 4. Version and verification
- Bump App and Widget to 1.8, next unused build after inspecting TestFlight. Update version assertions.
- Run npm test, npm run build:pages and relevant browser flows. Run ios:sync, simulator build and archive/signature checks. Capture actual iPhone/iPad UI where needed.

## 5. Release
- Commit only scoped changes. Publish exact build artifact to existing H5 target with backup; publish server prompt to existing API target with backup/restart. Verify public manifests/resources and server response behavior.
- Upload archive once, confirm processed build, create/select 1.8, save localized materials, review notes and unchanged privacy/entitlement disclosures.
- Submit for Apple review, retain automatic release after approval; read back actual submission status. Do not describe Waiting for Review as publicly released.

## Acceptance boundaries
- A successful local build is not a release. Backend pricing schedules are not proof of device propagation. Unit assertions alone do not prove conversational tone. No unverified Apple approval or phone-store purchase claims.
