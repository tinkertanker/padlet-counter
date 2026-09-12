# Padlet Section Counter

Adds a live entry count to every section header in Padlet's **Rows** and **Columns** layouts. Layouts without section headers, such as **Wall**, show a whole-board total when their posts can be identified. Counts update automatically when posts are added, moved, or removed. Click a count to expand it into a segmented breakdown of each post colour.

No account access, API key, network request, or collected data is required.

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
npm run build  # regenerate bookmarklet.txt and install-bookmarklet.html
npm run check  # syntax-check and regenerate derived files
```

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

Wrangler builds `dist/` using `scripts/build-cloudflare.mjs`. Only the installer, bookmarklet, health endpoint, and hosting rules are uploaded; extension source and development files are not public. `/` and `/install-bookmarklet.html` serve the same installer, `/healthz` returns `ok`, and unknown paths return 404. No runtime secrets, database, or Docker origin are required. Deployment is manual; no Git-triggered build has been configured.

### Retired Docker deployment

On 2026-09-12 the old container was stopped and removed from `dev.tk.sg`. Its deployment folder is archived at:

```text
/home/tinkertanker-server/Docker/padlet-counter.retired-2026-09-12-cloudflare
```

The original folder is absent. In the archive, `docker-compose.yml` and `deploy.sh` have `.retired` suffixes, and the deployment script is not executable. `RETIRED.md` contains reactivation instructions; `retirement-record/` holds the saved Docker image, metadata, checksums, and verification evidence. All unrelated containers and the shared proxy were left unchanged. Public installer and bookmarklet bytes were verified unchanged through Cloudflare after removing the container.

The legacy `deploy.sh`, Dockerfile, and Compose configuration in this repository are rollback references only. **Do not run `deploy.sh`: it can recreate the retired deployment.** No server-local automatic deployment references were found; external CI was not inspected or changed.

Rollback requires explicitly authorized restoration of Docker using the archive's `RETIRED.md`, followed by an origin-health check. Starting Docker alone does not change public routing. To restore traffic to the old origin, separately remove this Worker's `padlet-counter.tk.sg` custom domain and its managed DNS record in Cloudflare, and remove the route from `wrangler.jsonc` before a subsequent deploy. With no exact hostname record, the unchanged `*.tk.sg` CNAME to `office.tk.sg` resumes routing to the old origin after DNS caches expire. Prefer redeploying a known-good Cloudflare version rather than reactivating Docker.

Padlet is a third-party service and can change its page structure. The counter first uses stable accessibility/data attributes and then a conservative structural fallback. Layouts without section headers show a board-level total when their posts can be identified; unsupported page structures are left unchanged rather than showing a misleading count.
