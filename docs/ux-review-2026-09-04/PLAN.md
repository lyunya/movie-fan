# Movie Fan: a more personal movie life

UX, visual design, and functionality review · September 4, 2026

## The direction

Make Movie Fan feel like **your own little film club**: a place to decide what to watch, remember what you thought, arrange your favorites, and find the next film through people and stories you care about.

The ingredients are already here. The dark palette, pink identity, posters, movie detail headers, diary, custom lists, Tonight picker, guest voting, public collections, and annual recap form a substantial product. The next leap is to connect them and give the important actions more space.

The core loop should be:

**Discover → Save → Choose tonight → Watch → Log and rank → Share → Discover again.**

The homepage currently emphasizes a different loop: popular film → entertainment headlines → more headlines → search → several overlapping film rows. That explains much of the disconnect between what the product can do and what it initially feels like.

## What this review covers

Reviewed the current workspace using a running local Next.js site, real movie/news responses, desktop screenshots at 1280 × 633, and mobile screenshots at 390 × 844. Inspected homepage, search results, Arrival detail, person navigation, and public entry screens; examined the components, API procedures, and data model for the authenticated library, ratings, diary, lists, streaming settings, rooms, public profiles, and recap.

**Evidence distinctions:** “Observed” means rendered in the local browser or measured from that page. “Code” means the behavior follows from the current implementation but was not exercised with a signed-in account. “Proposal” is a design recommendation, not an existing capability or measured user preference.

The browser was not signed in. Account mutations, real multi-person voting, email delivery, production performance, and production deployment parity were not verified. No account records or emails were created. The existing unit suite passed: **29 tests across 7 files**. These tests do not establish that the user journeys work end to end.

The older root `IMPROVEMENT_PLAN.md` is useful history, but many of its proposed features now exist. This document is the new planning baseline; avoid rebuilding search, recommendations, genre pages, diaries, lists, alerts, or tests as though they were missing.

### Evidence gallery

- [Desktop homepage](movie-home-desktop.png)
- [Mobile homepage](movie-home-mobile.png)
- [Desktop search](movie-search-desktop.png)
- [Desktop movie detail](movie-detail-desktop.png)
- [Mobile movie detail](movie-detail-mobile.png)
- [Tonight entry screen](movie-tonight.png)
- [Sign-in screen](movie-signin.png)
- [Person page](movie-person.png)

Screenshots include local development controls. Those controls are not treated as production UI defects. Pixel measurements are snapshots of this viewport and changing feed content, not universal benchmarks.

## 1. Fix trust and task completion first

| Priority | Finding and evidence | User impact | Proposed change |
|---|---|---|---|
| P0 | Code: profile splits Watchlist/Seen using whether `userRating` exists; diary permits an unrated watch. Tonight also excludes rated rows rather than all watched movies. | An already-watched movie can remain “to watch” and appear in recommendations. | Separate saved status, watched status, movie rating, and viewing events. |
| P0 | Code: “Remove from watchlist” deletes the entire `WatchListItem`, including its movie-level rating. | A simple unsave can erase a rating. Diary entries remain, creating another disagreement. | Unsave must change membership only; give rating removal its own explicit action. |
| P1 | Observed: main home search at roughly y=1,729 desktop and y=2,089 mobile; navigation search is a small icon. | A core action is easy to overlook. | Put visible search in desktop navigation; make search directly accessible on mobile. |
| P1 | Observed: Arrival search displays oversized incidental people matches before the exact film. | The right answer is pushed below the first screen. | Lead with the best match, then Movies/People tabs; use compact secondary people results. |
| P1 | Observed: Arrival's “Where to watch” begins around y=7,109 desktop on an ~8,127px page. | Answering “Can I watch this?” requires excessive scrolling. | Move availability into the decision area; collapse long credits. |
| P1 | Code: movie detail uses US availability; streaming settings offer four regions. Alerts do not read region/provider preferences although settings say they do. | Different screens can give incompatible streaming guidance. | Use the same explicit region and service preferences throughout. |
| P1 | Observed: upcoming/no-vote titles display TMDB 0%; code mapper does not carry vote count. | Missing information looks like a negative verdict. | Show “Not rated yet” for zero votes; distinguish low-sample ratings. |
| P1 | Observed: similar headlines cover the same event; publisher and time are absent. | News feels repetitive and lacks context. | Show source/time and cluster related coverage. |
| P1 | Code: several query errors fall through to empty/no-match states; multiple mutations have no visible failure message. | A service failure looks like an empty library or unsuccessful user action. | Add distinct loading, empty, failure, stale, and retry states. |
| P1 | Code: room result reveal depends on this visitor finishing, not the whole group; vote ownership relies on client tokens returned publicly. | “Everyone finished” is not established, and ballots lack trustworthy ownership. | Add participant completion, room lifecycle, and server-issued guest credentials. |
| P2 | Code: lists store position but expose no reorder controls; diary has an update endpoint but no edit UI. | Ranking and maintaining a film history are incomplete. | Add accessible list ordering and diary editing. |

