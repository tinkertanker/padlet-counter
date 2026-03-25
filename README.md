# Padlet Counter

Padlet Counter is a small scaffold for two delivery options built from the same source:

- a Chrome extension that injects an on-screen counter into Padlet boards
- a bookmarklet that runs the same counter without installing an extension

The first pass uses DOM heuristics rather than Padlet-specific internals. It scans visible card-like elements, groups them into approximate rows and columns by position, and shows counts in a floating panel while you hover a post. That gives you a useful base quickly, and it keeps the board-specific selectors isolated for later tuning.

## Project layout

```text
extension/              Manifest source for the Chrome extension
scripts/build.mjs       Emits both extension and bookmarklet artefacts
src/shared/             Shared counting and overlay logic
src/extension/          Extension entrypoint
src/bookmarklet/        Bookmarklet entrypoint
dist/                   Generated output after build
```

## Quick start

```bash
npm run build
```

That generates:

- `dist/extension/manifest.json`
- `dist/extension/content-script.js`
- `dist/bookmarklet.js`
- `dist/bookmarklet.txt`

## Load the extension locally

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Choose Load unpacked.
5. Select `dist/extension`.

Open a Padlet board and the floating panel should appear automatically.

## Install the bookmarklet

1. Run `npm run build`.
2. Open `dist/bookmarklet.txt`.
3. Copy the single `javascript:` URL into a browser bookmark.
4. Visit a Padlet board and click the bookmark.

## Current behaviour

- Shows total detected posts, rows, and columns.
- Updates row and column counts for the hovered post.
- Highlights the hovered post’s row and column.
- Lets you rescan if Padlet lazy-loads more content.

## Next sensible steps

- Tighten selectors against real Padlet board markup.
- Add a small mode switch for row-only or column-only overlays.
- Add fixture pages or recorded DOM snapshots for regression tests.
- Package icons and a release workflow once the behaviour is stable.
