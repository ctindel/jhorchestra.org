# jho-data

One JSON file per concert, named `<YYYYMMDD>.json`, for the Squarespace footer script. Keys: `season`, `venue`, `conductor`, `program`, `soloists`, `recordingYouTube`, `podcastYouTube`, and `programPdf` (a `/s/<filename>.pdf` path, in 20231212, 20260520 and all 30 historical events 20120313 to 20230517). A key is left out when no source in the repo supports it. `tickets` is never written.

The footer renders buttons from `tickets`, `recordingYouTube`, `programPdf`, `podcastSpotify` and `podcastYouTube`. `season` and `venue` affect grouping and card text. `program`, `conductor` and `soloists` are stored, not rendered.

## Placement and status (VERIFIED 2026-10-31)

Each file goes in its event body as one `<script class="jho-data" type="application/json">` line, in a Code block above the poster. Steps: `jho-squarespace/reference/ui-recipes.md`, "Add the jho-data block to an event".

- **Applied:** 20231212, 20240313, 20240515, 20241211, 20250319, 20260520.
- **Stored, not applied:** every other file in this folder.
- **Program PDFs:** `20231212_JHO_Program_Book.pdf` (in Squarespace since Aug 2026) and `20260520_JHO_Program.pdf` (uploaded 2026-10-31; not yet confirmed as the final program).

## Sources

- Venue, program, soloists: the body of `content/en/post/<YYYYMMDD>-concert.md`, below the front matter.
- YouTube IDs: the headings in `content/en/media.md`, mapped as the brief specifies.
- Season: September to August. For example, 2025-03-19 is in `2024–25`.
- Conductor: `Alex Wen` for every concert, because no post names another conductor (see Conductor roles).

## Concerts

Role is the conductor's title for that season, from the brief. "Not stated" means the brief gives no role for that season.

| Date | Season | Venue | Conductor role | Keys present | Missing |
|---|---|---|---|---|---|
| 20230315 | 2022–23 | St. Mark's Episcopal Church | Not stated | season, venue, conductor, program (3) | soloists (none named), recordingYouTube, podcastYouTube (none in media.md) |
| 20230517 | 2022–23 | St. Mark's Episcopal Church | Not stated | season, venue, conductor, program (4) | soloists, recordingYouTube, podcastYouTube |
| 20230702 | 2022–23 | Travers Park | Not stated | season, venue, conductor, program (12) | soloists, recordingYouTube, podcastYouTube |
| 20231212 | 2023–24 | St. Mark's Episcopal Church | Interim Artistic Director | season, venue, conductor, program (12), recordingYouTube, programPdf | soloists, podcastYouTube |
| 20240313 | 2023–24 | St. Mark's Episcopal Church | Interim Artistic Director | season, venue, conductor, program (5), recordingYouTube, podcastYouTube | soloists |
| 20240515 | 2023–24 | St. Mark's Episcopal Church | Interim Artistic Director | season, venue, conductor, program (4), recordingYouTube, podcastYouTube | soloists |
| 20240707 | 2023–24 | Travers Park | Interim Artistic Director | season, venue, conductor | program (post lists none), soloists, recordingYouTube, podcastYouTube |
| 20241211 | 2024–25 | Trinity Lutheran Church | Interim Artistic Director | season, venue, conductor, program (3), podcastYouTube | soloists, recordingYouTube |
| 20250319 | 2024–25 | Lexington School | Interim Artistic Director | season, venue, conductor, soloists (1), program (3), podcastYouTube | recordingYouTube |
| 20250521 | 2024–25 | Trinity Lutheran Church | Interim Artistic Director | season, venue, conductor, program (3) | soloists, recordingYouTube, podcastYouTube |
| 20250706 | 2024–25 | Travers Park | Interim Artistic Director | season, venue, conductor | program (post lists none), soloists, recordingYouTube, podcastYouTube |
| 20251210 | 2025–26 | Lexington School | Artistic Director | season, venue, conductor, program (5) | soloists, recordingYouTube, podcastYouTube |
| 20260318 | 2025–26 | Our Lady Queen of Martyrs | Artistic Director | season, venue, conductor, program (2) | soloists, recordingYouTube, podcastYouTube |
| 20260520 | 2025–26 | Trinity Lutheran Church | Artistic Director | season, venue, conductor, program (3), programPdf | soloists, recordingYouTube, podcastYouTube |
| 20260705 | 2025–26 | Travers Park | Artistic Director | season, venue, conductor | program (post lists none), soloists, recordingYouTube, podcastYouTube |
| 20261209 | 2026–27 | Blessed Sacrament Church | Artistic Director | season, venue, conductor, program (4) | soloists, recordingYouTube, podcastYouTube |

