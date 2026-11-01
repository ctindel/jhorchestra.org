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

30 events from the sheet, all published, slugs `/concerts/<YYYYMMDD>` (VERIFIED 2026-10-31):

`20120313 20121212 20130515 20131218 20140312 20140514 20141210 20150311 20150513 20151209 20160316 20160518
20161214 20170315 20170517 20171213 20180203 20180314 20180516 20181215 20190209 20190313 20190515 20191211
20211215 20220309 20220511 20221214 20230315 20230517`

Each event has a venue and map pin, a body with Program and Soloists text, and a `jho-data` Code block. Each event
has `publishOn` = `startDate`, which the footer's paging depends on (`../../jho-squarespace/reference/data-model.md`,
"Pagination of past events").

## Assumptions

| Item | What was done | Status |
| --- | --- | --- |
| Start time | 7:30 PM, except 20180203, 20181215 and 20190209 at 4:00 PM | **Verified** against the program PDF of each concert (30 of 30 read). The sheet itself has no times. |
| End time | Start + 2 hours | **Choice.** The sheet has no end time. |
| Titles | Generated. December = "Holiday Concert", February = "Winter Concert", otherwise "Spring Concert". Prefixed "Jackson Heights Orchestra — " | Generated, not from the programs |
| Excerpts | Generated from conductor, soloists and the first four works | Generated |
| Pat Glunt | Shown as "Patricia Glunt" | Changed |
| Raffle entries | Entries containing "raffle" in the conductor column were dropped from the conductor list | Changed |
| Typos | Fixed "MIniatures", "Wanger", "Basoon". Other source spellings kept | Changed |
| Images | No posters exist for these events, so the cards have no image | Fact |
| Program PDFs | 30 PDFs from the Drive folder uploaded to Squarespace file storage as `<YYYYMMDD>_JHO_Program.pdf`; each event's `jho-data` has `programPdf` = `/s/<file>` | **Done 2026-10-31.** Mapped by the concert date printed in each PDF, not by program number. The 2020-03-11 program (canceled) is not uploaded. 2015-03-08 (St. Joseph's, 5 PM) is listed in the 2015 program but is not in the sheet and has no event. |

## Venues

Addresses and pins were verified before use.

| Venue | Address | Pin (lat, lng) |
| --- | --- | --- |
| Community United Methodist Church | 81-10 35th Avenue, Jackson Heights, NY 11372 | 40.7515612, -73.8855315 |
| St. Mark's Episcopal Church | 33-50 82nd Street, Jackson Heights, NY 11372 | 40.754, -73.8855 (existing pin reused) |
| St. Joseph's Roman Catholic Church | 43-19 30th Avenue, Astoria, NY 11103 | 40.762681, -73.9118015 |
| P.S. 69Q – The Jackson Heights School | 77-02 37th Avenue, Jackson Heights, NY 11372 | 40.7489118, -73.8884855 |

## Added after the first import (VERIFIED 2026-10-31)

- `20150308`, 5:00 PM, St. Joseph's RC Church, Astoria: listed with its own time and venue in the 2015 program. Same
  program and soloist as 20150311 (Julia Meynert, Mozart Violin Concerto No. 5), so it reuses that event's text and PDF.
- `20220703`, 6:00 PM, Travers Park: announced in the May 2022 program. No conductor or program is known, so none is shown.
- `20230702`, 6:00 PM, Travers Park: conductor "Alicia Lieu (guest conductor)", from the Dec 2022, Mar 2023 and May 2023 programs.
- `20250706` has no conductor source and shows none.

Total: 45 past events. Publishing resets `publishOn`, so set `publishOn` = `startDate` again after setting `workflowState` to 1.

Announced-only Travers Park concerts were created as **drafts** (not public), because no program, soloist or conductor is
known and nothing confirms they took place: `20140706` (3:30 PM), `20150705` (4:00 PM; the 2015 programs say 3:00 and
4:00, the later one was used), `20160703`, `20170702`, `20180701` (all 4:00 PM). Publish a draft only after the owner
confirms it. Also drafts: `20140504` (1:00 PM; program 4 says 2:00 PM, later programs 1:00 PM) and `20150502` (6:30 PM) at
Queensborough Community College, 222-05 56th Avenue, Bayside, NY 11364 (address from qcc.cuny.edu; the map pin
40.7556, -73.7574 is from one unverified source, check it before publishing; the hall is not named). Not created: 2020-07-04/05 (canceled). No program states an end time, so every end time is start + 2 hours.

## Per-work notes (VERIFIED 2026-10-31)

The sheet's Notes column (premieres, arrangers, commissions) is now on the pages as a parenthetical after the work in the
Program list, for the 15 concerts that have notes (for example "Tango for Orchestra (World premiere)"). The 2020-03-11
"canceled - Covid" notes and the 2023-12-12 Nutcracker note are not applied. The `.psv` keeps notes per concert, not per
work; the per-work mapping came from the xlsx.

## Troubleshooting

- **A historical concert is missing from the Archives:** check that its `publishOn` equals its `startDate`, and that the
  footer patch is in place. See `data-model.md`, "Pagination of past events".
- **A start time is wrong:** the 7:30 PM start is an assumption. Correct the event in Event Settings once the real
  time is known.
