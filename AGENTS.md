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
- Preserve original local records; use session-local visitor overlays and role-checked shared saves with revision checks. Bootstrap an empty manifest only from a signed-in owner's existing chat/post/photo records, snapshotting first; never overwrite a manifest with another device's defaults.
- Centralize story dates and message sorting in browser-safe data utilities so all app views use the same chronology.
- Use one Phone-owned system language for every app; legacy chats gain translations only by exact original-text match, preserving explicit edits.
- X uses optional per-language text through x-language; built-in translations apply only to unchanged seed IDs/text, and language switching never persists or rewrites originals. Default Weather naming is display-only, preserving customized app names.
- Extend existing versioned local-store records with optional fields; snapshot phone storage once before changes and never reseed or reset saved data.
- Keep ordered post images, tweet replies, calendar events and music collections in browser-safe dedicated utilities; captions/comments and unrelated records remain isolated during edits.
- Reference music additions use an optional one-time marker on the existing library and stable IDs; append only missing tracks so edited or deleted additions never reseed.
- Simulated Anton messages live in phone/live.ts: append-only with fixed ids and one timer in Phone, so saved chats are never rewritten and each message arrives once.
- Fixed lock-only notices live separately from chat records; displaying or dismissing them never writes story storage.
- Edit UI requires the authenticated phone owner role plus the local editing unlock flag; server-side RLS and role validation exclusively authorize shared writes. Player interactions remain isolated from authored shared saves.
- Shared media stays private and manifest-referenced; preserve local IndexedDB originals, deduplicate uploads, bound concurrency/waiting, and read back the saved revision before reporting success to prevent stalled or unverified sharing.
- Recovery bundles must whitelist fictional phone keys and exclude authentication sessions and owner flags; never export arbitrary browser storage.
- Phone owns the single foreground scheduler; Anton KKT excludes queued AI jobs and uses fixed-conversation for full saved-thread display, ID-only gate progress and anchored player replies. Anton's AI answers are generated on send from the visible thread via temporaryIncoming. Player text and AI answers live in fixed-conversation's module-memory temporary store: they survive in-app exit/re-entry, clear only on page refresh or close, and never enter storage. Gates never hide saved records and player sends never deliver story messages, so persistence and temporary interaction stay independent. Other channels retain source-linked AI jobs and cross-tab locks, keeping their behavior isolated.
- Keep AI prompts/keys server-side. Anton context follows visible order through the source; show failures without fallback/story writes. Other channels stay source-bounded; images supply presence only.
- Visible lock/status clocks use a mount-initialized ticking device clock, separate from immutable story chronology and saved message dates.
- Phone dialer favorites and simulated recent calls use separate versioned browser records; reuse existing contact identities and simulated Call view without microphone/audio access. Native Phone/SMS presets append once through native-presets with a marker and stable IDs, skipping existing conversations; Call reports a once-only optional completion result before Phone/Messages persist it, keeping KKT calls isolated.
- Instagram Stories/DMs keep separate keys; feed/profile share post IDs. Caption language uses explicit versions or exact seed matches, never rewriting originals.
- Resolve Instagram DM identities from the same social-account IDs supplied to Feed and profiles, never KKT contacts, so profile edits update every Instagram avatar without rewriting conversations.
- Store added fictional Instagram accounts/posts separately from legacy owner records and merge read-only by author ID; author profile, Feed and detail use the same record, so upgrades never reseed owner captions or comments.
- Local reply intents and prior-statement matching live in reply-context; use only history up to the source message, so future queued messages cannot leak into an earlier reply.
- Use functional persistence updates for async message and social interactions; parse failures must prevent writes rather than replace saved content with defaults.
- Call screens simulate state transitions without requesting microphone access or loading unapproved audio.
- Keep Settings as a stable-ID app view with Phone-owned language and notification handlers; presentation changes must never reset saved home-screen customization.
- Keep simulated device network preferences in a separate versioned system record shared by Settings and the status bar; they never affect actual browser networking.
- Messages and Safari are independent stable-ID app views with separate versioned browser records; opening Messages never reuses or rewrites Kakao history. Notes folders are optional metadata on existing notes, so uncategorized legacy edits remain accessible.
- Device contacts merge legacy KKT contacts with separate override records; Phone and Messages share them while preserving KKT profiles. Notes keep their original fields plus optional per-language versions, using built-in translations only for unchanged seed notes. Camera captures only after explicit browser permission, stops streams when hidden/unmounted, and appends photos to a Camera Roll album without replacing albums.
- Weather fetches public forecasts only after mount and stores only the chosen city in its own versioned record; never fabricate readings or request geolocation automatically. New home icons are added once without reseeding customized or deleted entries.
