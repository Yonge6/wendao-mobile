# Wendao Human Design and Product Data Design

## Product rule

Reading remains primary. Human Design is a quiet personalization layer, not a separate destination and not a diagram. A reader's chapter-level “你的人生说明书” appears only after the birth data has produced an engine-verified chart snapshot.

## Flow

1. The reader can browse the complete scripture, explanation, and general life guidance without entering personal information.
2. Asking the AI for a personalized response before setup opens the life-manual form.
3. The form collects a name, birth date, exact time, place, and IANA time zone.
4. Wendao calls its dedicated calculation API and receives a versioned snapshot containing a chart hash, type, strategy, authority, profile, definition, incarnation cross, defined centers, channels, and variables.
5. The H5 stores the profile and snapshot locally for continuity and sends the consented profile plus result summary to the Wendao product backend.
6. Personalized chapter guidance and question responses disclose their basis and remain non-prescriptive.

## Data and privacy

- `wendao_profiles`: client UUID, birth inputs, consent timestamp, chart hash, core result, and structural result.
- `wendao_feedback`: message, optional contact, chapter, locale, product version, and resolution status.
- `wendao_conversations`: question, response, chapter, locale, session UUID, and chart hash.
- `wendao_events`: allowlisted functional events with small, non-freeform metadata.
- Browser clients cannot read product tables directly. The API writes with a server-side service credential; Row Level Security blocks public table access.
- The admin password and signed-session secret exist only in deployment environment variables.

## Admin experience

The in-product data console is designed for a phone viewport. A password login creates a time-limited server-signed session. The console exposes overview totals, profile summaries, conversation records, feedback workflow states, and event counts, with refresh and logout controls.

## Content boundary

The Human Design engine remains in its own licensed service. Wendao consumes its HTTPS JSON API and does not copy the engine or BodyGraph implementation into this repository.
