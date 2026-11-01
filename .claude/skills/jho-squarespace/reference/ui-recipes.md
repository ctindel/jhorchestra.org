# UI recipes (VERIFIED unless noted)

Each recipe assumes section 4 of `SKILL.md` (coordinate scaling and tool limits).

## Edit a page block

1. Pages panel: click the page. Press **Edit** (top left).
2. Click the block. Use its toolbar:
   - **pencil**: opens Content, Design and Animation tabs. The Content tab has Text and Link fields.
   - **link icon**: sets the block's link.
   - **trash**: deletes the block. Confirm it is the block you mean.
3. Link field: type a page name to find an internal page. For example, type `contact` and pick `/contact`.
4. Press **Save** (top left) when done. Changes are not saved before that.

## Fluid Engine grid

- The home hero grid has **12 columns** of about 50 px with 10 px gaps. One column step is 60 px.
- **Resize:** drag the block's handles.
- **Move:** first click the block to select it. Then either drag its body, or press an arrow key. Each press
  moves 1 column (left or right) or 1 row (up or down).

## Event Settings

Path: Concerts page, then the list (dropdown: Upcoming Events or Past Events). Then either:
- "..." on the row, then **Settings**, or
- click the row, then **Edit**.

Tabs and fields:

| Tab | Fields |
| --- | --- |
| Content | Date and Time (Event Start and Event End tabs, each with a calendar and a time); Featured image; Excerpt; Event URL slug (`/concerts/<slug>`, field "Event URL", near the bottom, scroll to it; changing it makes the old URL 404); Author; Source URL; Duplicate; Delete (never press) |
| Options | Status: Draft, Needs Review, Published, Scheduled. Tags. Categories. Comments. Featured. |
| SEO | Page SEO fields |
| Social Image | Social image |
| Share | Sharing settings |
| Location | Business Name, Address, City State Zip, Country, map |

- **Save:** the dialog's **SAVE** button (top left). Event Settings take effect at once; the page Save is not needed.
- **Never press Escape** in the dialog. It opens the discard-changes confirm (Cancel or Discard).
- **Calendar quirk:** moving an end date far back needs many clicks on the previous-month arrow.
- **Draft:** Options tab, Status: tick **Draft**, then **SAVE**. Draft events leave the public lists
  (`/concerts?format=json`) and stay visible to the logged-in admin.

## Location recipe

Use this for every event with a venue. Venues and addresses are in `data-model.md`.

1. Location tab, **Business Name**: type the venue name.
2. **Address**: type the street address. Click the first Google suggestion that matches the right city.
   **Do not press Escape.** Clicking the suggestion sets the map pin and overwrites line 2 with
   `Queens, New York, <zip>`.
3. Retype line 2 as `<Neighborhood>, NY <zip>` (for example `Jackson Heights, NY 11372`).
4. Verify with the JSON: `item.location.markerLat` and `markerLng` (Jackson Heights is about 40.754, -73.88).
   Other venues (Astoria, East Elmhurst, Forest Hills) have their own pins; check them against the map.
   A default pin of 40.7208, -74.0008 means the address did not geocode (lower Manhattan). It is always wrong for JHO.

## Add the jho-data block to an event (VERIFIED)

Format and keys: `data-model.md`, "Per-event extra links". The JSON comes from `jho-squarespace-concert/jho-data/<YYYYMMDD>.json`.
Take a screenshot before each click; positions vary.

1. Concerts page: the event row, then **Edit**. This opens the event editor.
2. Hover the top edge of the poster image block in the body. A small **+** appears just above it. On a 1568 px
   screenshot it is at about y=367 for most events, and about y=181 for `20231212`.
3. Click **+**. Type `code` in the block search. Click the **Code** result. Its position varies.
4. A Code block with `<p>Hello, World!</p>` appears. A side panel opens with an HTML editor.
5. Click into the editor. Press Cmd+A, then type exactly one line:
   `<script class="jho-data" type="application/json">{...compact JSON...}</script>`
   - Straight double quotes are JSON syntax, so keep them around keys and values. Inside a value's text, use
     curly quotes or leave the quotes out.
   - Do not press Escape.
   - The editor shows "Script Disabled / Embedded scripts" while you edit. This is normal.
6. Click **Save** (top left). For a **Draft** event, the button beside it is **PUBLISH**. Never click it.
7. Verify (`jho-squarespace-concert` section 6, item 2). From the admin tab, fetch `/concerts/<slug>`, parse it
   with DOMParser, and use `querySelector('script.jho-data')`. Do not search the text for "jho-data": the footer's
   own script contains that text. Then `JSON.parse` the element's text.

**Remove a block:** select it, press the trash icon in its toolbar, then **Save**. Only when the user asks.
Removing the block removes the element from the page.

## Non-breaking space in button text (VERIFIED)

