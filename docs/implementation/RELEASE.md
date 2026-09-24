# Release and verification

## Local review

This implementation was deployed to https://movie-fan-978.netlify.app on September 5, 2026. Netlify is the active host; the Vercel project link is legacy configuration. The local review uses PostgreSQL in the `movie-fan-ux-test` Docker container, exposed only at `127.0.0.1:55439`, with database `movie_fan_test`. The review seed scripts refuse non-local database addresses. The migration audit only rebuilds `movie_fan_migration_test` inside that dedicated container.

Use the existing project environment for movie-source credentials; explicitly override `DATABASE_URL` with the local test database when running write tests or a seeded preview. Do not run seed scripts against a production connection.

```sh
npm run typecheck
npm run lint
npm test
# With DATABASE_URL set to the isolated local PostgreSQL database:
npx prisma migrate deploy
npm run test:integration
node scripts/verify-migration.mjs
```

The audit script uses Docker Desktop's `desktop-linux` context. Wait for PostgreSQL to finish starting before running it. For visual test data, run `scripts/seed-review.mjs`.

## Production cutover

1. Back up the target database and record collection, diary, and list/item counts. Verify the target environment and run the migrations against staging first.
2. Generate Prisma Client and build the app. Never run a build and the development server against the same `.next` directory simultaneously.
3. Apply the three additive migrations in this change with `npx prisma migrate deploy`. Coordinate the cutover so the old application cannot continue its former destructive unsave behavior after migration.
4. Deploy this application version with the existing authentication, movie-source, email, and cron configuration. Verify the application database role can access the new server-only tables under the existing RLS model.
5. With test accounts, verify sign-in, save/unsave, an unrated watch, editing a diary entry, list ordering, regional providers, and news bookmarks. Real email delivery must be tested only to an explicitly approved test recipient.
6. Reconcile counts and sample historical ratings/reviews. Unknown historical save dates must remain unknown. Existing diary entries stay private.

## Voting room removal

Voting room pages, navigation, API procedures, ticket exports, and review seed tooling have been removed. Existing room tables and migration history are retained to preserve stored data; no database migration is needed for this removal.

## Migration behavior

- Existing collection rows retain membership and ratings; rated films and films with viewing history are marked watched.
- Existing diary dates supply the last-watch date. Orphan diary films are restored as watched without placing them back on the watchlist.
- Existing lists retain their positions and default to unranked. Existing reviews default to private and without a spoiler flag.
- New streaming-delivery records provide a lease and retry state. No historical sends are fabricated.

## Rollback and monitoring

Keep the additive schema if rolling application code back; do not drop new tables or columns containing member data. The old unsave implementation deletes the collection row, so restoring old application code also restores that bug—prefer a forward fix for collection-state issues.

Observe failed saves/logs, private/public visibility, external-source failures, alert send failures, and query latency. Do not record review text, email addresses, or private search terms in general analytics. Establish a baseline before claiming improvements in retention or speed. See `PROGRESS.md` for implementation boundaries and follow-on experiments.

## Netlify publication — September 5, 2026

Deployment ID: 6a9cb6ca3d83b540feb33a57. All three new migrations applied successfully. Original counts were preserved (1 member, 3 library films); the application role can query all new tables. A readable pre-migration backup is retained locally in the ignored `.vercel/backups/before-film-club.dump` archive.

Build with Netlify production environment variables. Local environment files must be kept out of the server archive: the Next.js adapter otherwise bundles them. For a separately built release, publish `.netlify/static` and `.netlify/functions` explicitly with `netlify deploy --no-build --prod --dir .netlify/static --functions .netlify/functions`. Deploying raw `.next` with `--no-build` omits the browser asset URL structure.

The Vercel cron configuration does not schedule jobs on Netlify. Streaming-alert scheduling and real email verification remain unconfigured release follow-ups; no mail was sent as part of this deployment.
