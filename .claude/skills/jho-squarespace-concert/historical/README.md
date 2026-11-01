# Historical concerts (2012–2023)

Record of the past concerts imported to the Squarespace site on 2026-10-31. The publish steps in `../SKILL.md`
do not use these files.

## Files

- `repertoire-history.psv`: 30 concerts, one per line, pipe-separated:
  `date|season|venue|conductor(s)|soloist(s)|notes|Composer:Work~Composer:Work`

## Source

- Google Drive folder "Programs - PG Archive" (under Leadership_Committee_Shared, owner `ctindel`, in the
  jhorchestra.org Drive). It holds the JHO program PDFs and the sheet `JHO repertoire history.xlsx`.
- The sheet has 160 rows and 35 date groups (2012-03-13 to 2024-05-15). Columns: Composer, Work, Season, Concert
  date (YYYY-MM-DD), Soloist, Conductor, Venue, Notes.
- Exported as CSV read-only, through the Sheets export URL in the browser, and saved as `repertoire-history.psv`.
- No file named "manifest" exists. This sheet is the nearest match.

## Excluded

- `2020-03-11`: canceled (COVID).
- The undated Dvorak 8 row.
- Concerts already on the site, 2023-12-12 onward.

## Events created

30 events, all published, slugs `/concerts/<YYYYMMDD>` (VERIFIED 2026-10-31):

`20120313 20121212 20130515 20131218 20140312 20140514 20141210 20150311 20150513 20151209 20160316 20160518
20161214 20170315 20170517 20171213 20180203 20180314 20180516 20181215 20190209 20190313 20190515 20191211
20211215 20220309 20220511 20221214 20230315 20230517`

Each event has a venue and map pin, a body with Program and Soloists text, and a `jho-data` Code block. Each event
has `publishOn` = `startDate`, which the footer's paging depends on (`../../jho-squarespace/reference/data-model.md`,
"Pagination of past events").

## Assumptions

| Item | What was done | Status |
| --- | --- | --- |
| Start time | 7:30 PM for every event (America/New_York) | **Assumption.** The sheet has no times. The 2023-12-12 concert actually started at 7:00 PM. |
| End time | Start + 2 hours | **Choice.** The sheet has no end time. |
| Titles | Generated. December = "Holiday Concert", February = "Winter Concert", otherwise "Spring Concert". Prefixed "Jackson Heights Orchestra — " | Generated, not from the programs |
| Excerpts | Generated from conductor, soloists and the first four works | Generated |
| Pat Glunt | Shown as "Patricia Glunt" | Changed |
| Raffle entries | Entries containing "raffle" in the conductor column were dropped from the conductor list | Changed |
| Typos | Fixed "MIniatures", "Wanger", "Basoon". Other source spellings kept | Changed |
| Images | No posters exist for these events, so the cards have no image | Fact |
| Program PDFs | Not attached. Not mapped to dates | **Open** |

## Venues

Addresses and pins were verified before use.

| Venue | Address | Pin (lat, lng) |
| --- | --- | --- |
| Community United Methodist Church | 81-10 35th Avenue, Jackson Heights, NY 11372 | 40.7515612, -73.8855315 |
| St. Mark's Episcopal Church | 33-50 82nd Street, Jackson Heights, NY 11372 | 40.754, -73.8855 (existing pin reused) |
| St. Joseph's Roman Catholic Church | 43-19 30th Avenue, Astoria, NY 11103 | 40.762681, -73.9118015 |
| P.S. 69Q – The Jackson Heights School | 77-02 37th Avenue, Jackson Heights, NY 11372 | 40.7489118, -73.8884855 |

## Not created

- Travers Park, `2023-07-02` and `2025-07-06`: no sheet data, or the conductor is not verified. Create them only
  after the data is checked.

## Troubleshooting

- **A historical concert is missing from the Archives:** check that its `publishOn` equals its `startDate`, and that the
  footer patch is in place. See `data-model.md`, "Pagination of past events".
- **A start time is wrong:** the 7:30 PM start is an assumption. Correct the event in Event Settings once the real
  time is known.
