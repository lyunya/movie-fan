# Movie Fan implementation — After Hours Film Club

Implements the core experience described in [the UX plan](../ux-review-2026-09-04/PLAN.md). Published to the existing Netlify site on September 5, 2026: https://movie-fan-978.netlify.app. Three additive migrations were applied after a private database backup; original record counts were preserved. Feature write tests use isolated local PostgreSQL and dummy members.

[Release checklist and migration notes](RELEASE.md).

## Implemented

- Independent Watchlist, Watched, Favorite, current rating, and viewing history. Removing a save preserves opinions and diary entries; unrated logs count as watched. Clear rating is explicit. Existing unknown save/watch dates stay unknown.
- Movie posters keep their aspect ratio on tablet and desktop; failed card artwork falls back to a placeholder.
- Warm dark visual system, simpler typography, poster cards with separate controls, visible search, four primary destinations, mobile navigation, skip link, focus styles, reduced motion, and shared native dialogs for search, lists, diary, and photos.
- A compact homepage with useful actions in the first phone viewport, a streaming watchlist shelf, taste-based discovery, deduplicated discovery rows, a restrained spotlight, and three news headlines.
- Availability in the movie decision area, editable region, service names and categories, unknown-versus-unavailable handling, compact cast/crew, history, independent library controls, and save undo.
- Library tabs, URL-backed search/filter/sort/view, genre/decade/runtime/unrated/streaming filters, 48-film display pages, bulk watch/save/unsave/list actions, CSV export, and separate profile settings.
- CSV import with file validation, preview, title/year or TMDB matching, manual match selection, duplicate detection, and resumable append-only saves. Dated entries are private; existing opinions are preserved. Supports up to 500 films, whole-star ratings, and one viewing per new film.
- Short side-by-side ranking sessions for the first ten list positions, with tie/skip, undo, review, and version-protected apply. Star ratings stay unchanged.
- Ranked list creation and editing, in-context movie search, atomic first-list creation with its movie, drag and keyboard ordering, stale-edit protection, notes, selected cover, and public list views.
- In-context diary logging and editing, private-by-default reviews, spoiler controls, timeline/calendar, historical years, rewatch detection across years, preserved failed drafts, and JSON diary export.
- Guest Tonight picker, persistent dismissals, no repeats within a sequence, runtime/region/service constraints, and distinct taste/familiar/exploratory selection rules. Unreleased titles are excluded from Tonight.
- Dedicated News with publisher/date, event clustering, topic follows/mutes, film/person follows, relevant-headline filtering, read-later bookmarks, and explicit partial feed failure messages.
- Public handles/bios, public profiles, following, chronological circle activity, mute/block, selective review sharing, and spoiler reveal. Blocked relationships are excluded from feeds and authenticated shared-profile/list access.
- Year in Frames with first/last watch and repeat favorites; selectable recap-image contents, preview, PNG download, and text sharing.
- Person filmography controls and genre runtime/decade/streaming discovery filters.
- Narrowed Auth.js session response, delivery leases and retry records for streaming alerts, provider-specific availability checks, bounded external requests, and visible error recovery.

Voting rooms were removed on September 7, 2026. Legacy database tables remain for data preservation.

## Verification (September 5 release)

- TypeScript and lint pass.
- 58 tests pass, including eight integration cases on real local PostgreSQL and six mail/cron cases with mail fully mocked.
- Migration audit recreates the legacy schema in a dedicated scratch database and verifies retained ratings, unrated watches, orphan diary recovery, private reviews, unknown dates, and list positions. Run `node scripts/verify-migration.mjs` with the local test container running.
- Browser checks: movie-to-list creation and additions; unsave retaining watched/rating; unrated diary logging and reopening; selectable recap-image preview; guest Tonight results.
- Browser ranking check: manual ordering persisted after reload; the new comparison session successfully undid a choice, then applied Arrival above Interstellar and retained it after reload. Guest Tonight returned three results without authentication.
- Phone home at 320px has no horizontal overflow. Phone home at 390px has search at y=356 and no horizontal overflow. Movie availability begins at y=779, compared with the old deeply buried section.
- CI now provisions isolated PostgreSQL, applies migrations, and runs integration tests in addition to existing checks.
- Tablet movie view at 768px has no horizontal overflow and retains navigation. Keyboard search opens with /, retains focus in the dialog, and closes with Escape.
- Optimized production build passes for all routes. Core screenshot checks use the production server; the comparison screenshot records the development verification.
- Phone import preview has no horizontal overflow at 390px; closing it leaves the proposed new film unsaved.
- Import browser check: preview made no writes, blocked an unresolved title, skipped an existing film and a repeated row, and imported The Grand Budapest Hotel with four stars. Arrival retained its existing five stars. Integration checks verify concurrent retries create only one private diary entry.

## Deliberate follow-on work

The plan contains later experiments and product validation beyond this core implementation. Taste Passport, editorial double features, reactions/comments, saved copies of other members’ lists, poster-collage exports, and pinned lists are not implemented here. News following currently matches headline phrases; it does not claim verified entity resolution or perfect spoiler detection. News uses the framework’s feed cache and displays current source failures; a separate durable stale-news archive is not implemented.

Library/diary/list views limit rendering but some collection queries still fetch a member’s complete data. Measure larger real collections before a further server-pagination pass. Streaming library checks run in pages of 50 with five concurrent source calls and report incomplete checks. Home checks the first 50 library records for its small streaming shelf.

SMTP cannot guarantee exactly-once delivery if the process dies after the server accepts mail but before the database records success. Leases prevent concurrent duplicate sends of the same digest; deterministic message IDs and failed-delivery records improve retry handling. Long-running alert workloads should move to resumable background jobs before scaling.

Real OAuth/email delivery, production performance baselines, and task sessions with real users remain validation work. Production schema migration and publication are complete; no real messages were sent.

## Screenshots

- [Phone home](screenshots/home-phone.png)
- [Desktop home](screenshots/home-desktop.png)
- [Desktop library](screenshots/library-desktop.png)
- [Tablet movie](screenshots/movie-tablet.png)
- [Recap preview](screenshots/recap-preview.png)
- [Comparison session](screenshots/comparison-desktop.png)
- [Phone import preview](screenshots/import-phone.png)

## Netlify release

- Deployment: 6a9cb6ca3d83b540feb33a57
- Live homepage, navigation, scripts, styles, images, session endpoint, and key public routes checked after publication. Guest Tonight returned three films after retrying an initial failed request. Real-account sign-in and write flows were not exercised on production.
- Initial publication omitted browser assets; corrected by explicitly deploying `.netlify/static` with `.netlify/functions`. The incomplete deployment was deleted.
- [Live homepage screenshot](screenshots/live-netlify.png)
