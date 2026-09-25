import {PrismaClient} from '@prisma/client'
const db=new PrismaClient()
const rows=await db.$queryRaw`SELECT COUNT(*)::int AS "collectionRows",COUNT("userRating")::int AS "ratings",COALESCE(SUM("userRating"),0)::int AS "ratingSum" FROM "WatchListItem"`
const events=await db.$queryRaw`SELECT COUNT(*)::int AS "viewings",COUNT(DISTINCT ("userId","movieId"))::int AS "watchedFilms" FROM "WatchEvent"`
console.log(JSON.stringify({collection:rows[0],diary:events[0]},null,2))
await db.$disconnect()
