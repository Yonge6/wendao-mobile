# Wendao consented product usage

Use the existing loopback Python/SQLite editorial collector, with a separate strict schema and table for opt-in H5/iOS product events. Reuse the portfolio usage dashboard, preserve historic GA4 and unrelated product state. Alternatives considered: GA4+Firebase (extra native registration/dependency) and existing legacy /v1/events (different host, insufficient outcome schema). First-party collection offers a single mainland-reachable endpoint without new accounts.

Measure consented pseudonymous installations/sessions, foreground active reading (hidden/idle excluded), chapter/section interest, comics/reflections/sharing outcomes, AI request/completion/error/cancel and latency, paywall/purchase/restore callbacks, manual success and preferences. No questions, answers, birth details, names, search text, raw URLs, tokens or purchase IDs. Metadata enums only; UUID event deduplication; separate H5/iOS and production/test; bounded retention/rate/body sizes. Native release context comes from Swift receipt/build, not a URL query. No callback is booked as revenue.

Consent defaults off, can be changed in More, clears local analytics identifiers on revoke. No pre-consent queue. Native source ships in the next built App; existing App Store packages cannot gain bundled code remotely. Dashboard marks that limit explicitly and keeps absent metrics null. Reports are aggregate only, no per-user timelines. No new scheduler; integrate the existing portfolio sync.

Verify collector validation/dedup/isolation/aggregation, frontend opt-out/idle/outcome behavior, runtime integrity and build, ops null/surface/stale-data behavior, live release hashes and UI. Test transport is isolated from production metrics.
