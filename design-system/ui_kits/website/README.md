# UI kit — jhorchestra.org (Squarespace)

Recreation of the two website screens documented in the brand deck (slides 10 & 11).
Open `index.html` — the nav is live: **Schedule** switches to the concert archive, the JHO
mark and "All concerts →" navigate too, and the season tabs are stateful.

| File | Screen |
| --- | --- |
| `Nav.jsx` | Site header (mosaic mark + JHO, uppercase links, Donate pill, social icons) and the Ink footer |
| `Home.jsx` | Hero · "Next up" Ink band · About band with three stat tiles |
| `Schedule.jsx` | Schedule header + season tabs · featured upcoming concert · past-concert archive rows |

Everything is composed from the design-system components (`Button`, `Headline`, `Eyebrow`,
`Chip`, `ConcertRow`, `StatTile`, `MosaicRule`, `SocialIcons`) — nothing is re-implemented locally.

Notes on fidelity: the source is a Squarespace build assembled from native blocks, so section
order and ground alternation (Paper → Ink → Paper) matter more than pixel novelty. The archive
rows deliberately show empty states ("no recording", "no archive yet") because the brand states
gaps out loud.
