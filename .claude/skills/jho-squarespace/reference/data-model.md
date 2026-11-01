# Data model (VERIFIED unless marked UNVERIFIED or OPEN)

## Concerts are an Events collection

- Collection: `/concerts`, type `events-stacked`.
- Lists: `/concerts?format=json` has `upcoming[]` and `past[]`.
- One event: `/concerts/<urlId>?format=json`, with `item`:

| Key | Notes |
| --- | --- |
| `title` | Form: "Jackson Heights Orchestra — <Program>" |
| `urlId` | The slug. Convention: `YYYYMMDD` for the concert date (New York local date) |
| `startDate`, `endDate` | Milliseconds since epoch, UTC |
| `location` | `addressTitle`, `addressLine1`, `addressLine2`, `addressCountry`, `mapLat`, `mapLng`, `markerLat`, `markerLng`, `mapZoom` |
| `excerpt`, `body` | Excerpt and body HTML |
| `assetUrl` | Featured image |
| `workflowState` | 1 = published. Drafts leave the public lists but stay visible to the logged-in admin. |
| `structuredContent` | Squarespace structured fields |

Slug example: `/concerts/20261209` is the concert of 9 December 2026.

## Venues (addresses from the Hugo posts)

| Venue | Address |
| --- | --- |
| St. Mark's Episcopal Church | 33-50 82nd Street, Jackson Heights, NY 11372 |
| Travers Park | 76-09 34th Avenue, Jackson Heights, NY 11372 |
| Trinity Lutheran Church | 31-18 37th Street, Astoria, NY 11103 |
| Lexington School | 25-26 75th Street, East Elmhurst, NY 11370 |
| Our Lady Queen of Martyrs | 110-06 Queens Boulevard, Forest Hills, NY 11375 |
| Blessed Sacrament Church | 34-43 93rd Street, Jackson Heights, NY 11372 |

For a venue not in this table, ask the user for the official street address. Do not guess.

## Event editor

See `ui-recipes.md` (Event Settings, Location recipe). Status values: Draft, Needs Review, Published, Scheduled.

## Per-event extra links: the `jho-data` block (VERIFIED 2026-10-31)

- **Where:** a Code block in the event body, above the poster image block. Steps: `ui-recipes.md`,
  "Add the jho-data block to an event".
- **Format:** one line, `<script class="jho-data" type="application/json">{...}</script>`, with compact JSON.
- **Rendering:** the block is server-rendered in `/concerts/<slug>`. The footer script reads `script.jho-data`.
- **Keys:**

