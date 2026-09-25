# Movie Fan

A personal film club: members discover films, keep a Library of what they want to see and have seen, log Viewings in a Diary, rank favorites in Lists, and get help choosing what to watch tonight.

## Films

**Film**:
A single movie as described by the film database, identified by its film id.
_Avoid_: Movie (in code), title, ems version

## A member's Library

**Member**:
A signed-in person using Movie Fan.
_Avoid_: User (except for the auth record), account

**Library**:
Every Film a Member has a relationship with: saved, watched, rated, favorited, or dismissed.
_Avoid_: Collection, watchlist (for the whole thing)

**Library entry**:
One Member's relationship with one Film.
_Avoid_: Watchlist item, row

**Watchlist**:
The Films a Member has saved to see and has not watched yet.
_Avoid_: Queue, saved list

**Watched**:
The Member has seen the Film at least once. Rating a Film or logging a Viewing makes it Watched, and a Watched Film leaves the Watchlist.
_Avoid_: Seen, logged

**Rating**:
A Member's one-to-five-star opinion of a Film.
_Avoid_: Score (reserved for outside scores like IMDb and TMDB)

**Favorite**:
A Film the Member has explicitly marked as a favorite.

**Loved**:
A Film the Member has favorited or rated four or five stars.
_Avoid_: Liked

**Dismissed**:
A Film the Member asked not to be suggested again.
_Avoid_: Hidden, not interested

## Diary and Lists

**Viewing**:
One dated time a Member watched a Film, with an optional Rating, review, and tags.
_Avoid_: Watch event, log, diary entry

**Diary**:
A Member's Viewings in date order.

**List**:
A named, ordered set of Films a Member curates.
_Avoid_: Collection, shelf

**Ranking**:
A List whose order is the Member's preference order.
_Avoid_: Top list

## Watching tonight

**Region**:
The country whose streaming catalogue applies to a Member.
_Avoid_: Locale, country (in code)

**My services**:
The streaming services a Member subscribes to. When empty, every subscription service counts.
_Avoid_: Providers (in conversation)

**Tonight picks**:
A short set of Films suggested for right now, each with a reason, that respect the Member's constraints.
_Avoid_: Recommendations (for this feature)
