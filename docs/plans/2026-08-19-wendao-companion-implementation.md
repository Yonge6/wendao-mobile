# Wendao Companion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the paid, cross-platform `问道同行 / Wendao Companion` with Apple/Google login, transparent automatic memory, DeepSeek dual-model responses, unified StoreKit/Stripe entitlements, unlimited member questions with abuse safeguards, and the existing free reading experience preserved.

**Architecture:** Keep the existing React/Vite code shared by GitHub Pages and the bundled Capacitor iOS app. Add Supabase Auth/Postgres for identity and user-owned data, a separately deployed Wendao API for authenticated model and payment operations, StoreKit for iOS billing, and Stripe Checkout for H5 billing. All external providers map into a single account entitlement and provider-neutral AI interface.

**Tech Stack:** React 19, TypeScript, Vite, Capacitor 8, Supabase Auth/Postgres/RLS, Vercel Functions, DeepSeek V4-Pro/V4-Flash, Stripe Billing, StoreKit 2, Node test runner, Playwright, Xcode.

**Workspace constraint:** Execute in the existing checkout `/Users/yongyuan/Documents/道德经/wendao-mobile`; do not create a worktree and never add or modify any `.DS_Store`.

---

### Task 1: Lock product decisions and test seams

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/plans/2026-08-19-wendao-companion-design.md`
- Create: `docs/plans/2026-08-19-wendao-companion-implementation.md`

**Steps:**
1. Record the confirmed login, memory, proactive behavior, subscription, platform, model, and privacy decisions.
2. Remove the obsolete rule that forces a life manual before AI access.
3. Verify `git diff --check` and confirm `.DS_Store` files remain untracked.
4. Commit only these three files.

### Task 2: Add companion configuration and pure domain models

**Files:**
- Create: `src/companion/types.ts`
- Create: `src/companion/config.ts`
- Create: `src/companion/entitlements.ts`
- Create: `src/companion/memory.ts`
- Create: `tests/companion-domain.test.mjs`
- Modify: `src/vite-env.d.ts`

**Steps:**
1. Write failing tests for entitlement state, unlimited member access, memory lifecycle, and sensitive-memory rejection.
2. Add typed environment configuration without secrets or production defaults that could leak credentials.
3. Implement pure entitlement and memory functions.
4. Run `node --test tests/companion-domain.test.mjs` and expect all tests to pass.
5. Commit the domain layer.

### Task 3: Migrate anonymous product data to authenticated ownership

**Files:**
- Create: `supabase/migrations/202608190001_wendao_companion.sql`
- Create: `tests/companion-schema.test.mjs`
- Modify: `supabase/config.toml`

**Steps:**
1. Write schema-contract tests for required tables, foreign keys, indexes, constraints, and RLS policies.
2. Add `wendao_accounts`, `wendao_threads`, `wendao_messages`, `wendao_memories`, `wendao_weekly_reflections`, `wendao_entitlements`, `wendao_usage_periods`, and `wendao_billing_events`.
3. Add nullable authenticated ownership to legacy profiles, feedback, conversations, and events without destroying existing anonymous records.
4. Enable and force RLS; use `(select auth.uid())` policies and indexed `user_id` foreign keys.
5. Add safe account-deletion helpers and idempotent billing-event constraints.
6. Run the schema test and, when a linked local Supabase is available, run `supabase db reset`.
7. Commit the migration.

### Task 4: Build the provider-neutral server foundation

**Files:**
- Create: `api/_lib/http.mjs`
- Create: `api/_lib/env.mjs`
- Create: `api/_lib/auth.mjs`
- Create: `api/_lib/entitlements.mjs`
- Create: `api/_lib/providers/deepseek.mjs`
- Create: `api/_lib/providers/index.mjs`
- Create: `api/health.mjs`
- Create: `tests/companion-api.test.mjs`
- Create: `vercel.json`
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**
1. Write failing tests for origin allowlisting, bearer-token parsing, safe errors, provider request shape, and timeouts.
2. Add strict environment validation for Supabase, DeepSeek, Stripe, Apple, and public origins.
3. Implement JSON response helpers, CORS allowlisting, request IDs, timeouts, and sanitized logging.
4. Implement a DeepSeek adapter mapping visible responses to V4-Pro and background structured jobs to V4-Flash.
5. Add a health endpoint that exposes no credentials.
6. Run API unit tests and `npm audit`.
7. Commit the server foundation.

### Task 5: Implement authenticated conversations and automatic memory

**Files:**
- Create: `api/companion/respond.mjs`
- Create: `api/companion/memories.mjs`
- Create: `api/companion/weekly-reflection.mjs`
- Create: `api/_lib/context.mjs`
- Create: `api/_lib/safety.mjs`
- Create: `tests/companion-response.test.mjs`
- Modify: `src/data/chapters.ts` only if a server-safe export is required; never duplicate chapter content.

**Steps:**
1. Write failing tests for login, entitlement, usage observation, idempotency, chapter grounding, optional life-manual context, and high-risk prompts.
2. Implement server-side chapter retrieval from the canonical data source.
3. Implement memory retrieval with explicit limits and no raw account/birth/payment fields.
4. Stream the V4-Pro response, save the successful message, record use once, and enqueue V4-Flash memory extraction.
5. Implement memory list/edit/delete/pause/clear operations with ownership checks.
6. Implement weekly reflection generation as an included membership benefit.
7. Verify failed provider requests do not remain in usage observation or create memories.
8. Commit the companion API.

### Task 6: Add Apple/Google login and session handling

**Files:**
- Create: `src/companion/client.ts`
- Create: `src/companion/auth.ts`
- Create: `src/companion/CompanionAuth.tsx`
- Modify: `src/Prototype.tsx`
- Modify: `src/prototype.css`
- Modify: `capacitor.config.ts`
- Modify native URL handling files only as required by the chosen OAuth callback.
- Modify: `mobile-runtime.lock.json` after verified runtime changes.
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**
1. Add Supabase client dependency and failing browser tests for the login gate.
2. Implement Apple and Google OAuth with one normalized session model on H5 and iOS.
3. Route the AI composer to login rather than the birth form.
4. Preserve free reading and optional life-manual creation.
5. Implement logout and account-deletion entry points.
6. Run runtime lock, Playwright, and iOS simulator build checks.
7. Commit authentication.

### Task 7: Implement the Companion UI

**Files:**
- Create: `src/companion/CompanionPanel.tsx`
- Create: `src/companion/MemoryPanel.tsx`
- Create: `src/companion/SubscriptionPanel.tsx`
- Modify: `src/Prototype.tsx`
- Modify: `src/prototype.css`
- Modify: `tests/product-flow.spec.ts`

**Steps:**
1. Add failing tests for login, paywall, conversation, unlimited access, usage observation, memory controls, weekly reflection, and life-manual optionality.
2. Add `我的问道 / My Wendao` to the existing drawer hierarchy.
3. Implement continue conversation, today reminder, weekly reflection, and memory management surfaces.
4. Replace the preview response with authenticated streaming output.
5. Keep the fixed composer safe-area, scrolling, and keyboard contracts intact.
6. Verify Chinese/English, 320px header, day/night mode, text sizes, and reduced motion.
7. Commit the Companion UI.

### Task 8: Add Stripe web subscriptions

**Files:**
- Create: `api/billing/stripe-checkout.mjs`
- Create: `api/billing/stripe-portal.mjs`
- Create: `api/billing/stripe-webhook.mjs`
- Create: `tests/stripe-billing.test.mjs`
- Modify: `src/companion/SubscriptionPanel.tsx`

**Steps:**
1. Add Stripe server dependency and webhook-signature tests.
2. Create monthly/annual Checkout Sessions only for authenticated accounts without active entitlements.
3. Process checkout, invoice paid/failed, cancellation, and refund events idempotently.
4. Expose Customer Portal only to the owning user.
5. Verify duplicate provider events and duplicate active subscriptions are rejected.
6. Commit Stripe billing.

### Task 9: Add StoreKit 2 subscriptions

**Files:**
- Create native Swift bridge files under `ios/App/App/` for product loading, purchase, restore, and transaction state.
- Create: `src/companion/storekit.ts`
- Create: `api/billing/apple-notifications.mjs`
- Create: `tests/apple-billing.test.mjs`
- Modify: `ios/App/App.xcodeproj/project.pbxproj`
- Modify: `ios/App/App/PrivacyInfo.xcprivacy`
- Modify: `mobile-runtime.lock.json`

**Steps:**
1. Add StoreKit configuration and server-notification fixture tests.
2. Implement monthly/annual product loading, purchase, restore, and manage-subscription actions.
3. Verify signed App Store Server Notification payloads and update unified entitlements idempotently.
4. Hide Stripe purchase links in native iOS while honoring existing web entitlements.
5. Test StoreKit locally and in App Store sandbox/TestFlight.
6. Run `npm run ios:build:simulator` and distribution readiness checks.
7. Commit StoreKit billing.

### Task 10: Quality benchmark, safeguards, and confirmed pricing

**Files:**
- Create: `tests/fixtures/companion-eval.json`
- Create: `scripts/evaluate-companion-models.mjs`
- Create: `docs/companion-model-evaluation.md`
- Modify subscription configuration after user approval of measured pricing.

**Steps:**
1. Build bilingual cases covering all 81 chapters, common life domains, optional life-manual context, memory correction, and high-risk safety.
2. Compare V4-Pro user responses and V4-Flash structured tasks for grounding, specificity, tone, safety, latency, and token cost.
3. Calculate a normal and heavy monthly cost envelope.
4. Apply the approved prices: monthly `¥68 / US$19.99`, annual `¥698 / US$199.99`, with other storefronts localized from USD.
5. Lock unlimited active-member questions plus concurrency, rate, and abuse safeguards in server behavior and App Store/Stripe metadata.
6. Commit the benchmark and approved configuration.

### Task 11: Privacy, account lifecycle, and security audit

**Files:**
- Modify: `public/privacy.html`
- Modify: `docs/app-store/privacy-answers.md`
- Modify: `docs/app-store/review-notes.md`
- Create: `docs/companion-security-review.md`
- Modify: account UI and API files as findings require.

**Steps:**
1. Disclose AI processing, DeepSeek processing location, account providers, billing sources, memory controls, retention, export, and deletion.
2. Implement data export, delete account, pause memory, and clear memory end to end.
3. Audit OWASP access control, secrets, CORS, injection, XSS, rate limits, webhook signatures, and error leakage.
4. Run dependency audit and RLS cross-user tests.
5. Fix all critical/high findings before release.
6. Commit privacy and security work.

### Task 12: Full verification and release

**Files:**
- Modify App Store metadata/screenshots only if the finished UI materially changes the listing.

**Steps:**
1. Run `npm run check:runtime`, `npm run validate:chapters`, `npm test`, full Playwright, build, Sites tests, iOS sync, simulator build, and distribution readiness.
2. Validate Apple/Google login, Stripe test purchase, StoreKit sandbox purchase/restore, cross-platform entitlement, unlimited access with abuse safeguards, memory deletion, and account deletion.
3. Test H5 and iOS in Chinese and English with and without a life manual.
4. Commit only intentional files; leave every `.DS_Store` untracked.
5. Push, wait for Pages and iOS CI, verify the production domain, upload the new iOS build, and submit the version with its first subscription group for App Review.