### Define the movie state contract

Use four independent concepts:

- **Watchlist:** I want to watch this. Saving is not liking.
- **Watched:** I have seen this, even if I cannot remember when or do not want to rate it.
- **Your rating:** My current opinion of the movie. It can be cleared without deleting history.
- **Diary entry:** One viewing, with its own date, optional rating, review, and context.

Reserve the heart for **Favorite**; use bookmark or plus/check for Watchlist. A favorite can be watched or unwatched, though the interface can encourage using it for films you love. Do not silently convert existing saved hearts into favorites.

On logging a viewing, offer a clear default to remove it from Watchlist, with an option to keep it for a rewatch. If a viewing rating updates the current movie rating, say so and offer a choice. Historical ratings must remain attached to their original viewing.

**Migration:** preserve every existing rating; mark rated films and films with diary entries as watched. Treat unrated saved rows as watchlist members. Preserve existing saved membership for rated rows conservatively until the user resolves it, rather than silently discarding it. Do not fabricate viewing dates for old ratings. Show “Watched · date unknown.” Add a migration preview, counts before/after, and reconciliation tests.

**Acceptance:** log a film without rating it; it appears in Watched, is excluded from Tonight by default, and survives unsaving. Clearing a rating preserves both watched status and diary entries. Deleting one rewatch does not delete the movie's other watches.

## 2. Make the navigation match people's intentions

**Desktop primary navigation:** Discover · Library · News · Movie Night, followed by visible Search and account avatar. Library contains Watchlist, Watched, Rankings, Lists, and Diary. Profile is identity and sharing; settings live behind the account menu.

**Mobile:** four persistent destinations—Discover, Library, Search, Movie Night—with News prominent within Discover and reachable from the main menu. Avoid six tiny bottom tabs. A movie's contextual actions must integrate with this bar or replace it while viewing the detail screen; never stack two fixed bars over content.

Keep the principal destinations visible before sign-in, with meaningful previews where possible. Currently desktop feature links depend on session, and narrow layouts hide even the Tonight text link. A visitor should understand the product before creating an account.

Use an active navigation state, descriptive page titles, predictable Back behavior, and preserved filters/scroll position. Keep old profile and search links functional through redirects or compatibility handling when routes change.

**Acceptance:** an unfamiliar visitor can find their library and group picker from any screen. At 320px, 390px, tablet width, and 200% zoom, navigation and detail actions remain readable and reachable.

## 3. Give the visual design an editorial point of view

### Recommended direction: After Hours Film Club

Retain Movie Fan's recognizable pink, but make it feel more deliberate:

