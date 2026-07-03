# Flixster → TMDB migration plan

## Why TMDB

The app already partially depends on TMDB (`src/server/tmdb.ts` powers `/person/[name]`
pages), so this consolidates onto a single API instead of introducing a third. TMDB is
free, has no meaningful rate limit for an app this size (~40 req/s vs Flixster's
RapidAPI monthly quota), and covers every data category currently pulled from
Flixster: search, movie details, cast/crew, images, trailer, genres, certification. It
does **not** have theater showtimes — see the "Where to watch" note below for the
replacement.

## Already done (do not redo)

These are complete and uncommitted in the working tree — verify they're present, don't
re-apply:

- `src/env/schema.mjs` — `RAPID_API_KEY` removed, `TMDB_API_KEY` now `z.string().min(1)` (required).
- `.env.example` — `RAPID_API_KEY` section removed, `TMDB_API_KEY` comment updated to required.
- `src/data/Constants.ts` — rewritten to only TMDB constants:
  ```ts
  export const TMDB_BASE_API_URL = 'https://api.themoviedb.org/3'
  export const TMDB_POSTER_URL = 'https://image.tmdb.org/t/p/w500'
  export const TMDB_BACKDROP_URL = 'https://image.tmdb.org/t/p/original'
  export const TMDB_PROFILE_URL = 'https://image.tmdb.org/t/p/w500'
  export const TMDB_BACKDROP_THUMB_URL = 'https://image.tmdb.org/t/p/w780'
  ```
- `next.config.mjs` — removed `resizing.flixster.com`, `flxt.tmsimg.com`,
  `images.fandango.com` from `imageHosts` (keep `prd-rteditorial.s3...` — that's the
  unrelated news RSS feed, leave it).
- Deleted: `src/server/flixster.ts`, `src/server/api/routers/flixster.ts`,
  `src/app/api/find-movie/route.ts`, and the dead fixture files
  `src/data/movieData.json`, `popularData.json`, `upcomingData.json`, `NowPlaying.json`
  (confirmed unused anywhere in `src/`).

Everything below still needs to happen. **The build will not compile right now** —
several files still import the deleted modules.

## Design decisions (apply consistently)

1. **Movie IDs**: The TMDB numeric movie id (stringified) becomes the app's canonical
   movie id. Keep every existing field/prop/column *named* `emsVersionId` /
   `movieId` — don't rename them. They're baked into `/movie/[id]` routing, the
   `WatchListItem` Prisma table, and ~10 components. Renaming buys nothing and forces
   a DB migration; just change what value they hold.

2. **Ratings**: Drop the nested `tomatoRating: { tomatometer, consensus, iconImage }`
   shape entirely — that was Flixster's exact payload passed straight through. Since
   we're writing the new payload shape from scratch, populate the *existing flat*
   `tomatoMeter` field directly everywhere (`MovieCardProps.tomatoMeter`, the Prisma
   `WatchListItem.tomatoMeter` column, `MovieSchema.tomatoMeter`) with
   `Math.round(vote_average * 10)` (TMDB's 0–10 score scaled to 0–100). **Do not
   rename the `tomatoMeter`/`consensus` DB columns** — `src/app/profile/page.tsx`
   spreads raw Prisma `WatchListItem` rows straight into `<MovieCard {...movie} />`,
   so the Prisma field names must keep matching `MovieCardProps` structurally.
   `consensus` gets repurposed to hold the TMDB `tagline` (short editorial blurb,
   same UI slot — an italic blockquote on the movie page).

3. **Rotten-Tomatoes-branded UI copy is now wrong and must be relabeled** (text only,
   no field renames): the 🍅 emoji, "Tomatometer" dropdown option, and the "Critics"
   framing in `ProfileStats.tsx` ("You vs critics", "Tougher than the critics") all
   implied Rotten Tomatoes critic scores. TMDB's `vote_average` is a TMDB *user*
   score, not a critics score — relabel to something like "TMDB score" / "TMDB
   users" wherever it's user-facing. Internal variable/prop names (`tomatoMeter`,
   `CRITICS_COLOR`, `SortKey = 'tomato'`) can stay as-is per point 2.