Recordings: `recordingYouTube` is set for 20231212, 20240313 and 20240515 only. Podcasts: `podcastYouTube` is set for 20240313, 20240515, 20241211 and 20250319 (Episodes 3 to 6). Episodes 1 and 2 are not assigned to any concert, as the brief requires.

## Conductor roles

- Every file has `"conductor": "Alex Wen"` by the default rule. No post names another conductor, so no file has `Wenqi Li` or `Patricia Glunt`.
- Interim Artistic Director: 2023–24 and 2024–25. Artistic Director: 2025–26 onward. These roles are from the brief.
- The brief gives no role for the three 2022–23 concerts (20230315, 20230517, 20230702). `content/en/media.md` labels Patricia Glunt as "Founder/Artistic Director/Conductor" in the Episode 1 heading. The default rule may therefore be wrong for these three files. Confirm before publishing them.

## Parsing choices

- Lines in the form `Composer: Work` are split on the first `: `. The composer text is kept as written, including arranger credits: `arr. Hayman`, `arr. Custer`, `Vaughan Williams (/ arr. Greaves)`.
- Lines with no colon are kept whole as `work`, with no `composer` key. Examples: `Karelia Overture by Sibelius`, `Overture to Marriage of Figaro, Mozart K.492`, all 12 items of 20230702.
- `World Premiere: Divertissement for Violoncello and Orchestra, Stubblefield Opus 8a` (20230315) is kept whole. Its text before the colon is a label, not a composer.
- `Smetana, Ma Vlast: No. 2 Moldau` (20241211) is kept whole. Its text before the colon is a work title, not a composer.
- `Handel: Messiah: Hallelujah Chorus` (20231212) splits on the first colon only: composer `Handel`, work `Messiah: Hallelujah Chorus`.
- Curly quotes, apostrophes and accents are kept as the post body has them. In 20250319 the body uses curly quotes around `Toot Suite`, while the front-matter summary uses straight quotes. The body was used.
- `... and more!` (20251210) is kept as a `work` item. It is not a work title, so the footer may want to drop it.
- Soloist: 20250319 is the only post that names one, in its program line `featuring Julia Cohen on trumpet`. The entry is `Julia Cohen`, `trumpet`. The 20230315 cello piece names no soloist, so it has no `soloists` key.
- Venue is the body `Location:` line with the parking note removed: `Lexington School (Parking Lot is Available)` becomes `Lexington School`. `Blessed Sacrament Church (Parking Available)` becomes `Blessed Sacrament Church`. The "in Astoria" and "in Forest Hills" parts of the titles are not in the venue.
- Addresses appear in the posts but the schema has no address key, so no file has one.
- 20251210 and 20260318 contain a "Donations and Sponsorships" donorbox link. It is not mapped to any key and is not in the output.

## Extra links with no field

- May 15, 2024 Binaural Immersive ATMOS Recording files for Download (concert 20240515): https://drive.google.com/drive/folders/1hKwguWRi9amnl9GENufPBbaBsoqfmkYK?usp=sharing
- Sound Engineer Blogpost about recording the JHO in surround sound (concert 20240515): https://www.extralarge.nyc/writings/2024/6/11/from-stereo-to-immersive-a-case-study-in-modern-orchestral-recording

## Validity check

Ran `python3 -m json.tool` on each of the 16 files. Result: 16 passed, 0 failed. A second check confirmed each season matches `YYYY–YY` with an en dash, each file uses only schema keys, `programPdf` and `tickets` are absent, and each YouTube value starts with `https://www.youtube.com/watch?v=`.

## Posts whose program or soloists could not be parsed

- No program listed in the post, only a tagline: 20240707, 20250706, 20260705. These files have no `program` key.
- No soloist named: 20230315, 20230517, 20230702, 20231212, 20240313, 20240515, 20241211, 20250521, 20251210, 20260318, 20260520, 20261209, and the three posts above. Soloists were parsed only from 20250319.
- No parse failures in the programs that are listed. The judgment calls above are the only departures from the simple `Composer: Work` pattern.