- Warm near-black canvas (`#111013` as a starting swatch), raised charcoal surfaces, warm white text, and raspberry accent. Swatches are proposals and need contrast verification in actual combinations.
- Pink signifies the primary action or selection. Warm gold belongs to personal ratings. Neutral treatment belongs to external scores. Avoid making every chip, heading, tab, and button compete with a gradient.
- Keep Overpass for confident headings and establish one consistent reading face for metadata and news. The current layout loads Krona One but the body uses the generic sans stack; clarify the type system rather than accumulating fonts.
- Poster corners slightly tighter than cards; modest card borders; less reliance on glow. Let film artwork carry the atmosphere.
- A shared spacing scale and consistent page width. Long prose should have a comfortable reading measure; library grids can be denser.
- Alternate compositions: a compact editorial feature, a useful poster shelf, a news digest, an occasional friend note. Avoid a page made entirely of identical horizontal rows.
- Provide comfortable and compact library density. Titles get two lines in grids or a full-text list view; users should not have to guess a truncated title.

A secondary direction worth exploring later is **Sunday Matinee**: warm paper surfaces, dark ink, restrained raspberry, and the same poster-led layouts. Make theme choice a coherent system, not a second redesign to maintain immediately.

### Small moments of personality

Use ticket-stub styling for room invitations, a stamped check for logged viewings, and optional end-credit treatment in yearly recaps. Preserve reduced-motion support. The current five-star confetti is fun, but celebrating only maximum ratings may subtly encourage inflated scores; celebrate completing a log or list milestone instead.

Write like a knowledgeable friend: “Something strange under two hours,” “Your next rainy Sunday,” “A little outside your usual orbit.” Keep functional labels literal: Save, Watched, Rate, Edit, Undo.

## 4. Rebuild the homepage hierarchy

### Returning member

1. Compact greeting plus one useful action: **What are we watching tonight?**
2. **From your watchlist, available tonight:** a handful of eligible films, with service and runtime.
3. **Your next good watch:** recommendations with truthful explanations and a “Less like this” control.
4. **The latest on your films:** three relevant news stories, source/time, and links to the associated film.
5. **From your circle:** recent shared ratings/lists once social connections exist. Until then, show clearly labeled editorial selections.
6. Optional Trending, In theaters, and Coming soon sections with “See all.”

### First-time visitor

One compact cinematic feature, a plain promise—“Find your next favorite. Remember every movie night.”—and two choices: **Explore movies** and **Pick something tonight**. Follow with an example library/ranking and a sample group ballot, clearly labeled as examples.

Allow a guest Tonight result using mood/runtime/region. Request sign-in when saving or syncing preferences, and resume the original action after authentication. The current Tonight screen asks for sign-in before delivering a pick.

The sign-in screen already has strong cinematic personality through The Shining artwork. Keep that intentional visual identity, but consider a small curated rotation for broader moods. Change “Welcome back” to language that also welcomes first-time members, and replace “We only use your email to sign you in” with accurate wording that accounts for optional streaming alerts. Provide clear provider-error and email-link recovery states without losing the intended movie action.

Remove the duplicate Opening strip/full row, reduce overlapping popularity shelves, and stop filling unused column height with additional headlines. Give news a curated budget on home and its own destination.

**Acceptance:** search and the primary decision action are visible in the first mobile viewport. No title repeats across the first few discovery modules without a clear reason. A visitor can try one useful action before sign-in.

## 5. Make movie pages decision pages

The existing poster/title header is a good base. Reorder the page around the decision:

**Title, year, runtime, genres → Where to watch → Your actions → Synopsis/trailer → Friends' opinions → Related films → Expandable credits/details.**

- Put service names next to logos, with region visible and editable. Separate Included, Rent, and Buy. Use the provider destination actually supplied; do not imply a generic “More info” link starts playback.
- Show “Availability unavailable right now” separately from “No providers listed in this region.” Keep attribution.
- A compact personal panel: Watchlist toggle, Watched toggle, rating, Log watch. Put Lists, Share, and other secondary actions into a restrained overflow area.
- Surface a trailer button in the header; keep the existing click-to-load video behavior. A full-width trailer does not need to dominate the content order.
- Show key cast and selected crew first, with “Full cast & crew.” Make the director name a useful navigation link.
- Add “Your history with this film”: previous dates and reviews, with Edit and Rewatch.
- For social content, hide spoilers before rendering the body and show the poster/title independently of the spoiler toggle.

