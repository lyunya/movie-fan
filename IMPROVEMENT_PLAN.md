# Site Improvement Plan

A prioritized, implementation-ready plan for the next round of improvements.
Each item says **what** to build, **why** it matters, and **how** to do it
(files, endpoints, acceptance criteria) so it can be implemented one item at a
time. Items are independent unless noted — implement in order within a phase,
but phases 2/3 items can be cherry-picked.

Current state (for context): TMDB powers all movie/person data
(`src/server/tmdb.ts`), watchlist + ratings live in Postgres via
tRPC/Prisma, home page has hero/news/search/carousels, movie pages have
trailer/photos/cast/providers, person pages have bio + filmography, profile
has tabs/sort/genre filter + a stats dashboard.

---

## Phase 1 — High impact, low effort

### 1.1 Search from every page (biggest UX gap)

**Why:** The search box only exists on the home page. From a movie, person, or
profile page there is no way to search without first navigating home. This is
the single most common dead end on the site.

**How:**
- Add a search affordance to `src/components/Nav/Nav.tsx`: a magnifier icon
  button (visible on all pages) that expands into a compact input on desktop
  and a full-width overlay input on mobile.
- Submitting navigates to `/?q=<query>` with `router.push`. Home already
  supports `?q=` deep links.
- In `src/app/HomeClient.tsx`, replace the one-shot `useEffect` that reads
  `window.location.search` on mount with `useSearchParams()` so the query
  updates reactively when already on `/` (and so back/forward work — see 2.2).
  Note: `useSearchParams` requires a `<Suspense>` boundary in `src/app/page.tsx`.
- Keep the `/` keyboard shortcut working: when pressed on a non-home page,
  open the Nav search input instead of doing nothing (move the keydown
  listener from `Search.tsx` into the Nav, or register a second one there).

**Accept:** From `/movie/123` I can search and land on home results without
extra clicks; `/` focuses a search input on any page; the big home search box
still works as today.

### 1.2 "More like this" on movie pages

**Why:** Movie pages are a dead end — after watching the trailer there's
nothing to click except cast. Recommendations are the cheapest engagement win
and TMDB ships them in the same request we already make.

**How:**
- In `fetchMovieDetails` (`src/server/tmdb.ts`), add `recommendations` to the
  existing `append_to_response` list. Map `data.recommendations.results`
  (first ~12, filter items without `poster_path`) through the existing
  `mapSummary` shape and return as `similar: MovieCardData[]` on
  `IMovieDetail` (update `src/components/MovieDetails/types.d.ts`).
- In `MovieDetails.tsx`, render a horizontal `Carousel` of `MovieCard`s titled
  "More like this" after the Where-to-watch section. Reuse the `MovieRow`
  pattern from `HomeClient.tsx` (consider extracting `MovieRow` into
  `src/components/MovieRow/MovieRow.tsx` so both pages share it).

**Accept:** Movie pages show a scrollable row of related movies with working
watchlist hearts; pages with no recommendations render nothing extra.

### 1.3 Clickable genres → genre browse pages

**Why:** Genre chips on movie pages and profile filters suggest browsing by
genre, but nothing on the site actually offers it.

**How:**
- New route `src/app/genre/[id]/page.tsx` (ISR, `revalidate = 21600`). Slug
  form: `/genre/878-science-fiction` (id + name, parse the leading int).
- New fetcher in `src/server/tmdb.ts`:
  `fetchGenre(genreId, page)` → GET `/discover/movie` with
  `with_genres=<id>&sort_by=popularity.desc&include_adult=false&language=en-US&region=US&page=<n>`,
  mapped with `mapSummary`. Also `fetchGenreList()` → GET `/genre/movie/list`
  (cache 24h) to resolve the display name server-side.
- Page 1 renders server-side into the existing `MovieGrid`. "Load more" loads
  further pages client-side via a new `tmdb.discoverByGenre` public tRPC
  procedure (input: `{ genreId: number, page: number }`) using
  `useInfiniteQuery` or a simple page counter + append.
- Make genre chips links: in `MovieDetails.tsx` wrap each genre chip in a
  `Link` to its genre page. TMDB detail responses include genre `id`s — carry
  them through (`genres: { id, name }[]` in the mapper; the watchlist DB
  schema keeps storing names only, no migration needed).

**Accept:** Clicking "Science Fiction" on a movie page opens a browsable,
paginated grid of sci-fi movies; direct URL loads work (SSR page 1); movie
cards there have working hearts.

### 1.4 Route people by TMDB id, not name

**Why:** `/person/[name]` re-searches TMDB by name and takes the first hit —
wrong person for ambiguous names, an extra API call, and breaks for people
with slashes/diacritics. Credits already contain the person's TMDB id
(`mapCredit` stores `person.id`).

**How:**
- New route `src/app/person/[id]/page.tsx` accepting `/person/287-brad-pitt`
  (parse leading int; name suffix is cosmetic). Refactor `fetchPerson` to
  `fetchPersonById(id)` (skip the `/search/person` step; keep a thin
  `fetchPersonByName` wrapper for the legacy route).
