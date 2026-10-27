<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep phone app views inside the existing Phone shell, dispatched by stable app ID, so icon edits cannot change app identity or replace the home screen.
- Persist fictional phone edits through the existing browser-local store; load only after mount to keep server and browser markup consistent.
- Centralize story dates and message sorting in browser-safe data utilities so all app views use the same chronology.
- Use one Phone-owned system language for every app; legacy chats gain translations only by exact original-text match, preserving explicit edits.
- Extend existing versioned local-store records with optional fields; snapshot phone storage once before changes and never reseed or reset saved data.
- Keep ordered post images, tweet replies, calendar events and music collections in browser-safe dedicated utilities; captions/comments and unrelated records remain isolated during edits.
- Simulated Anton messages live in phone/live.ts: append-only with fixed ids and one timer in Phone, so saved chats are never rewritten and each message arrives once.
- Phone owns the single foreground conversation scheduler; persisted reply jobs reference source IDs and append deduplicated contextual presets, so replies survive app switches without pretending to use AI.
- Instagram Stories and DMs use separate versioned keys; feed and profile share existing posts by ID, so captions, comments and KKT records remain isolated.
- Store added fictional Instagram accounts/posts separately from legacy owner records and merge read-only by author ID; author profile, Feed and detail use the same record, so upgrades never reseed owner captions or comments.
- Local reply intents and prior-statement matching live in reply-context; use only history up to the source message, so future queued messages cannot leak into an earlier reply.
- Use functional persistence updates for async message and social interactions; parse failures must prevent writes rather than replace saved content with defaults.
- Call screens simulate state transitions without requesting microphone access or loading unapproved audio.