**Acceptance:** users find availability within the initial decision area on desktop and within roughly one additional screen on mobile. Logging, rating, and saving have unambiguous outcomes and retry/undo feedback.

**Person and genre discovery:** Amy Adams's page has a clear portrait and biography, but the biography occupies most of the initial desktop screen. Lead with a shorter introduction and accessible filmography controls: Acting/Directing where relevant, Watched/Unwatched, year, and available on my services. Add “Explore this filmography” and optional person-following for news. Genre destinations should gain the same runtime, decade, and availability filters used elsewhere, with a clear route back to the originating movie.

## 6. Turn the library into something worth collecting

Move profile statistics and streaming settings out of the way of the actual collection. Lead with **Your Library**, the collection count, local search, and tabs.

**Core controls:** Watchlist / Watched / Favorites; grid/list; title search; genre; decade; runtime; available on my services; sort by recently saved, recently watched, personal rating, title, or external score. Put less common filters in a sheet. Encode filters and sort in the URL.

**Useful shelves:** Available tonight, Saved ages ago, Under 100 minutes, Unrated watches, and Recently logged. These should be saved queries over one collection, not separate copies of movies.

**Bulk operations:** select several → add to list, mark watched, remove from Watchlist. Show a result count, progress, partial failures, and undo where feasible. Avoid destructive bulk actions mixed into normal card taps.

**Import/export:** keep CSV export, add import with preview, TMDB matching, duplicate detection, and unresolved-title review. Export viewing dates, reviews, and list membership through appropriate separate files rather than pretending the current watchlist CSV is a complete diary backup. Existing export leaves WatchedDate blank even though diary dates now exist.

**Acceptance:** a member with 500 films can find an unrated, watched thriller or a streaming watchlist film without scrolling through the whole library. Import can be canceled before saving and never silently overwrites existing opinions.

## 7. Make ranking a first-class feature

The current product offers whole-star ratings, list insertion order, and popularity numerals. It does not yet provide a complete personal ranking workflow.

### First release: ranked lists

Add a Ranked toggle to custom lists, numbered positions, drag handles, Move up/down, and Move to position. Support list renaming, description editing, cover selection, per-film notes, duplicates prevention, and share previews. Add films directly inside the list editor; the current first-list flow sends users away from the movie they wanted to save.

Start with a signature **My Top 10**, then “Best first watches this year,” “Comfort movies,” and “Best endings—spoilers inside.” Keep ranking separate from star ratings: two five-star movies can have different positions.

**Acceptance:** reorder on touch, pointer, and keyboard; reload preserves order; simultaneous edits do not produce duplicate or missing positions. A shared ranked list displays the owner's ranking clearly.

### Second release: a playful comparison mode

**“Which would you watch again?”** Place two of your similarly rated movies side by side. Choose left/right, tie, or skip. Use a short optional session to suggest ordering; show a provisional ranking and let the user edit it. Offer undo. Never force a comparison before saving a rating.

Keep the first algorithm modest: insert a film among a handful of comparable favorites and record the user's choices. Broader rating models can wait for enough usage to justify them. Explain uncertainty instead of presenting an exact “taste score” as objective truth.

Consider half-stars only after updating storage, validation, displays, exports, and accessibility together. Adding half-star graphics while keeping integer validation would create a broken feature.

## 8. Make news part of the movie experience

The three-source RSS base is a good foundation. Give it an editorial layer:

- Dedicated News destination with All, Your films, Releases, Trailers, Festivals/Awards, and Industry topics.
- Every story shows publisher, published time, and external-link treatment. Preserve the outlet's headline and link rather than republishing the article.
- Cluster multiple reports about one event. Show a lead story and “More coverage” instead of repeated adjacent headlines.
- Associate articles with films and people when confidence is high; allow corrections and avoid guessing from an ambiguous title alone.
- Add “Save movie” alongside a related film and “Read later” for an article. These are different actions.
- Let users follow a film/person/topic and mute topics. Offer spoiler-conscious headline/image treatment where metadata or editorial review supports it; do not promise automatic perfect spoiler detection.
- Preserve cached stories during feed failure with an honest last-updated state. Normalize publication dates before sorting; source date formats can differ.

