---
name: jho-squarespace-concert
description: Publish or update ONE Jackson Heights Orchestra concert on the Squarespace site, end to end (event, poster and program assets, location, verification). Depends on jho-squarespace for sign-in, backup and safety rules. Use when asked to add, publish or update a concert on the website.
---

# jho-squarespace-concert

Publishes or updates one concert on the live site. **Read `.claude/skills/jho-squarespace/SKILL.md` first**
and follow its sign-in, backup and safety rules. This file adds only the concert steps.

**Never delete an event. Set it to Draft instead.**

## 1. Intake

Ask for anything missing. Never guess.

- **Date and weekday.** Check the weekday against the date. If it differs from the stated weekday, **stop and
  ask**. This is the same rule as `jho-concert-poster`.
- **Program and title.** Title form: "Jackson Heights Orchestra — <Program>".
- **Excerpt.** Short, from the user or from `content/en/post/<YYYYMMDD>-concert.md`.
- **Venue.** Look it up in the venue table in `jho-squarespace/reference/data-model.md`. If it is not there,
  ask for the official street address. Do not guess an address.
- **Start and end time.** Set both. Historical events use an assumed 7:30 PM start and end 1 hour later (concerts are always 1 hour)
  (see "Historical events" and `historical/README.md`).
- **Publish or Draft.** Default is Draft. Publishing is visible to the public, so confirm with the user unless
  the request already said to publish.

## 2. Backup

Run the backup in `jho-squarespace/SKILL.md` section 3. Confirm the files were written before you edit.

## 3. Assets

- **Poster:** the PNG from `pr/<YYYYMMDD>_Concert/`, made by `jho-concert-poster`.
- **Program PDF,** if the concert has one: from the same folder. The Asset Library rejects PDFs, so upload it
  through a link dialog (`jho-squarespace/reference/ui-recipes.md`, Upload a PDF). It is served at `/s/<filename>`.
  Name it `<YYYYMMDD>_JHO_Program.pdf`. Its path goes in the `programPdf` key (section 5).
- **Upload** images to Asset Library `concert/<YYYYMMDD>/`. Create the folder if it does not exist.
- **Name** each file `<YYYYMMDD>_JHO_<Thing>.<ext>` (for example `<YYYYMMDD>_JHO_Poster.png`). Rename after upload
  if needed (see `ui-recipes.md`, Asset Library).
- **Verify** the files are in the folder after upload.

## 4. Create or edit the event

**Create:** Concerts page, then **+**. **Edit:** Concerts page, the row, then "..." and **Settings**, or click the
row and press **Edit**.

Set, in Event Settings:

1. Title.
2. Date and Time: Event Start and Event End.
3. Location, with the Location recipe in `ui-recipes.md`. Check the pin.
4. Excerpt.
5. Featured image, from the library.
6. Event URL slug: `YYYYMMDD`.
7. Body: the poster image block, from the library. Then the `jho-data` block (section 5), above the poster.
8. Status (Options tab): **Draft**, unless the user confirmed publishing. Then **Published**.

Save with the dialog's **SAVE**. It takes effect at once.

## 5. The `jho-data` block

Per-event links (program PDF, recording, podcast, tickets) go in a Code block in the event body, as one
`<script class="jho-data">` line. Keys and rendering: `jho-squarespace/reference/data-model.md`. Steps:
`jho-squarespace/reference/ui-recipes.md`, "Add the jho-data block to an event".

- `season` is always `YYYY–YYYY` (four-digit years, EN DASH), for example `2017–2018`. Never `2017–18`.
- The source is `jho-data/<YYYYMMDD>.json` (see `jho-data/README.md`).
- **Applied:** 20231212, 20240313, 20240515, 20241211, 20250319, 20260520. The other files are stored, not applied.
- To change an applied block, remove it (ui-recipes, "Remove a block") and add the new one.
- Verify the block (section 6, item 2).

## 6. Verify

Check in this order. Report each item as verified or not verified.

1. Item JSON, `/concerts/<YYYYMMDD>?format=json`: `urlId` (slug) is `YYYYMMDD`, `startDate` is the concert date,
   `location` has `markerLat` about 40.754 and `markerLng` about -73.88 for Jackson Heights, and `title`,
   `excerpt` and `assetUrl` are set. In `/concerts?format=json`, the event is in `upcoming[]` (future) or
   `past[]` (past). For a published event, `workflowState` is 1.
2. `jho-data` block, if the event has one: `script.jho-data` is present in the rendered event page, and its
   text parses as valid JSON (ui-recipes, "Add the jho-data block", step 7).
3. Archives (past events only): in the preview (ui-recipes, "Preview a page"), the event shows in
   `data-jho="archive"`, with its Program PDF, Recording and YouTube links where the block has them.