| Key | Effect on the rendered event card |
| --- | --- |
| `tickets` | "Get Tickets" button (archive and schedule cards) |
| `recordingYouTube` | "Recording" button |
| `programPdf` | "Program PDF" button. Value is a path such as `/s/<file>.pdf`; a leading `/` becomes the site origin |
| `podcastSpotify` | "Spotify" button |
| `podcastYouTube` | "YouTube" button |
| `season`, `venue` | Grouping, and card venue text (else the event's location title) |
| `program`, `conductor`, `soloists` | Read and stored. Not rendered |

- **Applied** to 20231212, 20240313, 20240515, 20241211, 20250319 and 20260520. The other files in `jho-data/`
  are stored but not applied.
- **Program PDFs** cannot go in the Asset Library. Upload them through a link dialog (`ui-recipes.md`).
  Stored: `20231212_JHO_Program_Book.pdf` (since Aug 2026) and `20260520_JHO_Program.pdf` (uploaded 2026-10-31;
  its identity as the final program is unconfirmed).
- **Verified result:** Archives lists 41 past concerts across 15 seasons after the historical import (VERIFIED
  2026-10-31; see "Pagination of past events"). Program PDF, Recording and YouTube links are on the six events above.

## Admin API shapes (VERIFIED 2026-10-31)

Called from the logged-in admin tab. Headers and the bulk recipe: `ui-recipes.md`, "Bulk-create events through the admin API".

- **Clone:** `POST /api/content/copy/item?sourceId=<templateEventId>&copyWorkflowState=4` returns `{id, collectionId, ...}`.
  The copy is a draft.
- **Read:** `GET /api/content/calendars/<collectionId>/events/<id>`. Concerts `collectionId` is `6a7952feaa0a3f0876d04511`.
- **Write:** `PUT` the same URL with the full item. Always PUT a freshly GET item. A stale body returns an empty 400.
- **Item body:** `{layout:{columns:12,rows:[{columns:[{blocks:[...]}]}]},raw:false}`.
- **Excerpt:** `{html:'<p class="" style="white-space:pre-wrap;">TEXT</p>',raw:false}`. Never put raw `<script>` text in it.
- **Code block:** `{type:1337, definitionName:'website.components.code', value:{html:<code>, wysiwyg:{engine:'code', mode:'htmlmixed', source:<code>, ...}}}`.
- **Text block:** `{type:1337, value:{html, source, engine:'wysiwyg', ...}}`.
- **Editable fields:** `title`, `urlId`, `startDate`, `endDate`, `structuredContent.startDate`, `structuredContent.endDate`,
  `location` (`addressTitle`, `addressLine1`, `addressLine2`, `markerLat`, `markerLng`, `mapLat`, `mapLng`), `excerpt`,
  body blocks, `assetUrl` (`''` for no image), `workflowState` (4 = draft, 1 = published), `publishOn`.

## Pagination of past events (VERIFIED 2026-10-31)

- `/concerts?format=json` returns 30 past events per page. Squarespace pages with `pagination.nextPageOffset`, which
  is keyed on each item's `publishOn`.
- **Rule:** every event must have `publishOn` = its `startDate`. Historical events were set this way. Set it on every
  new event too. Without it, older concerts stop appearing once there are more than 30 past events.
- **Footer patch** (Code Injection, Footer). The old loader paged with `start=`, which Squarespace ignores, so older
  concerts never appeared. The patched `loadConcerts`/`loadJSONPage`:
  - `loadJSONPage(start, offset)` appends `&offset=<offset>` to the URL.
  - `let offset=""` is declared before the loop.
  - After `extractEvents(json)`:
    `offset = (json && json.pagination && json.pagination.nextPage && json.pagination.nextPageOffset) ? json.pagination.nextPageOffset : "";`
  - The early-exit test is `if (!offset && events.length < CONFIG.pageSize)`.
- **Original footer:** `squarespace-backup/20261031/code-injection/footer.html` (gitignored).
- **Verified:** the Archives preview shows 41 past concerts across 15 seasons (2011–12 to 2025–26). There is no 2020–21
  season, because no concerts were held.

## Known data issues fixed on 2026-10-31 (VERIFIED)

- The December concert is Wednesday 2026-12-09 (slug `20261209`), and its pin was fixed.
- Three mis-dated duplicate events were set to Draft: slugs `event-two-w7zrh-s4xbg-zj87b`,
  `event-four-d2wwk-ea5hc-sh3gd`, `dvok-the-new-world`.
- Eleven events were given real venue names, addresses and pins.
- The end date of `20231212` was fixed.
- Footer address typo fixed: "P.O. Boe 881 / Jackaon Helghts" is now "P.O. Box 881 / Jackson Heights".

Open items:
- Historical events (2012–2023) start at an assumed 7:30 PM, with end = start + 2 hours. The start time is not in the
  source sheet and is not verified. See `jho-squarespace-concert/historical/README.md`.
- Travers Park concerts `20230702` and `20250706` exist as events (see the historical README). All 43 past events have `publishOn` = `startDate` (checked 2026-10-31). A PUT changes `startDate` only if `structuredContent.startDate` is set too.

## Source of truth in the repo

- `content/en/post/<YYYYMMDD>-concert.md`: the concert text, program and venue.
- `content/en/schedule.md`: the schedule.
- Per-concert poster and social assets render to `pr/<YYYYMMDD>_Concert/` through the other `jho-*` skills.
  The Squarespace skills upload from there; they never generate assets.