**Acceptance:** one event does not dominate the digest; each story has source/time; following a film produces related coverage; an RSS failure does not masquerade as “no news.”

## 9. Build social around small groups

### First: finish Movie Night

Keep guest voting by link—it is one of the site's best ideas. Add a lobby, participant names, completion counts, a host-controlled close/reveal, and room states: Open, Voting, Results, Chosen, Expired.

Show runtime, a one-sentence synopsis, and availability on the ballot. Let guests skip, change a vote, and distinguish “Already seen” from “Not tonight.” Explain whether candidates reflect the host's services or everybody's preferences.

Results should identify unanimous matches, partial matches, ties, and incomplete ballots. If no consensus exists, offer a shorter runoff or wider filters. Let the host select a winner, then create a shareable movie-night card and a later “Log this watch” action.

**Trust work:** public room responses currently expose voter tokens, and the vote endpoint accepts a caller-provided token as identity. Replace this with a server-issued guest session, keep ballot credentials private, and enforce ownership server-side. Add bounded guest participation and room controls. This is a code finding, not a penetration test.

**Acceptance:** test a host and two independent guests, resume after refresh, revise a vote, close a room, handle a tie/no-match, and verify one guest cannot alter another guest's ballot.

### Next: a small social circle

Public profiles need a handle, short bio, favorite films, pinned lists, and selective activity sharing. Add following or mutual friends, with chronological activity first: “Maya logged…” and “Sam added…” User names here are illustrative examples.

Start with reactions and list saves. Add comments only with block/mute/report, deletion, spoiler controls, notification preferences, and visibility enforcement in place. Keep diary entries private by default and let the user share individual reviews intentionally.

Avoid relying on a busy global feed at launch. Movie-night groups, direct profile links, and shared lists work even when someone has only two friends on the site.

## 10. Give the diary and recap an emotional payoff

- Put **Log a movie** on the diary itself, with movie search in the same flow.
- Add Edit. Preserve draft text if a request fails; warn before discarding a meaningful draft.
- Offer calendar/timeline views and filters for rewatches, theater, company, and tags.
- Rewatch should be based on earlier viewing history, not merely “this movie appears more than once in the selected year,” which currently marks every matching entry as a rewatch and misses prior-year history.
- Use available history to populate the year picker; the current diary selector only offers eight years.
- Keep movie-level ratings distinct from ratings attached to historical viewings.
- Expand the recap into a **Year in Frames**: first/last watch, favorite first watch, most revisited movie, discoveries outside usual genres, and a poster collage the user chooses to share.
- Existing recap sharing is text. Add an image preview/export with explicit content selection before sharing; do not automatically expose private reviews.

## 11. Make recommendations earn their labels

Tonight's three slots currently come from a short candidate list sorted by external score; “Wildcard” is an index label, not a distinct exploration strategy.

Define real roles: **Best fit** honors constraints and taste, **Familiar territory** follows a known preference, **Wild card** expands taste while retaining runtime/availability constraints. Display a concise factual reason for each. If only two results qualify, present two rather than pretending a third exists.

Put current services and region in the picker, with quick editing. Move the minimum external score to advanced filters. Replace repeated page-cycling with a session-level exclusion set so “three more” does not quickly repeat dismissed films. Add “Already seen,” “Not interested,” and “Try a different mood.”

Weight explicit likes/high ratings separately from saves and low ratings. The current For You genre counts include every saved/rated row; disliking many horror movies can still make horror look like a preference.

**Acceptance:** explanations match the actual candidate logic; unrated watches are excluded; no repeats within a short session; hard constraints are never silently relaxed. On failure, retain filters and offer retry.

