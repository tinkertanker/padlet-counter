# Section Counter for Padlet

Adds a live entry count to every section header in Padlet's **Rows** and **Columns** layouts. Layouts without section headers, such as **Wall**, show a whole-board total when their posts can be identified. Counts update automatically when posts are added, moved, or removed. Click a count to expand it into a segmented breakdown of each post colour. Pinned posts are left out of the counts.

No data is collected or sent anywhere. To count posts that Padlet has not rendered yet, the counter requests the board's post list from Padlet itself, using the page's existing session; nothing leaves Padlet. See the [privacy policy](site/privacy.html), published at [padlet-counter.tk.sg/privacy](https://padlet-counter.tk.sg/privacy).

Section Counter for Padlet is an independent tool and is not affiliated with Padlet.

## Install the Chrome extension

1. Download this repository and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this repository's folder.
5. Open or refresh a Padlet.

The extension also works in Chromium browsers such as Edge, Brave, and Arc via their extensions page.

## Install the bookmarklet

1. Open [padlet-counter.tk.sg](https://padlet-counter.tk.sg) in Chrome (or open [`install-bookmarklet.html`](install-bookmarklet.html) locally).
2. Show the bookmarks bar if it is hidden, then drag **Count Padlet entries** onto it. If you already have that bookmark, delete it first and drag a fresh copy — an old bookmark will not pick up this update.
3. Open a Padlet and click the bookmark once after the page loads.
4. Click a section’s number, or the whole-board total on layouts without sections, to expand the colour breakdown (white, red, yellow, green, blue, purple). Click it again to collapse.

If dragging is unavailable, create a bookmark manually, name it “Count Padlet entries,” and paste the contents of [`bookmarklet.txt`](bookmarklet.txt) into its URL field.

Unlike the extension, the bookmarklet must be clicked once after each full page load. It continues updating while that page remains open.

## Development

The extension and bookmarklet use the same dependency-free source in `src/counter.js`.

```sh
npm run build        # regenerate bookmarklet.txt and install-bookmarklet.html
npm run build:icons  # regenerate icons/*.png from scripts/build-icons.mjs
npm run check        # syntax-check and regenerate derived files
npm run package      # zip the extension for the Chrome Web Store into build/
```

## Chrome Web Store

`npm run package` writes `build/section-counter-for-padlet-<version>.zip`, containing only the manifest, `src/counter.js` and the icons. Bump `version` in both `manifest.json` and `package.json` before each upload. Listing copy, privacy answers and promo artwork are in [`store/`](store/LISTING.md).

## Deployment

The installer is served by Cloudflare Workers Static Assets in the **Tinkertanker** account (`b8b1032c61d9475cd00229c74db7ec72`), Worker `padlet-counter`.

- Production: https://padlet-counter.tk.sg
- Worker URL: https://padlet-counter.tinkertanker.workers.dev

Deploy from the intended source checkout with a Cloudflare API token that can edit Workers and the `tk.sg` zone:

```sh
npm ci
npm run check
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_KEY_TT"
npx wrangler whoami  # confirm Tinkertanker before deploying
npm run deploy
```

Wrangler builds `dist/` using `scripts/build-cloudflare.mjs`. Only the installer, bookmarklet, privacy policy (`site/privacy.html`, served at `/privacy`), health endpoint, and hosting rules are uploaded; extension source and development files are not public. `/` and `/install-bookmarklet.html` serve the same installer, `/healthz` returns `ok`, and unknown paths return 404. No runtime secrets, database, or Docker origin are required. Deployment is manual; no Git-triggered build has been configured.

Padlet is a third-party service and can change its page structure. The counter first uses stable accessibility/data attributes and then a conservative structural fallback. Layouts without section headers show a board-level total when their posts can be identified; unsupported page structures are left unchanged rather than showing a misleading count.