The hero "Upcoming Concert" text needs a real U+00A0. A space typed, or Alt+Space, gives an ordinary space.
Set the value from JavaScript instead. Use the native setter, then fire `input` and `change`:

```js
const el = document.querySelector('<selector for the field>');
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
setter.call(el, 'Upcoming\u00A0Concert');
el.dispatchEvent(new Event('input', {bubbles: true}));
el.dispatchEvent(new Event('change', {bubbles: true}));
```

Check the result afterwards from the page's HTML, not the editor.

## Asset Library

- **Open:** `/config/asset-library`. Folder URLs: `/config/asset-library/folders/<uuid>`.
- **Search:** the search box is global. It finds files inside folders and folders by name. If a search
  matches a folder name, Select All includes that folder. Deselect it before a bulk move.
- **Tile menu:** hover a tile. A checkbox shows at the top left. A "..." button shows at the top right with:
  File details, Rename, Move to, Edit with AI, Reshoot, Delete (avoid Delete).
- **Bulk bar:** after you select a tile, a bottom bar shows "N SELECTED" with a dropdown (Select All, Deselect All),
  a Move-to icon (folder) and a trash icon (avoid).
- **Move to:** the dialog navigates folders. Click a folder row to open it (the breadcrumb shows the path).
  Then press **Move Here**.
- **Rename:** the dialog edits the name without its extension. Some names store spaces as `+`; check the result.
- **Upload:** find the hidden `button type=file` input, then `file_upload` (section 4 of `SKILL.md`).
- **Duplicate names** are allowed. Check for them before you upload a file that may already exist.
- **Verify:** after a move or upload, reload the folder and check the file is there.
- **PDFs are rejected:** the Asset Library shows "File must be JPG, PNG, GIF, MP4, MOV...". Use the link dialog below.

## Upload a PDF through a link dialog (VERIFIED)

1. Open a page in the page editor (**Edit**) that has a button block. Select the button block.
2. Click the link icon.
3. Change the **URL** dropdown to **File**. The list **UPLOADED FILES** shows the stored files.
4. Use `find` to locate "upload button (arrow-up icon) next to Search files in link editor". Call `file_upload`
   on that ref.
5. The file is served at `/s/<filename>`, which redirects to `static1.squarespace.com/static/<siteid>/t/<id>/<ts>/<filename>`.
5a. The input takes **one file per `file_upload` call**. A call with several paths uploads only the first. Calls under 10 MB
   each. Several calls can be sent in one turn. Afterwards list the stored names from the dialog DOM to check them, and
   `fetch('/s/<name>',{method:'HEAD'})` from the admin tab: 404 means not stored, a CORS error means it redirects (stored).
6. Click **Exit**. **Never Save** the page you borrowed the dialog from. No prompt appeared when exiting.

## Edit the footer text (VERIFIED)

The footer is a global section. Edit it from any page editor.

1. Click the footer text. It is a text block inside an iframe.
2. Double-click a word to select it, then retype it.
3. Press **Save** (top left), as for any page-editor change.

## Preview a page (VERIFIED)

Logged-in requests to public URLs redirect to the admin. Check the rendered page in the editor's preview instead.

1. Pages panel (`/config/pages`): click the page.
2. Top right, click the ▷ **Preview** button.
3. The page renders inside an iframe. Search every `iframe`'s `contentDocument` for `[data-jho]`.
4. Close the preview with the X at the top right.

## Bulk-create events through the admin API (VERIFIED 2026-10-31)

Used for the 30 historical events, instead of 30 UI rounds. Run from the logged-in admin tab, so the session cookies
are sent. Shapes: `data-model.md`, "Admin API shapes". One concert is still done in the UI (`jho-squarespace-concert`).

1. **Template.** Make one draft event with two blocks, a text block and a Code block. Note its id.
2. **Headers** for every call: `X-CSRF-Token` = the value of the `crumb` cookie, and `Content-Type: application/json`.
3. **Clone:** `POST /api/content/copy/item?sourceId=<templateEventId>&copyWorkflowState=4`. Keep the returned `id` and
   `collectionId`. The copy is a draft.
4. **Read:** `GET /api/content/calendars/<collectionId>/events/<id>` right before editing.
5. **Edit** the item: `title`, `urlId` (`YYYYMMDD`), `startDate`, `endDate`, `structuredContent` dates, `location`,
   `excerpt`, body blocks, `assetUrl` (`''` for no image), and `publishOn` = `startDate`.
6. **Write:** `PUT` the same URL with the full item. A stale body returns an empty 400, so repeat step 4 first.
7. **Verify** each draft at `/concerts/<slug>?format=json`. Publish only after the check, by setting `workflowState`
   to 1.

Rules: never put raw `<script>` text in `excerpt`. Never delete an event; set `workflowState` to 4 (Draft) instead.
