# Movie Fan

A personal film club: discover films, keep a Library of what you want to see and have seen, log Viewings in a Diary, rank favorites in Lists, follow friends, and get help choosing what to watch tonight. The vocabulary used across the code is defined in [CONTEXT.md](CONTEXT.md).

Built with Next.js (App Router), tRPC, Prisma on Postgres, Auth.js, and Tailwind. Film data comes from TMDB, IMDb ratings from OMDb (optional), and where-to-watch data from JustWatch via TMDB.

## Run it locally

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
npx prisma migrate deploy
```

```bash
npm run dev
```

Set `TMDB_FIXTURES=1` in `.env` to use a small invented film catalog instead of calling TMDB: no API key or network needed.

## Checks

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run test:integration` | Tests against a real local Postgres (`DATABASE_URL` must point at localhost) |
| `npm run build` | Production build |

CI runs all five. `SKIP_ENV_VALIDATION=1` lets a build run without real secrets; never set it in production.

## How the code is organized

- `src/server/catalog`: everything known about films and people. Callers never see TMDB's response shapes.
- `src/server/library`: every change a Member makes to their Library, with the rules in `rules.ts` shared by server and client.
- `src/server/recommendations`: Tonight picks and the "For you" row.
- `src/server/availability`: where a film can be watched, and which of a Member's films are streaming.
- `src/server/member`: preferences, public profile, account deletion.
- `src/server/api/routers`: the tRPC API over those modules.
- `src/app`: pages. `src/components`: shared UI.

## Deploying

Production runs on Vercel and deploys `main`. Database migrations are not applied by the build; run `npx prisma migrate deploy` against the production database when a release includes one.

Hosting cost shapes several decisions here. Film and person pages are an effectively unbounded set, so they are kept out of search engines (`src/app/robots.ts`), film pages are cached at the CDN rather than written as ISR pages (`next.config.mjs`), person pages share one static shell, and catalog reads that are the same for everyone are CDN-cacheable (`src/server/api/publicReads.ts`).

A daily cron (`vercel.json`) emails Members who opted in when a Watchlist film starts streaming.
