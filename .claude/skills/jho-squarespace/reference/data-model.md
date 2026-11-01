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
- **Verified result:** Archives lists the 11 real past concerts, with Program PDF, Recording and YouTube links on
  the six events above.

## Known data issues fixed on 2026-10-31 (VERIFIED)

- The December concert is Wednesday 2026-12-09 (slug `20261209`), and its pin was fixed.
- Three mis-dated duplicate events were set to Draft: slugs `event-two-w7zrh-s4xbg-zj87b`,
  `event-four-d2wwk-ea5hc-sh3gd`, `dvok-the-new-world`.
- Eleven events were given real venue names, addresses and pins.
- The end date of `20231212` was fixed.
- Footer address typo fixed: "P.O. Boe 881 / Jackaon Helghts" is now "P.O. Box 881 / Jackson Heights".

Open items:
- Historic event end times are Squarespace defaults (about 11 PM). Not verified.
- Four concerts on the Hugo site have **no Squarespace event yet**: `20230315`, `20230517`, `20230702`, `20250706`.

## Source of truth in the repo

- `content/en/post/<YYYYMMDD>-concert.md`: the concert text, program and venue.
- `content/en/schedule.md`: the schedule.
- Per-concert poster and social assets render to `pr/<YYYYMMDD>_Concert/` through the other `jho-*` skills.
  The Squarespace skills upload from there; they never generate assets.
