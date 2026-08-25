# Companion entry, Apple auth, and payment confirmation

## Interaction design

The fixed reading composer becomes a single entry control rather than an unauthenticated text field. Clicking anywhere on it opens `我的问道 / My Wendao` immediately. A signed-out reader sees Apple and Google login; a signed-in reader continues to membership or conversation. Questions are entered only inside the authenticated Companion view, so the product no longer asks a reader to type something that cannot yet be submitted.

The iOS subscription cards select a plan without starting payment. Annual remains the recommended default, both cards expose their selected state, and one primary button below the two prices confirms the selection and opens StoreKit. Restore purchase, legal links, and account controls remain separate.

`留下回响 / Leave a note` is removed from the public drawer and its public form state is deleted. Existing feedback data and the private admin console remain intact so historical records are not destroyed.

## Apple authentication recovery

Supabase continues to use the PKCE flow and the existing `com.yonge6.wendao://auth/callback` URL scheme. The native auth handler processes both the normal `appUrlOpen` event and `App.getLaunchUrl()` for a cold-start return from Apple. Callback parsing distinguishes provider cancellation/errors from a missing PKCE code, prevents duplicate exchanges, and permits retry after a failed exchange. Apple requests `name email`; Google requests `openid email profile`.

## Verification

Regression coverage proves that the reading composer opens login on its first click, the removed feedback entry is absent, and native callback parsing handles success, unrelated links, provider errors, and incomplete callbacks. Release validation includes runtime integrity, TypeScript, all unit tests, browser tests, chapter validation, the shared iOS sync, and an iOS simulator build.
