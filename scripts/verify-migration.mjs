/** Rebuilds only the dedicated local migration-test database, never DATABASE_URL. */
import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const container = 'movie-fan-ux-test', database = 'movie_fan_migration_test'
function sql(text, db = database) {
  const run = spawnSync('docker', ['--context', 'desktop-linux', 'exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db], { input: text, encoding: 'utf8' })
  if (run.status !== 0) throw new Error(run.stderr || run.stdout)
  return run.stdout
}
const exists = sql("SELECT 1 FROM pg_database WHERE datname='movie_fan_migration_test';", 'postgres').includes('(1 row)')
if (!exists) sql('CREATE DATABASE movie_fan_migration_test;', 'postgres')
sql('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
const migrations = readdirSync('prisma/migrations').filter(n => /^\d/.test(n)).sort()
for (const name of migrations.filter(n => n < '20260905')) sql(readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'))
sql(`
INSERT INTO "User" (id, name) VALUES ('migration-member', 'Migration member');
INSERT INTO "WatchListItem" (id,"userId","movieId","emsVersionId",name,"directedBy","durationMinutes","userRating") VALUES
('rated','migration-member','1','1','Rated film','',100,5),
('unrated','migration-member','2','2','Unrated watch','',90,null);
INSERT INTO "WatchEvent" (id,"userId","movieId",name,"watchedAt","updatedAt",review) VALUES
('watch1','migration-member','2','Unrated watch','2025-01-01','2025-01-01','Keep my words'),
('orphan','migration-member','3','Previously unsaved film','2024-01-01','2024-01-01','Keep this too');
INSERT INTO "MovieList" (id,"userId",name,"updatedAt") VALUES ('list','migration-member','My old list',now());
INSERT INTO "MovieListItem" (id,"listId","movieId",name,position) VALUES ('item','list','1','Rated film',7);
`)
for (const name of migrations.filter(n => n >= '20260905')) sql(readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'))
sql(`DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM "WatchListItem" WHERE "movieId"='1' AND "userRating"=5 AND watched=true AND "inWatchlist"=true AND "savedAt" IS NULL AND "lastWatchedAt" IS NULL) THEN RAISE EXCEPTION 'Rated legacy film changed'; END IF;
IF NOT EXISTS (SELECT 1 FROM "WatchListItem" WHERE "movieId"='2' AND watched=true AND "userRating" IS NULL AND "lastWatchedAt"='2025-01-01') THEN RAISE EXCEPTION 'Unrated watch not preserved'; END IF;
IF NOT EXISTS (SELECT 1 FROM "WatchListItem" WHERE "movieId"='3' AND watched=true AND "inWatchlist"=false AND "lastWatchedAt"='2024-01-01') THEN RAISE EXCEPTION 'Orphan diary film not recovered'; END IF;
IF (SELECT count(*) FROM "WatchEvent" WHERE "isPublic"=false AND review IS NOT NULL) <> 2 THEN RAISE EXCEPTION 'Diary privacy or text changed'; END IF;
IF NOT EXISTS (SELECT 1 FROM "MovieListItem" WHERE id='item' AND position=7) THEN RAISE EXCEPTION 'List order changed'; END IF;
END $$;`)
console.log('Migration verified: ratings, unrated watches, orphan history, private reviews, unknown dates, and list positions preserved.')