## 12. Accessibility and reliability are part of the design

- Add a skip link and coherent headings: the brand currently supplies an h1 alongside page h1s.
- Make card links and save buttons sibling controls, not a button nested in a link.
- Use one shared dialog behavior for diary, list picker, search, and lightbox: initial focus, trapped focus, Escape, focus restoration, and background scroll management.
- Rating controls need an announced current value, selected state, clear-rating action, focus cleanup, and comfortably sized targets. Avoid hover/focus previews that remain after leaving the control.
- Prefer a static homepage feature. If rotation remains, expose pause and stop on keyboard focus; hidden slides must not remain keyboard targets. This follows the [W3C carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
- Audit actual text/surface contrast, especially zinc-500/600 small metadata. Support zoom, reduced motion, touch, and visible keyboard focus across shared controls.
- Replace blank session-loading areas with stable skeletons. Distinguish “empty collection” from failed fetches. Announce save results and give useful recovery text.
- Review navigation search focus: desktop/mobile inputs share one ref. In one desktop interaction the expanded input did not persist; reproduce with keyboard and click before selecting a fix.
- Fix home URL synchronization for an empty `q`: the current effect updates local query only for nonempty values, creating a stale-results risk when returning to bare `/` through client navigation.
- Make detail failures distinguish not-found from upstream outage; catch-all-to-404 currently hides the difference.
- Alerts need per-region/provider availability, unknown-vs-unavailable handling, delivery retry/idempotency, and separate notification state. Current code can mark a failed fetch unavailable and saves availability before sending mail. Review these paths without sending real test messages.
- Paginate large libraries, diaries, and lists; request light list summaries for pickers rather than every list with every movie. Add production performance measurement before assigning speed improvements.

TMDB supports country-specific provider filtering; unify the implementation around the selected region rather than assuming US. [TMDB provider reference](https://developer.themoviedb.org/reference/watch-providers-movie-list).

## 13. Creative bets worth prototyping

| Idea | Experience | Dependency / sensible limit |
|---|---|---|
| Double Feature | Pair two films with a reason: shared theme, contrasting director, or a perfect tonal whiplash. | Start with editorial pairings and known metadata; never invent a connection. |
| The Unwatched Shelf | A friendly invitation to finally watch something saved months ago. | Needs saved timestamps; acknowledge unknown dates for legacy saves. No guilt or punitive streaks. |
| Taste Passport | Explore a country, decade, or director through a handful of films and a personal stamp collection. | Curated paths; voluntary progress; reliable film metadata. |
| Friendly Disagreements | “You loved this; your friend didn't. Here's what you both thought.” | Explicitly shared reviews and enough overlap; avoid outrage ranking. |
| The Opening Credits | A weekly digest of your own new streaming options, friend picks, and relevant headlines. | Reliable region matching, preferences, delivery controls; in-app first. |
| Movie Night Ticket | A shareable invitation with chosen movie, date/time, host, and “I'm in.” | Extend rooms after winner selection works; no automatic invites. |
| Shelf Covers | A tasteful poster collage for a list, ranking, or yearly recap. | Reuse licensed/allowed artwork sources and provide preview before export. |

Prototype **ranked Top 10 + Movie Night Ticket** first. They give Movie Fan personality while strengthening features it already has.

## 14. Implementation roadmap

Effort below is a planning range in focused engineering/design days for one experienced builder with existing infrastructure. It excludes external-service approvals and is not a delivery commitment. Validate scope after state decisions and prototypes; parallel work is not assumed.

| Phase | Deliverable | Effort | Dependency | Exit criterion |
|---|---|---:|---|---|
| 0 | State contract, migration design, representative test data, analytics baseline | 2–4 days | None | Saved/watched/rating/diary outcomes agreed and tested in fixtures |
| 1A | Visible navigation/search, movie-first search, compact credits, availability moved up, honest score labels | 4–7 days | Minimal | Search and watch-provider tasks succeed on desktop/mobile |
| 1B | Safe movie-state migration, error/retry/undo system, region consistency, rating controls | 6–10 days | Phase 0 | Unsave preserves ratings; unrated watches are recognized everywhere |
| 2 | Library redesign, list editing/ranking, diary editing and in-context creation | 7–12 days | 1B | Returning user can organize, log, and rank without losing context |
| 3 | Homepage editorial redesign, news destination, guest Tonight and truthful pick roles | 7–12 days | 1A/1B | First-time visitor reaches a useful result; personal home reflects real state |
| 4 | Room identity/lifecycle, lobby, completion, winner, movie-night card | 6–10 days | 1B | Three-person flow passes with explicit result states |
| 5 | Public identity, selective activity, small-circle social, recap images | 10–18 days | Privacy model and Phase 4 | Shared content honors visibility and controls; small-group retention tested |
| Optional | Import, comparison ranking, passport, double features | Size separately | Relevant foundations | Prototype evidence supports further work |

**Recommended first release:** combine 1A with the essential state-safety portion of 1B. It will look clearer and prevent a meaningful loss of user intent. Do not delay these improvements for a broad social-network launch.

### Implementation map

- Homepage/navigation/search: `src/app/HomeClient.tsx`, `src/components/Nav/*`, `src/components/Search/*`, `src/components/Hero/Hero.tsx`.
- Visual system/cards: `src/styles/globals.css`, `tailwind.config.cjs`, `src/app/layout.tsx`, `src/components/MovieCard/*`.
- Library/state/ratings: `src/app/profile/page.tsx`, `src/hooks/useWatchlist.ts`, `src/components/StarRating/*`, `src/server/api/routers/watchListItem.ts`, `prisma/schema.prisma`.
- Movie decision area/providers: `src/components/MovieDetails/MovieDetails.tsx`, `src/server/tmdb.ts`, streaming preferences and availability cron.
- Diary/recap: `src/app/diary/*`, `src/app/year/*`, `src/components/DiaryLog/*`, diary router.
- Lists/rankings: `src/app/lists/*`, `src/components/ListPicker/*`, lists router, list position model.
- News: `src/server/news.ts`, `src/components/News/*`, `src/types/main.d.ts`; add a dedicated route and source/topic metadata.
- Rooms/social: `src/app/rooms/*`, `src/app/room/*`, rooms router, public profile code and visibility rules.

## 15. How to decide whether the redesign worked

Run task-based sessions with five to eight people spanning casual viewers, collectors, and people who organize group movie nights. This is qualitative discovery, not statistical proof. Capture completion, hesitation, wrong turns, and expectations before explaining the interface.

Tasks: find Arrival; find where to watch it; save a film; record a watch without rating; unsave without losing a rating; reorder a Top 10; correct a diary entry; find relevant news; join a room from a friend's link; return tomorrow and find the chosen movie.

Suggested product measures:

- First useful action: completed save, viewing log, or Tonight shortlist selection per new visitor.
- Time from landing to selecting a movie/provider, compared with the baseline.
- Save → watch conversion over 30 days, with explicit watched state.
- Completed diary logs and ranked-list edits among returning members.
- Room invite visit → completed ballot → chosen movie, with incomplete groups visible.
- Weekly returning users who perform a meaningful action, not just refresh a feed.
- Failure/rollback rate for saves and logs; search zero-result and retry rates.

Set numeric improvement targets only after baseline data exists. Provider-link clicks indicate intent to watch, not proof of playback. Keep event payloads minimal; do not capture review text, email addresses, or raw private search terms as general analytics.

**Release checks:** keyboard-only task completion; phone and tablet layouts; 200% zoom; slow/offline requests; expired sessions; unknown/no-vote scores; partial source outages; large collections; migration counts; concurrent reorder; private/public visibility; three separate room identities. Use test accounts and stubbed mail for write flows.

The first milestone is simple to recognize: someone can find a movie, decide whether they can watch it, save or log it without ambiguity, and return to a library that accurately remembers them. Build the more playful film-club experiences on that foundation.