- Keep the old `[name]` route as a fallback: if the segment doesn't start
  with digits, resolve by name as today (or `redirect()` to the id URL after
  resolving). Simplest structure: one `[slug]` route that branches on
  whether the slug starts with an id.
- Update `CastCard.tsx` to link with the id: pass `id` through (it's already
  on the `Credit` type) and build `/person/${id}-${slugify(name)}`.

**Accept:** Cast clicks always open the correct person; legacy
`/person/Tom%20Hanks` URLs still render.

### 1.5 Error pages, SEO plumbing

**Why:** There is no `not-found.tsx`, `error.tsx`, `sitemap.ts`, or
`robots.ts`. A bad movie id shows the unstyled default 404; crawlers get no
sitemap; OG URLs resolve to `*.vercel.app` deployment hosts.

**How:**
- `src/app/not-found.tsx`: branded 404 (reuse the person-page fallback style —
  headline, "Back to home" `btn-brand`).
- `src/app/error.tsx`: client component with a "Try again" button calling
  `reset()`, same visual language.
- `src/app/robots.ts` and `src/app/sitemap.ts` (home + static routes; movie
  pages are unbounded, listing the current popular/now-playing ids is enough).
- Canonical URL: add optional `SITE_URL` to `src/env/schema.mjs` and prefer it
  over `VERCEL_URL` in `src/app/layout.tsx` `metadataBase`.
- JSON-LD: in `src/app/movie/[id]/page.tsx`, render a
  `<script type="application/ld+json">` `Movie` object (name, image,
  datePublished, director, genre, aggregateRating from vote data).

**Accept:** `/movie/does-not-exist` shows the branded 404; `/sitemap.xml` and
`/robots.txt` respond; movie pages validate in Google's Rich Results test.

### 1.6 Small cleanups (bundle with any Phase 1 PR)

