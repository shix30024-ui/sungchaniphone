# Phone story completion
# Shared authored phone content
- [ ] Allow everyone to read owner-saved fictional phone content while preserving existing local edits and isolating player interactions.
- [ ] Secure shared writes to the owner's authenticated account; verify owner save and independent visitor readback.
# Preview-to-phone transfer guidance
- [x] Explain existing export/import steps and ways to send the JSON file to the phone; latest request is transfer only, with no app or storage changes.
- [ ] Actual transfer awaits the user downloading their preview data, sending the file to their phone, and importing it on the public link.
# X and Weather language correction
- [x] Localize X preset posts and author display with exact-match translations; posts/replies have independent editable language versions. Unknown edited originals remain verbatim without invented translations.
- [x] Default Weather name follows system language on home/search/dock while custom names and raw editor records stay intact. All 68 tests passed; isolated browser verified three languages, Chinese post edit/save/reload and byte-identical tweets during language switching, app-name editor save preservation, screenshot inspected, latest build OK and no runtime errors.
# Phone and Messages completion
- [x] Add five fixed fictional calls and three independent multilingual SMS conversations once, skipping existing conversations and preserving edits/deletions; persist actual simulated outcomes only on completion and retain saved player SMS.
- [x] Complete call newest-first filtering/details/avatar/search/duration and Messages full-history search, preview/unread/contact selection/details/editing/navigation; no KKT data migration or real telephone/SMS delivery.
- [x] All 64 tests passed; final isolated browser verified All/Missed, contact history, call edit and connected duration/once-only save, preset SMS/edit/send/new contact, preview ordering and reload retention. KKT byte-identical; 375×667 screenshot inspected, language/preservation tests passed, latest build OK, no runtime errors; user preview storage untouched.
# Anton permanent-message repair
- [x] Show every saved Anton fixed message independently of reply gates, preserve list access and existing records, and keep player sends temporary without creating story messages. Existing gate waiting still protects the foreground live scheduler.
- [x] All 57 tests passed; isolated browser verified full authored content/order/times, temporary send, return/reentry/reload and closing/reopening a browser with retained storage. Fixed messages unchanged byte-for-byte, no player text stored, other contact/Notes retained, language regression passed, no runtime errors and latest build OK. User preview storage untouched.
# Private-message identity and native reference correction
- [x] Match IG private-message avatars and names to the editable feed/profile account IDs; preserve independent messages, add functional search and message editing.
- [x] Align Phone and Messages to previously captured unlocked reference screens: Phone edit/filter/title/list/five tabs/keypad; Messages edit/filter/list/bottom search and centered contact chat. Retain contact, call and message editing; reference character data is not copied.
- [x] 55 tests passed; isolated browser verified shared avatar, DM editing, contact/call saves and reload, SMS send/readback/cancel, three languages and 375×667 keypad. Latest build OK, no runtime errors; user preview storage untouched. Fresh reference browsing was unavailable, so comparison used existing reference screenshots.
# Sungsho reference and Weather
- [x] Inspect unlocked reference Phone, Messages and Music; align call rows, bottom Messages search/composer and Music Songs/Library category views without copying reference records or disabled playback features.
- [x] Add Weather with official icon, live Open-Meteo readings, search/refresh/error states and city-only preferences; retain other icons and language.
- [x] 54 tests passed; real Weather forecast/city search/reopen verified, 375×667 no overflow; Music Songs/Library/edit cancel, saved Messages search/send and Phone dial/hangup/Recents verified in isolated browser. No runtime errors; saved user preview data untouched.
# Fixed Anton interaction and reference songs
- [x] Preserve Anton records/progress; separate session-only player replies and optional author-set reply gates; block Anton KKT AI jobs without deleting old jobs or lines. Tone screenshots retained as future-authoring guidance, not used to rewrite saved lines.
- [x] Add the twelve screenshot tracks once without overwriting existing music or supplying unlicensed audio.
- [x] All 51 tests passed; isolated browser verified fixed order/gate/send/display, no stored player text, exit/reopen/reload, preserved author records, twelve added tracks and saved song. No browser errors; user preview storage untouched.
# Widgets, camera, contacts and Notes language
- [x] Add tappable current-date calendar and photo widgets without replacing saved icons; no invented weather data.
- [x] Add permission-based camera, capture/review/retake/save to Photos and mobile capture fallback; stop streams on exit or hidden page.
- [x] Extend Phone editable recent call types and contact details; Messages shares contact selection and recent-call entry without replacing its own history.
- [x] Add editable three-language Notes content; translate unchanged seed notes only and preserve all edited originals.
- [x] Verify camera capture/save/readback with Chromium test camera, stream stop, widgets, contact creation/shared SMS, missed records, Chinese Notes after reload and 375×667 layout. 43 tests passed; actual player camera permission/hardware remains device-dependent. No user preview storage reset.
# Notes, browser, Messages and KKT adjustment
- [x] Compare reference KKT and Notes/browser inner screens; align KKT list, five tabs, date pills, avatars, bubbles and composer while keeping this phone's story.
- [x] Add editable Safari favorites/page content/history and independent native Messages; keep legacy KKT records isolated and Notes on their existing key. External websites open separately, not as editable third-party pages.
- [x] Remove TikTok once while preserving other icon customizations; regression tests passed.
- [x] Verify note save/cancel/folders/confirmed deletion, SMS creation/sending, Safari page editing, KKT edit cancellation and reload at 375×667; 38 tests passed, latest build OK, no browser errors. User preview storage was not accessed or reset.
# Context-understanding replies
- [x] Adjust Phone dialer/contacts/recents/favorites, Calendar month/today/search, Music library/tabs and grouped Settings using familiar native hierarchy without copying story. Settings directly compared; remaining reference inner screens were not reliably accessible.
- [x] Make lock/status clocks follow the player's local device time while preserving saved story dates; browser checks passed.
- [x] Replace primary keyword replies with genuine AI reading source-bound recent history and story context.
- [x] Preserve queued jobs, all manual edits and original text; expose failures without fabricated replies.
- [x] Verify real AI fatigue response and direct follow-up recalling noodles/staying home; image-presence context excludes raw images, source/future isolation tested. Dialer simulation, Calendar/Music saves and reload verified.

