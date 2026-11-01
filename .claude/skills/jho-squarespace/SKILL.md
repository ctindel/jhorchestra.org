---
name: jho-squarespace
description: Operate the Jackson Heights Orchestra Squarespace 7.1 site through Claude in Chrome, because Squarespace has no usable API for this. Covers sign-in, the backup-first rule, safe editing of pages, code injection, the Asset Library and Events, and browser tool quirks. Use for any change to the live JHO website.
---

# jho-squarespace

Changes the live JHO website (`bamboo-crow-nkt9.squarespace.com`, no custom domain yet) through the
browser, using the `mcp__claude-in-chrome__*` tools. Every change is a UI action.

For one concert end to end, use `jho-squarespace-concert`, which depends on this skill.

## Reference

| File | Contents |
| --- | --- |
| `reference/site-map.md` | Admin navigation, pages, code injection, home hero, Asset Library folders and naming |
| `reference/ui-recipes.md` | Page blocks, Fluid Engine grid, Event Settings, location, assets, text quirks |
| `reference/data-model.md` | Event fields, JSON endpoints, venue table, known data issues, the `jho-data` block (per-event links) |
| `tools/backup-receiver.py` | Local file receiver used by the backup |

## 1. Open the admin

Admin URL: https://bamboo-crow-nkt9.squarespace.com/config/

1. Call `list_connected_browsers`. Show the list and ask the user which browser to use. Never pick one
   without the user's confirmation. Then call `select_browser`.
2. Ask the user to confirm that this browser profile is signed in as `chad.tindel@jhorchestra.org`.
3. Open the admin URL in a **new tab**. Do not reuse a tab the user has open.
4. Wait 3 to 5 seconds before the first screenshot. Routes such as `/config/pages` render blank for about 2 seconds.
5. Check the URL and page text. If it is the sign-in page (sign-in or login text), **stop**. Tell the user to
   sign in in that browser. Poll with a screenshot about every 15 seconds for a few minutes. Never type credentials.

## 2. Safety rules

- **Back up first.** Run section 3 before any edit session.
- **Know when each change saves.** Event Settings and Asset Library moves and renames save at once.
  Page-editor changes save only when you press **Save** (top left of the editor).
- **Verify every change** after it saves. Fetch the public JSON or HTML from the admin tab (same origin)
  and compare. Report what was verified and what was not.
- **No deletes.** Never delete an event. Set its status to Draft. Do not press Remove on a section, and
  do not press the trash icon unless the user asked for that block to go.
- **Event Settings:** never press Escape inside the dialog. It opens a discard-changes confirm
  (Cancel or Discard). Save with the dialog's SAVE button.
- **No cmd+a** outside a text input. It selects the whole page.
- **Borrowed dialogs.** A link dialog opened from a page editor to upload a file: close with **Exit**. Never
  **Save** that page (`reference/ui-recipes.md`, Upload a PDF through a link dialog).
- **Stop the receiver** (section 3) when the backup finishes. It accepts POSTs from any page.

## 3. Backup (before any edit)

Backups are for reference only. Squarespace has no import for events or code, so a restore is manual.

1. Start the receiver in the background, from the repo root:

   ```bash
   python3 .claude/skills/jho-squarespace/tools/backup-receiver.py "$(pwd)/squarespace-backup"
   ```

   It listens on `127.0.0.1:8765` and writes under `squarespace-backup/` (gitignored).

2. From the admin tab, run a script that `fetch()`es each item and POSTs it to `http://127.0.0.1:8765` as
   `{"path": "<YYYYMMDD>/<name>", "text": "..."}` (or `"b64"` for binary). Items:
   - Public pages, each as `?format=json` and as HTML: `/`, `/about`, `/join`, `/media`, `/schedule`,
     `/archives`, `/contact`, `/donate`, `/concert`, `/shop`, `/concerts`.
   - Every event: `/concerts/<urlId>?format=json`. Take the `urlId` values from `upcoming[]` and `past[]`
     in `/concerts?format=json`.
   - Code Injection contents, from `/config/pages/code-injection`: header and footer, read with
     `document.querySelectorAll('.CodeMirror')[i].CodeMirror.getValue()`.
   - Custom CSS, from `/config/pages/custom-css`, the same way.
   - Asset inventory: scroll the Asset Library and collect the `img` `src` URLs.
3. Give every `fetch()` an `AbortController` timeout. The first time, Chrome may show a local-network-access
   prompt, and the fetch hangs until the user clicks Allow. Tell the user and wait.
4. Check the files written against the list. Report any item that failed.
5. Stop the receiver.

Output folder: `squarespace-backup/<YYYYMMDD>/`.

## 4. Tool quirks

- **Coordinates.** Screenshots are 1568 px wide, but `window.innerWidth` may be about 1706. Scale
  `getBoundingClientRect()` values by `1568 / innerWidth` before clicking.
- **`browser_batch`** accepts only these actions: `hover`, `left_click`, `type`, `key`, `wait`, `scroll`,
  `zoom`, `double_click`, `left_click_drag`, `screenshot`. Use `find` as a separate call to locate elements.
- **Fluid Engine editor.** Click a block to select it first. Arrow keys and drag handles do nothing until then.
- **Hidden file inputs.** Use `find` to locate the `button type=file` input, then `file_upload`. The file
  must be under a path the session may read, such as the scratchpad directory.
- **Output filter.** Fetch output with `?`, `=` or `&` sequences may be blocked. Replace those characters
  before returning large script text.

## 5. Related

- `reference/site-map.md`, `reference/ui-recipes.md`, `reference/data-model.md`: read before editing.
- `jho-squarespace-concert`: publish or update one concert.
- Concert content of record is in the repo: `content/en/post/<YYYYMMDD>-concert.md` and `content/en/schedule.md`.
