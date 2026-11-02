# Site map (VERIFIED)

Public site: https://bamboo-crow-nkt9.squarespace.com (no custom domain yet).
Admin: https://bamboo-crow-nkt9.squarespace.com/config/

## Admin navigation

Home, Website (Pages, Styles, Assets, SEO / AI Visibility), Products & Services, Content & Memberships,
Scheduling, Donations, and others.

| Area | URL |
| --- | --- |
| Pages | `/config/pages` |
| Custom CSS | `/config/pages/custom-css` |
| Code Injection | `/config/pages/code-injection` (also: expand the collapsed "Custom Code" section at the bottom of the Pages panel) |
| Site Styles | `/config/site-styles` |
| Asset Library | `/config/asset-library` |
| Asset folder | `/config/asset-library/folders/<uuid>` |
| Event collection page | `/config/pages/6a7952feaa0a3f0876d04511` |

Site Styles: the Misc section has only Animations, Spacing and Image Blocks. Custom CSS is **not** there.
Use `/config/pages/custom-css`.

## Pages

- **Main navigation:** About, Join, Media, Schedule, Archives, Contact.
- **Not Linked:** Donate, Concerts (Events collection, `/concerts`), Home, concert (blog, empty), Shop (empty).
- **Deleted Pages** exists. Do not restore or purge from it without asking.

Public routes used by the backup and the verification steps: `/`, `/about`, `/join`, `/media`, `/schedule`,
`/archives`, `/contact`, `/donate`, `/concert`, `/shop`, `/concerts`.
When logged in, these redirect to the admin. To check a rendered page, use the preview (`ui-recipes.md`).

## Code injection

- **Header** (785 characters): the tab switcher script (ids `cs-tab-*`).
- **Footer** (about 56 KB): the JHO concert system. It is an IIFE guarded by `window.__JHO_CONCERT_SYSTEM_LOADED__`
  with `CONFIG = {collection: "/concerts", seasonStartMonth: 9, pageSize: 20, maxPages: 20, defaultUpcomingLimit: 3}`.
  It injects its own CSS and renders into these elements:
  - `data-jho="upcoming"` on the home page (`data-limit="3"`),
  - `data-jho="schedule"` on the Schedule page,
  - `data-jho="archive"` on the Archives page (with the season select `#jho-archive-season-select`).
  - Seasons run September to August, labelled like `2025–26`.
- **Custom CSS:** about 4.6 KB.

Edit the footer only with a full backup in hand (`SKILL.md` section 3). Keep the guard and the `CONFIG` object as they are unless the change is intended.

## Pages editor

1. Pages panel: click the page.
2. **Edit** (top left).
3. Click a block. Its toolbar shows a pencil (edit content), a link icon and a trash icon.
4. Save with **Save** (top left). **Exit** is next to it.

Section toolbar, at the right: Edit Section, View Layouts, **Remove** (deletes the whole section; avoid).

## Home hero (current, VERIFIED)

- Full-width orchestra photo: `JHO_Photo_20250319_Banner_Cropped.jpg` (5402 x 1932 original), cropped to about 2.56:1 by its block.
- Over the photo, five colour tiles in a row: yellow (2 columns), green (3), orange (2), blue (3), purple (2).
  The owner chose the 2-3-2-3-2 widths. Five equal tiles do not fit a 12-column grid.
- Button "Upcoming Concert" text contains a real U+00A0 (see `ui-recipes.md`).
- The "About the Orchestra" button was removed on 2026-10-31 (the About page is in the menu).
- **Mobile (VERIFIED 2026-10-31):** Fluid Engine cannot place a block narrower than 2 of the 8 mobile columns, so five
  tiles wrapped and shrank the photo. A `@media (max-width: 767px)` block at the end of Custom CSS pins the photo and the
  five tiles with `!important` longhand `grid-row-start/end` and `grid-column-start/end` on each `.fe-block-<id>`.
  Do not write `a/b/c/d` shorthand there: the CSS preprocessor treats the slashes as division.

## Media page

- Hero button "See Program Details" (a plain button block linking to the 20231212 program PDF, not footer-script output) was deleted 2026-11-01 at the owner's request. Other pages do not contain that text.
- Bottom gallery (a gallery section, grid layout) had 16 items: 5 photos (JHO - 00000007/30/32/35/37) were uploaded twice as separate assets (byte-identical, different asset ids). The 5 later copies were removed; 11 unique items remain in original order. The page HTML also renders a hidden lightbox list, so a raw `img` count is double the visible grid.

## Contact and Join

- **Contact page:** three full-width cards: General Inquiries (info@jhorchestra.org), Auditions & Membership
  (no email since 2026-11-01: text "...please visit our Join page." with "Join page" linked to `/join`, per owner),
  Stay Connected with social icons. **No contact form** (owner decision).
- **Join page:** the hero "Contact Us" button links to `/contact`.

## Asset Library

Folders nest to several levels.

```
concert/
  <YYYYMMDD>/   20231212 20240313 20240515 20240707 20241211 20250319 20250521
                20251210 20260318 20260520 20260705 20261209
website/
  logos/  icons/  photos/  qr-codes/  ai-generated/  stock/  jhbg/  press/
```

- All 117 files are inside folders. The root is empty.
- **Naming, going forward:**
  - concert files: `<YYYYMMDD>_JHO_<Thing>.<ext>`, stored in `concert/<YYYYMMDD>/`;
  - website assets: in `website/<kind>/`.
- **Still numbered, left for the owner:** logo (2), logo (3), logo (4), people (2), location (2).

Mechanics are in `ui-recipes.md`.