4. Schedule (`/schedule`) and Home (`/`), in the preview: the concert shows in `data-jho="schedule"`, and in
   `data-jho="upcoming"` on Home if it is among the next three.
5. For a Draft: the event is **absent** from the public lists and **present** in the admin.
6. **Season check.** Every published event needs a `jho-data` block with a `season` (the footer's fallback label is
   two-digit, `2025–26`, and would split the Archives group). Years are always four digits.
   - `season` must match `^\d{4}–\d{4}$` (EN DASH U+2013), end = start + 1, and equal the season computed from the
     event date in New York time (month >= 9: year to year+1, else year-1 to year).
   - After any add or edit, list the distinct labels from the admin tab and **fail** if any label is non-canonical, if
     two labels differ only by format, or if an event has no season. Console snippet (admin tab):

     ```js
     const cid='6a7952feaa0a3f0876d04511'; let all=[],st=null;
     do{const j=await(await fetch(`/api/content/calendars/${cid}/events`+(st?`?start=${st}`:''))).json();all=all.concat(j.results);st=j.hasNextPage?j.nextPageStart:null}while(st);
     const exp=ms=>{const [y,m]=new Date(ms).toLocaleDateString('en-CA',{timeZone:'America/New_York'}).split('-').map(Number);return m>=9?`${y}–${y+1}`:`${y-1}–${y}`};
     const rows=[];for(const e of all){const j=await(await fetch(`/api/content/calendars/${cid}/events/${e.id}`)).json();const it=j.item||j;
       if(it.workflowState!==1)continue;let s=null;const w=o=>{if(o&&typeof o==='object'){if(o.value&&typeof o.value.html==='string'&&o.value.html.includes('jho-data'))s=JSON.parse(o.value.html.match(/\{[\s\S]*\}/)[0]).season;Object.values(o).forEach(w)}};w(it.body);
       rows.push({slug:it.urlId,s,want:exp(it.startDate)})}
     rows.filter(r=>r.s!==r.want||!/^\d{4}–\d{4}$/.test(r.s||''))  // must be []
     ```

   - Repo files: `node .claude/skills/jho-squarespace-concert/check-seasons.mjs` (validates `jho-data/*.json`; tests:
     `node --test .claude/skills/jho-squarespace-concert/check-seasons.test.mjs`).

## 7. Post-concert updates

Use the same flow on the existing event. Put the links in the event's `jho-data` file and apply it (section 5):
`programPdf` (section 3 for the upload), `recordingYouTube`, `podcastYouTube`, `podcastSpotify`, `tickets`.
Then verify (section 6).

## Historical events

Source: the Drive folder "Programs - PG Archive" (under Leadership_Committee_Shared, owner `ctindel`, in the
jhorchestra.org Drive), which holds the program PDFs and the sheet `JHO repertoire history.xlsx`. The sheet was
exported read-only to `historical/repertoire-history.psv`. No file named "manifest" exists; this sheet is the
nearest match and was used. (VERIFIED 2026-10-31)

- **Created:** 30 events, 2012-03-13 to 2023-05-17, slugs `/concerts/<YYYYMMDD>`, all published. Each has a
  7:30 PM start (an assumption), a venue and pin, a Program/Soloists body and a `jho-data` Code block.
- **Not created:** 2020-03-11 (canceled, COVID), the undated Dvorak 8 row, concerts already on the site
  (2023-12-12 onward), and the Travers Park concerts 2023-07-02 and 2025-07-06 (no sheet data or unverified
  conductor).
- **Program PDFs:** not attached. They are not mapped to dates.
- **Assumptions, venues and pins:** `historical/README.md`.
- **Pagination:** each historical event has `publishOn` = `startDate`, and the footer loader was patched. New
  events must follow this too (`jho-squarespace/reference/data-model.md`, "Pagination of past events").
- The `jho-data` blocks on historical events are not in the "Applied" list above, which covers only the
  per-concert `jho-data/` files. The two sources are not compared here.
- YouTube links come only from `content/en/media.md`. Never guess a link.

## Final checklist

- [ ] Weekday matches the date
- [ ] Venue is from the table, or the user gave the address
- [ ] Backup written, and the receiver stopped
- [ ] Assets in `concert/<YYYYMMDD>/`, named `<YYYYMMDD>_JHO_<Thing>.<ext>`
- [ ] Event slug is `YYYYMMDD`; title, excerpt, dates and times set
- [ ] Location pin checked
- [ ] Featured image and poster block set; `jho-data` block applied and valid, if the event has a file
- [ ] Status is Draft, or Published with the user's confirmation
- [ ] Verified in the order of section 6: item JSON, `jho-data`, Archives preview (if past), Schedule and Home, Draft visibility
- [ ] Nothing deleted
- [ ] Report lists each verified item and each item not verified