4. **No theater showtimes**: TMDB has no theater/Fandango-style data. Replace the
   "Where to watch" section with TMDB's **watch providers** endpoint (JustWatch data,
   included free via `append_to_response=watch/providers`) — show streaming / rent /
   buy provider logos for region `US`, linking out to the TMDB watch page
   (`results.US.link`), with a small "Streaming data by JustWatch" attribution line.
   Drop the Fandango ticket button.

5. **Trailer**: TMDB gives a YouTube video key, not an mp4 URL. Swap the `<video>` tag
   for a YouTube `<iframe>` embed (`https://www.youtube.com/embed/{key}`).

6. **`/person/[name]` pages: do not touch.** `fetchPerson`, `isTmdbConfigured`,
   `Person`, `PersonCredit` in `src/server/tmdb.ts` already work end-to-end on TMDB
   and are unaffected by this migration — leave them exactly as they are. The one
   required change is in the page component: the "Known for" credit links currently
   go through `/api/find-movie?title=&year=` (a Flixster-search resolver bridging
   TMDB person credits back to Flixster movie ids). Since movie ids are now TMDB ids
   too, `credit.tmdbId` *is already* the target movie id — link straight to
   `/movie/${credit.tmdbId}` with `next/link` (no resolver needed, and prefetching is
   fine now that there's no quota to protect).

## File-by-file remaining work

### `src/server/tmdb.ts` — add movie fetchers alongside the existing person code

Keep `fetchPerson`, `isTmdbConfigured`, `Person`, `PersonCredit`, `tmdbFetch`, `POSTER_BASE`,
`PROFILE_BASE` untouched. Add:

- `export const REVALIDATE = { popular: 21_600, nowPlaying: 21_600, upcoming: 43_200, details: 86_400, search: 3_600 }`
  (seconds; TMDB isn't quota-constrained so these can be much shorter than Flixster's
  old 12h/24h/7d windows — just enough to avoid redundant calls).
- A `MovieCardData` type matching `MovieCardProps` fields it can populate:
  `{ emsVersionId, name, posterImage: { url }, releaseDate, tomatoMeter }`.
- `mapSummary(m)`: maps one TMDB movie-list item → `MovieCardData`:
  ```ts
  emsVersionId: String(m.id)
  name: m.title
  posterImage: { url: m.poster_path ? `${TMDB_POSTER_URL}${m.poster_path}` : null }
  releaseDate: m.release_date || null
  tomatoMeter: m.vote_average != null ? Math.round(m.vote_average * 10) : null
  ```
- `fetchPopular()` → `GET /movie/popular`, map `results` through `mapSummary`, cache `REVALIDATE.popular`.
- `fetchNowPlaying()` → `GET /movie/now_playing`, same mapping, cache `REVALIDATE.nowPlaying`.
  (Replaces the old `opening` list — Flixster used to bundle it inside the popularity
  response; TMDB needs its own call.)
- `fetchUpcoming()` → `GET /movie/upcoming`, same mapping, cache `REVALIDATE.upcoming`.
- `fetchSearch(query)` → `GET /search/movie?query=`, map `results` through `mapSummary`
  (drop items with no `poster_path`/`title` as noise, same defensiveness as the old
  Flixster search), cache `REVALIDATE.search`.
- `fetchMovieDetails(id)` (wrap in React `cache()` like the old `fetchDetails`) →
  `GET /movie/{id}?append_to_response=credits,videos,images,release_dates,watch/providers`.
  Return an object matching the new `IMovieDetail` shape (see below). Key sub-mappings:
  - `directedBy`: `credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ')`
  - `cast`: `credits.cast.map(c => ({ id: String(c.id), name: c.name, characterName: c.character || undefined, headShotImage: c.profile_path ? { url: \`${TMDB_PROFILE_URL}${c.profile_path}\` } : undefined }))`
  - `crew`: same mapping but `role: c.job` instead of `characterName`, and cap to the
    first ~12 entries sorted by department relevance (TMDB crew lists can be huge —
    Flixster's were curated/short, so an uncapped render here would be a regression)
  - `totalGross`: `revenue > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(revenue) : null`
  - `motionPictureRating`: find `release_dates.results` entry with `iso_3166_1 === 'US'`,
    take the first non-empty `certification` from its `release_dates[]` → `{ code }`
  - `trailer`: find first `videos.results` item with `type === 'Trailer' && site === 'YouTube'`
    (prefer `official === true`) → `{ url: key ? \`https://www.youtube.com/embed/${key}\` : null }`
  - `images`: `images.backdrops.slice(0, 12).map(b => ({ url: \`${TMDB_BACKDROP_THUMB_URL}${b.file_path}\` }))`
  - `watchProviders`: from `['watch/providers'].results.US` — `{ flatrate, rent, buy: each
    provider list mapped to { name: provider_name, logoUrl: \`${TMDB_PROFILE_URL}${logo_path}\` }, link: results.US.link ?? null }`;
    `null` if no US entry
  - `tomatoMeter` / `voteCount`: from `vote_average` / `vote_count` (same formula as `mapSummary`)
  - `consensus`: `tagline || null`
  - `posterImage` / `backgroundImage`: `{ url }` built from `poster_path` (`TMDB_POSTER_URL`)
    and `backdrop_path` (`TMDB_BACKDROP_URL`) respectively, `null` if absent
  - `genres`, `synopsis` (← `overview`), `durationMinutes` (← `runtime`), `releaseDate`,
    `name` (← `title`), `emsVersionId`/`id` (← `String(id)`) map directly

### `src/server/api/routers/tmdb.ts` (new file, replaces the deleted flixster router)

```ts
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from './../trpc'
import { fetchSearch, fetchMovieDetails } from '../../tmdb'

export const tmdbRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1) }))
    .query(async ({ input }) => ({ movies: await fetchSearch(input.query) })),
  details: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => ({ movie: await fetchMovieDetails(input.id) })),
})
```

### `src/server/api/root.ts`

Swap the import and mount key: `flixster: flixsterRouter` → `tmdb: tmdbRouter`
(`movie` is already taken by `watchListItemRouter`, so it can't reuse that name).

### `src/utils/api.ts`

Just a stale doc-comment: `RouterOutputs['flixster']['details']` → `RouterOutputs['tmdb']['details']`.

### `src/app/page.tsx`

Replace the Flixster import/calls:
```ts
import { fetchPopular, fetchNowPlaying, fetchUpcoming } from '@/server/tmdb'
...
const [popularRes, nowPlayingRes, upcomingRes, newsRes] = await Promise.allSettled([
  fetchPopular(),
  fetchNowPlaying(),
  fetchUpcoming(),
  fetchNews(),
])
...
const data: HomeData = {
  popular: popularRes.status === 'fulfilled' ? popularRes.value : [],
  opening: nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value : [],
  upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value : [],
  news: newsRes.status === 'fulfilled' ? newsRes.value : [],
}
```
Update the `revalidate` export and its comment — no more "monthly quota" framing, just
pick something like `21600` (6h) for ISR freshness.

### `src/app/HomeClient.tsx`

`api.flixster.search.useQuery(...)` → `api.tmdb.search.useQuery(...)`. Nothing else
changes (it already destructures `results.movies` generically).

### `src/app/movie/[id]/page.tsx`

`import { fetchDetails } from '@/server/flixster'` → `import { fetchMovieDetails } from '@/server/tmdb'`,
rename the two call sites, update `revalidate` (e.g. `86400`) and its comment.

### `src/app/person/[name]/page.tsx`

Only the credit link changes. Currently:
```tsx
<a
  key={credit.tmdbId}
  href={`/api/find-movie?title=${encodeURIComponent(credit.title)}${credit.year ? `&year=${credit.year}` : ''}`}
  className="group block"
>
```
Becomes:
```tsx
<Link key={credit.tmdbId} href={`/movie/${credit.tmdbId}`} className="group block">
```
(swap the `<a>` for `<Link>`, import it from `next/link`, remove the now-stale comment
about avoiding prefetch to save quota). Everything else in this file is unchanged.

### `src/server/api/routers/watchListItem.ts`

`import { fetchDetails } from '@/server/flixster'` → `import { fetchMovieDetails } from '@/server/tmdb'`,
update the `quickAdd` call site. The `IMovieDetail` type import path stays the same
(`@/components/MovieDetails/types`), just update to match the new shape (see below).
No other logic changes — `createMovieObj` already normalizes whatever `IMovieDetail`
looks like.

### `src/components/MovieDetails/types.d.ts`

Rewrite `IMovieDetail` to match the new `fetchMovieDetails` return shape:
```ts
export interface IGenres { name: string }

export interface IMovieDetail {
  emsVersionId: string
  id: string
  name: string
  synopsis: string | null
  genres: IGenres[]
  posterImage: { url: string | null }
  backgroundImage: { url: string | null }
  releaseDate: string | null
  durationMinutes: number
  directedBy: string
  totalGross: string | null
  motionPictureRating: { code: string | null }
  tomatoMeter: number | null
  voteCount: number | null
  consensus: string | null
  trailer: { url: string | null }
  images: { url: string }[]
  cast: Credit[]
  crew: Credit[]
  watchProviders: {
    flatrate: { name: string; logoUrl: string }[]
    rent: { name: string; logoUrl: string }[]
    buy: { name: string; logoUrl: string }[]
    link: string | null
  } | null
}
```
(`Credit` already exists in `src/components/CastGrid/types.d.ts` — reuse via import.)
Check whether `MovieDetailInterface` in this same file is referenced anywhere; if not,
delete it — it was a leftover Flixster-shaped type.

### `src/components/MovieDetails/MovieDetails.tsx`

- Delete the `theaterName` / `theaterShowtimes` helper functions and the `ticketsUrl`
  const — Flixster/Fandango-specific, no longer applicable.
- `const theaters = movie.showtimeGroupings?.theaters || []` and the whole "Where to
  watch" theater-list `<section>` → replace with a "Where to watch" section driven by
  `movie.watchProviders` (flatrate/rent/buy logo rows + a "More info" link to
  `movie.watchProviders.link` + "Streaming data by JustWatch" attribution). Only
  render the section when `movie.watchProviders` has at least one provider.
- `ScoreBadge` usage: drop the second badge entirely (`movie.userRating?.dtlLikedScore`
  — no TMDB equivalent, TMDB has one score not a critic/audience split). For the
  remaining badge, drop the `iconUrl` prop (no TMDB equivalent image) — simplify
  `ScoreBadge` to render a hardcoded ⭐ instead of an `<Image>` icon, and call it with
  `score={movie.tomatoMeter}` and `count={movie.voteCount}`.
- Critics' consensus blockquote: still reads `movie.tomatoRating.consensus` — change
  to `movie.consensus` (now the TMDB tagline). Since a tagline is plain text (not
  HTML), the `html-react-parser`/`domToReact` sanitization there is no longer needed —
  simplify to `<Balancer>{movie.consensus}</Balancer>` and drop the `parse`/`domToReact`
  imports if nothing else in the file uses them.
- Trailer section: swap the `<video><source src={movie.trailer.url} type="video/mp4" /></video>`
  block for a YouTube `<iframe src={movie.trailer.url} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-xl border border-zinc-800" />`.
- Gallery: unchanged — `movie.images` is still `{ url }[]`.
- `movie.motionPictureRating?.code` fact row: TMDB has no certification *description*
  (Flixster's `.description` doesn't exist here) — simplify the `title`/join logic to
  just show the code, drop the `.description` half of that ternary.
- Drop the `movie.availabilityWindow` chip — no TMDB equivalent, and it's low enough
  value to just remove rather than approximate from `movie.status`.
- `createMovieObj(movie as IMovieDetail, ...)` call sites: fine as-is once
  `createMovieObj.ts` is updated (see below).

### `src/utils/createMovieObj.ts`

Update field sources to match the new flat `IMovieDetail` shape (no more
`movie.tomatoRating?.consensus` / `movie.tomatoRating?.tomatometer` nesting):
```ts
consensus: movie.consensus ?? null,
tomatoMeter: movie.tomatoMeter ?? null,
```
Everything else (`durationMinutes`, `releaseDate`, `directedBy`, `emsVersionId`,
`posterImage.url`, `totalGross`, `motionPictureRating.code`) already matches the new
shape's field names — no change needed there.

### `src/components/MovieCard/types.d.ts`

Drop the nested field, keep only the flat one:
```ts
export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  name: string;
  posterImage: Image | string | null;
  emsVersionId: string;
  releaseDate?: string | null;
  tomatoMeter?: number | null;
  userRating?: number | null;
  rank?: number;
}
```
(Remove `tomatoRating?: { tomatometer?: number | null } | null;`.)

### `src/components/MovieCard/MovieCard.tsx` and `src/components/Hero/Hero.tsx`

Both currently do `tomatoMeter ?? tomatoRating?.tomatometer ?? null` — simplify to just
`tomatoMeter ?? null` (or use it directly, it's already optional). Swap the `🍅 {score}%`
badge text to something not RT-branded, e.g. `⭐ {score}%` or `🎬 {score}%` — pick one
and use it consistently in both files.

### `src/components/ProfileStats/ProfileStats.tsx`

Text-only changes (keep `CRITICS_COLOR` variable name, it's internal):
- `"Tougher than the critics 🧐"` → `"Tougher than TMDB users 🧐"`
- `"More generous than critics 🍿"` → `"More generous than TMDB users 🍿"`
- Legend label `"Critics"` (in the `{ label: 'Critics', ... }` row) → `"TMDB users"`
- Footer copy `"...rated {movies} with a Tomatometer"` → `"...rated {movies} with a TMDB score"`

### `src/app/profile/page.tsx`

Dropdown option text only: `<option value="tomato">Tomatometer</option>` → `<option value="tomato">TMDB score</option>`
(keep the `SortKey = 'tomato'` value/type as-is, it's internal).

## Manual step the user must do (not code)

`TMDB_API_KEY` is now a hard requirement — the app will fail to start / fail Vercel's
build without it (via the zod env schema). Get a free key at
https://www.themoviedb.org/settings/api and set `TMDB_API_KEY` in `.env` locally and
in the hosting provider's environment variables before deploying this branch.

## Known limitation to flag to the user

Existing `WatchListItem` rows in the DB reference **Flixster** movie ids in
`movieId`/`emsVersionId`. After this migration those ids won't resolve against TMDB,
so previously-saved watchlist/rated movies will 404 when clicked (the list itself
still renders from cached DB fields, just the link-through breaks). This plan does not
include a backfill/reconciliation script — flag it and decide separately whether one's
worth writing (would need to fuzzy-match each saved title+year against TMDB search and
rewrite the row's id).

## Suggested verification order

1. `npm run build` (or `tsc --noEmit`) after each of the file groups above — the
   Flixster imports will surface as compile errors until every file above is updated,
   which is a good checklist in itself.
2. `npm run dev`, click through: home page (popular/opening/upcoming rows load,
   search works), a movie detail page (poster/backdrop/cast/trailer/gallery/watch
   providers render, add-to-watchlist works), a person page (cast card → profile →
   "known for" credit → lands on the right movie page directly, no redirect hop).
3. Confirm no remaining references: `grep -ri "flixster\|rapid_api" -r src .env.example next.config.mjs`
   should return nothing.
