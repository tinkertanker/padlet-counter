# Padlet Section Counter

Adds a live entry count to every section header in Padlet's **Rows** and **Columns** layouts. Counts update automatically when posts are added, moved, or removed. Click a count to expand it into a segmented breakdown of each post colour.

No account access, API key, network request, or collected data is required.

## Install the Chrome extension

1. Download this repository and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this repository's folder.
5. Open or refresh a Padlet using Rows or Columns.

The extension also works in Chromium browsers such as Edge, Brave, and Arc via their extensions page.

## Install the bookmarklet

1. Open [padlet-counter.tk.sg](https://padlet-counter.tk.sg) in Chrome (or open [`install-bookmarklet.html`](install-bookmarklet.html) locally).
2. Show the bookmarks bar if it is hidden, then drag **Count Padlet entries** onto it. If you already have that bookmark, delete it first and drag a fresh copy — an old bookmark will not pick up this update.
3. Open a Padlet using Rows or Columns and click the bookmark once after the page loads.
4. Click a section’s number to expand the colour breakdown (white, red, yellow, green, blue, purple). Click it again to collapse.

If dragging is unavailable, create a bookmark manually, name it “Count Padlet entries,” and paste the contents of [`bookmarklet.txt`](bookmarklet.txt) into its URL field.

Unlike the extension, the bookmarklet must be clicked once after each full page load. It continues updating while that page remains open.

## Development

The extension and bookmarklet use the same dependency-free source in `src/counter.js`.

```sh
npm run build  # regenerate bookmarklet.txt and install-bookmarklet.html
npm run check  # syntax-check and regenerate derived files
```

## Deployment

The installer is served by an unprivileged nginx container behind the shared `devtksg` reverse proxy. Deploy a published Git ref with:

```sh
REF=main ./deploy.sh
```

Padlet is a third-party service and can change its page structure. The counter first uses stable accessibility/data attributes and then a conservative structural fallback; unsupported layouts are left unchanged rather than showing a misleading count.