# Wonbin reference adjustment
- [x] Inspect reference app navigation and settings.
- [x] Inspect unlocked reference home, Settings and Instagram using the user-provided reference passcode; keep this phone's passcode unchanged. Reference Music could not be opened.
- [x] Adjust grouped Settings, simulated network toggles, General, home app search, KKT Friends/Chats navigation, swipe unlock and bottom Home control without changing saved content or app order.
- [x] Verify language, navigation and preservation at desktop/mobile sizes; 29 tests and browser checks passed in isolated storage, user preview data not accessed or reset.

- [x] Connect Kakao, Instagram, X, Photos and Notes to existing icons.
- [x] Complete app styles, navigation, fixed story date and functional chat composer.
- [x] Verify all five apps save and read back edits after refresh, chat cancellation and translation, desktop/mobile rendering, and eight rule/routing tests.

# Uploaded completion requirements
- [x] Protect existing saved data and preserve layouts/content; one-time browser snapshot and legacy-content preservation verified.
- [x] Unify system language and three-language KKT messages/editing; exact-match English completion preserves explicit saved edits.
- [x] Complete Instagram ordered multi-image posts, captions and comment management.
- [x] Complete X details/replies, Photos rename/move and Notes search/modification time.
- [x] Add Calendar and Music management inside the existing phone, with empty collections rather than invented existing events/audio.
- [x] Verify save/cancel/delete, language changes and reload persistence; thirteen tests and desktop/mobile browser flows passed.

# Interaction and official app experience upgrade
- [x] Protect existing records and improve shared status bar/safe areas.
- [x] KKT original-text sending, contextual preset replies and real pending typing state.
- [x] Natural foreground proactive messages and correct unread notifications.
- [x] Simulated outgoing/incoming calls with mute, duration and hangup.
- [x] Instagram feed from existing posts, editable Stories, post interactions and comment sending.
- [x] Independent Instagram DMs with contextual replies and typing.
- [x] Test app navigation, cancellation, saved-content preservation and reload persistence in isolated browsers; user preview storage was not accessed or reset. 21 rule tests passed.

# Reference styling and focused repairs
- [x] Match KKT chat hierarchy to p2 and grouped lock notifications to p1 without replacing wallpaper or messages.
- [x] Repair contextual local replies, short answers, laughter and known commitments; local fallback only, no AI service connected.
- [x] Add separate fictional authors to Instagram Feed with correct profiles, shared detail/editing and independent Stories authors; new friend posts are fictional sample additions.
- [x] Test reference layouts at 614×710 and 375×667, notification unlock navigation, tired/ack replies, search, cancellation, author comments and unchanged owner records on reload; 27 tests passed. User preview data was not accessed or reset.- [x] KKT 真实感升级：Anton 根据玩家发送内容 AI 回应（仅临时显示、含输入中动画），固定剧情与临时回复完全分离，实测返回/刷新后固定消息完整、临时回复消失