- `HomeClient.tsx` comment says "cast cards link here" about the `?q=` deep
  link — cast cards now link to `/person/...`; fix the comment (or delete it
  once 1.1's `useSearchParams` rewrite replaces the effect).
- `Hero`/`MiniStrip`/`MovieCard` each re-derive `posterSrc` from
  string-or-object `posterImage` — extract a `getPosterSrc()` util in
  `src/utils/` and use it everywhere.
- `profile/page.tsx`: while `status === 'loading'` a bare "Loading…" line
  renders — use the existing skeleton pattern for the whole page instead.

---

## Phase 2 — Engagement & polish

### 2.1 Optimistic watchlist toggles

**Why:** Hearts currently show a spinner for a full network round trip +
invalidation. Instant feedback makes the most-used interaction feel native.

**How:** In `src/hooks/useWatchlist.ts`, add `onMutate` handlers to
`quickAdd`/`remove` that cancel in-flight `user.query` fetches, snapshot the
cache, and update `utils.user.query.setData` immediately (add a stub row with
just `movieId` for adds; filter for removes); roll back on `onError`, and keep
`invalidate` in `onSettled`. `has()` already reads from that cache, so cards
and the hero update for free. Keep `pendingId` for a subtle in-flight state,
but the heart should flip immediately.

**Accept:** Tapping a heart flips instantly on all visible cards; a failed
mutation flips it back.

### 2.2 Search: URL sync, pagination, people results

**Why:** Search state is lost on navigation/back; only page 1 (≤20 results)
ever shows; searching an actor's name finds nothing useful even though person
pages exist.

**How (three sub-steps, in order):**
1. **URL sync:** with 1.1's `useSearchParams` in place, `router.replace`
   (`scroll: false`) `?q=` on each debounced query change, and clear it when
   the box empties. Back/forward then restore search state naturally.
2. **Pagination:** change `fetchSearch` to accept `page` and return
   `{ movies, page, totalPages, totalResults }`; convert `tmdb.search` to
   accept `{ query, page }`; use `useInfiniteQuery` in `HomeClient` with a
   "Load more results" button. Show `totalResults` in the heading instead of
   the current page-1 count.
3. **People in results:** switch the fetcher to `/search/multi`, split
   results into movies and people (`media_type`), and render a compact
   "People" strip (headshot + name linking to their person page, reusing
   `CastCard`) above the movie grid when people match.

**Accept:** Searching, opening a movie, and pressing back restores results;
"Load more" appends page 2+; searching "Tom Hanks" shows a person card
linking to his filmography.

### 2.3 Personalized "For you" row on home

**Why:** Signed-in users with a watchlist get the same home page as everyone
else; the data to personalize is already in the DB.

**How:**
- New protected tRPC procedure `tmdb.forYou`: read the user's watchlist rows,
  count genres (same logic as `ProfileStats`), take the top 2 genre names,
  map to TMDB genre ids via `fetchGenreList()` (from 1.3), call
  `/discover/movie` with `with_genres=<id1>|<id2>&sort_by=popularity.desc&vote_count.gte=200`,
  and filter out movies already on the watchlist. Return ~20 cards.
- In `HomeClient`, when the session exists, query it and render a
  `MovieRow` titled "For you" (subtitle: "Because you save <Genre> movies")
  between the hero block and "Top 10 today". Skip rendering entirely for
  signed-out users or empty watchlists.

**Accept:** A signed-in user with saved horror movies sees a horror-leaning
row that excludes titles already on their list; signed-out home is unchanged.

### 2.4 Click-to-play trailer (performance)

**Why:** The YouTube iframe loads eagerly on every movie page — it's the
heaviest third-party payload on the site and most visitors never press play.

**How:** In `MovieDetails.tsx`, replace the eager `<iframe>` with a facade:
a button showing the movie backdrop + centered play icon; on click, swap in
the iframe with `src={trailer.url + '?autoplay=1'}`. Keep the same
aspect-ratio box to avoid layout shift.

**Accept:** Movie pages make no requests to youtube.com until the trailer is
clicked; clicking plays immediately.

### 2.5 Profile upgrades: ratings histogram + export

**Why:** The "Your taste" dashboard is the stickiest page; two cheap additions
deepen it.

**How:**
- **Ratings histogram:** in `ProfileStats.tsx`, add a 5-bar distribution of
  `userRating` (1–5 stars), same bar styling as the genre bars, direct-labeled
  counts (no color-only encoding).
- **Decade breakdown:** bucket `releaseDate` by decade, show top decades as a
  small bar list ("You're a 90s person").
- **CSV export:** a "Download CSV" `btn-ghost` on the profile that serializes
  the already-loaded watchlist rows client-side
  (title, year, rating, genres, TMDB id — Letterboxd-import-compatible
  headers: `Title,Year,Rating10,WatchedDate`) into a Blob download. No new
  endpoint needed.

**Accept:** Profile shows rating and decade distributions once ≥1 movie is
rated; exported CSV opens in a spreadsheet and imports into Letterboxd.

### 2.6 Rate from the mobile sticky bar

**Why:** On mobile, rating requires scrolling back to the header; the sticky
bar only offers add/remove.

**How:** In `MovieDetails.tsx`'s fixed bottom bar, when signed in and the
movie is on the watchlist, show the `StarRating` inline next to a compact
remove button. Keep the bar single-row (stars left, action right).

**Accept:** On a phone, I can rate a movie from anywhere on its page.

---

## Phase 3 — Bigger bets (pick by appetite)

### 3.1 Public, shareable watchlist

Share-your-taste is the main viral loop available. New `public Boolean
@default(false)` on `User` (Prisma migration), a profile toggle, and a
read-only `/u/[userId]` page (public tRPC procedure returning name, avatar,
and watchlist rows only when `public`). The existing Share button pattern
from `MovieDetails` covers the copy-link UI.

### 3.2 "Now available to stream" alerts for your watchlist

Nodemailer is already configured for auth emails. A Vercel cron route
(`src/app/api/cron/availability/route.ts`, protected by `CRON_SECRET`) that
checks watch providers for each user's unrated watchlist items daily and
emails when a title newly appears on a flatrate service. Requires storing
last-known availability (`hasStreaming Boolean` on `WatchListItem`) to detect
transitions. Include an opt-in flag on `User`.

### 3.3 Trending toggle + Top rated row

Home additions: a Day/Week segmented control on the hero section backed by
`/trending/movie/{day|week}`, and an all-time "Top rated" `MovieRow` backed by
`/movie/top_rated`. Straightforward with the existing fetcher/row patterns;
main cost is home-page visual budget, so consider replacing the "Popular"
row rather than adding a fifth row.

### 3.4 Test + CI baseline

There are zero tests. Add vitest with a handful of pure-function tests
(`src/utils/news.ts` partitioning, `createMovieObj`, the new `getPosterSrc`,
`ProfileStats` aggregation extracted into a testable helper), plus a GitHub
Actions workflow running `lint`, `tsc --noEmit`, and `vitest` on PRs. Keeps
Sonnet honest while it implements the rest of this plan.

---

## Suggested implementation order

| PR | Contents |
|----|----------|
| 1 | 1.1 Nav search + 1.6 cleanups |
| 2 | 1.2 More like this |
| 3 | 1.3 Genre pages + clickable chips |
| 4 | 1.4 Person-by-id routes |
| 5 | 1.5 Error pages + SEO |
| 6 | 2.1 Optimistic hearts + 2.2 search upgrades |
| 7 | 2.3 For you row |
| 8 | 2.4 Trailer facade + 2.6 sticky-bar rating |
| 9 | 2.5 Profile histogram/decades/export |
| 10+ | Phase 3 picks |

Notes for the implementer:
- Match existing conventions: Tailwind utility classes with the shared
  `chip` / `surface` / `btn-brand` / `btn-ghost` / `section-heading` classes
  in `globals.css`; components in `src/components/<Name>/<Name>.tsx` with a
  sibling `types.d.ts`; server fetchers in `src/server/tmdb.ts` with explicit
  `REVALIDATE` windows.
- Every new TMDB call goes through `tmdbFetch` (it handles both key styles
  and caching).
- All new images must come from hosts already allow-listed in
  `next.config.mjs` (TMDB is covered).
- Run `npm run lint` and `npx tsc --noEmit` before each commit; there is no
  test suite yet (see 3.4).
