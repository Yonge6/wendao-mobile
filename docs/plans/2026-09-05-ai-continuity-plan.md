# AI Wendao continuity implementation plan

**Goal:** Restore account-owned conversations, preserve the reader's scroll position, and retrieve relevant memories without another model request.

**Architecture:** Read existing Supabase threads/messages with both authenticated RLS and explicit user filters. Keep conversation text in component memory, not local storage. Use a bounded deterministic lexical retriever over active, unexpired memories; preserve the existing model, entitlement and privacy contracts.

**Tech Stack:** React/TypeScript, Supabase, Node API, Playwright.

## 1. Conversation recovery
- Create `src/companion/history.ts`; query 20 recent threads and 40 recent messages, always scoped to the session user. Order same-timestamp user/assistant pairs consistently.
- Add tests in `tests/companion-history.test.mjs` for ownership filters, ordering and failures.
- Update `CompanionPanel.tsx`: latest conversation restore, recent-conversation picker, explicit new conversation, loading/retry states, cancellation/stale-result guards, keyed account boundary. Never let failed history loading silently send into an unintended new thread.
- Run `node --test tests/companion-history.test.mjs`; expect all passed.

## 2. Reading and response states
- Follow output only while the reader is near the bottom. Show a compact return-to-latest control when they scroll up; use reduced-motion-safe scrolling.
- Preserve the fixed composer. Separate slow waiting from actual server fallback. Retry the original failed exchange/request identifier in place, preserving its original chapter/language/thread and existing partial text until a replacement begins.
- Add authored browser tests using fake authenticated API responses, never real account content, to cover restore/reload, account switch, stale history, streaming scroll, new conversations and retry.

## 3. Relevant memory
- Expand `getContext`'s candidate pool from 5 to 100, bounded; select up to 5 active, unexpired summaries in `context.mjs` using question overlap first, follow-up context when needed, then chapter overlap, confidence and freshness.
- Keep only kind/summary in model context. Do not forward irrelevant high-confidence memories or raw personal fields.
- Add bilingual retrieval tests including unrelated memories, expiry, paused memory and deterministic ranking. Run `node --test tests/companion-context.test.mjs tests/companion-store.test.mjs`.

## Verification and release
- Run `npm run build`, `npm test`, full Playwright, focused WebKit and inspect screenshots at phone/iPad sizes.
- Build the shared native bundle and verify signing. Deploy the existing API and H5 only after tests pass; use existing deployment targets, then verify public health/build metadata without submitting real AI questions.
- Physical installation remains conditional on the user's device being connected and unlocked.

No new database schema, model-provider change, automatic question submission or conversation deletion is part of this change.
