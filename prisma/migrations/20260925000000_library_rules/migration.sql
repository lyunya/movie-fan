-- A Rating, a Favorite, or a logged Viewing means the Film was watched.
-- Older rows could have any of these without being marked watched; mark
-- them watched now. The Watchlist is left as it is.
UPDATE "WatchListItem" AS item
SET "watched" = true
WHERE item."watched" = false
  AND (
    item."userRating" IS NOT NULL
    OR item."favorite" = true
    OR EXISTS (
      SELECT 1 FROM "WatchEvent" AS viewing
      WHERE viewing."userId" = item."userId"
        AND viewing."movieId" = item."movieId"
    )
  );
