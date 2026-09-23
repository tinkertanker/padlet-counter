# Chrome Web Store listing

Copy and answers for the Chrome Web Store developer dashboard. Keep this file in step with `manifest.json`, `src/counter.js` and `site/privacy.html`: reviewers check that the declared behaviour matches the code.

## Upload

```sh
npm ci
npm run check
npm run package   # writes build/section-counter-for-padlet-<version>.zip
```

Upload the zip under **Package**. Every later upload needs a higher `version` in both `manifest.json` and `package.json`; `npm run package` refuses to build if they differ.

## Store listing tab

**Name** (from the manifest): Section Counter for Padlet

**Summary** (from the manifest, 132 characters max): Counts the posts in each Padlet section, or across a Wall, with a click-to-expand colour breakdown.

**Category:** Education

**Language:** English (United Kingdom)

**Description:**

> Section Counter for Padlet adds a live post count to every section header on a Padlet. It is useful when running an activity where you need to see at a glance how many responses each row or column has.
>
> Features:
> • A count on every section in the Rows and Columns layouts
> • A whole-board total on layouts without sections, such as Wall
> • Click a count to see how many posts are white, red, yellow, green, blue and purple
> • Counts update automatically as posts are added, moved or removed
> • Includes posts that have not been scrolled into view yet
> • Pinned posts are left out of the counts
>
> Privacy: the extension runs only on padlet.com and padlet.org. It collects no data, has no analytics and sends nothing to anyone other than Padlet itself. See https://padlet-counter.tk.sg/privacy
>
> Section Counter for Padlet is an independent tool made by Tinkertanker. It is not affiliated with, or endorsed by, Padlet.

**Graphics:**

| Asset | Size | File |
| --- | --- | --- |
| Store icon | 128×128 | `icons/icon-128.png` |
| Small promo tile | 440×280 | `store/promo-tile-440x280.png` (source: `store/promo-tile.html`) |
| Screenshots (1 to 5) | 1280×800 or 640×400 | Not yet taken; see below |

Screenshots should show real boards: a Columns board with counts on each section, the same board with one breakdown expanded, and a Wall board with the total. Use a board with made-up content and no pupils' names or faces.

**Homepage URL:** https://padlet-counter.tk.sg

## Privacy tab

**Single purpose:**

> Shows how many posts are in each section of a Padlet board, and how many of each colour, by adding a count to the section headers on the page.

**Host permission justification** (`padlet.com`, `padlet.org` and their subdomains):

> The extension's only function is to add post counts to Padlet boards, so its content script needs to run on Padlet pages. It reads the page to find sections and posts, and requests the board's post list from Padlet's own site (same origin, the user's existing session) to include posts that Padlet has not yet rendered. It runs on no other sites.

**Remote code:** No, I am not using remote code. (All JavaScript ships in the package; there is no `eval` and no externally hosted script.)

**Data usage:** tick none of the data categories. The extension does not collect or transmit user data: page content and Padlet's post list are processed in the browser only, and nothing is stored or sent to the developer or any third party.

Tick all three certifications (no selling or transferring data, no unrelated use, no creditworthiness use).

**Privacy policy URL:** https://padlet-counter.tk.sg/privacy (deploy the site first so this is live before submitting)

## Distribution tab

- **Visibility:** Public, Unlisted (link only) or Private (Tinkertanker Google Workspace only). Unlisted is a reasonable first release if it is mainly for trainers.
- **Regions:** all regions.
- **Pricing:** free.
