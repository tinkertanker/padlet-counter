import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../src/counter.js", import.meta.url), "utf8");
const bookmarkletSource = source.replace(/^\s*\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
const bookmarklet = `javascript:${bookmarkletSource}`;
const escaped = bookmarklet
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Install Padlet Section Counter</title>
  <style>
    :root { color-scheme: light dark; font: 16px/1.5 system-ui, sans-serif; }
    body { display: grid; margin: 0; min-height: 100vh; place-items: center; }
    main { max-width: 40rem; padding: 32px; }
    h1, .install { text-align: center; }
    a.bookmarklet {
      background: #e6007e; border-radius: 999px; color: white; display: inline-block;
      font-weight: 700; margin: 12px 0 8px; padding: 14px 22px; text-decoration: none;
    }
    ol { padding-inline-start: 1.3rem; }
    li { margin: 0.65em 0; }
    kbd { border: 1px solid #888; border-radius: 4px; padding: 2px 5px; }
    .note { opacity: .8; }
    a:not(.bookmarklet) { color: inherit; }
  </style>
</head>
<body>
  <main>
    <h1>Padlet Section Counter</h1>
    <p>Adds a live entry count to every row or column header on a Padlet. Click a count to expand how many posts are white, red, yellow, green, blue, and purple.</p>
    <p class="install">Drag this button to your bookmarks bar:</p>
    <p class="install"><a class="bookmarklet" href="${escaped}">Count Padlet entries</a></p>
    <ol>
      <li>Show the bookmarks bar with <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (Windows/Linux) or <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (Mac).</li>
      <li>Drag <strong>Count Padlet entries</strong> onto the bar. If you already have that bookmark, delete it first and drag a fresh copy — an old bookmark will not pick up this update.</li>
      <li>Open a Padlet in <strong>Rows</strong> or <strong>Columns</strong> and click the bookmark once after the page loads.</li>
      <li>Click a section’s number to expand the colour breakdown. Click it again to collapse back to the total. Counts include posts that have not been scrolled into view yet.</li>
    </ol>
    <p>If dragging is unavailable, create a bookmark named “Count Padlet entries” and paste the contents of <a href="bookmarklet.txt">bookmarklet.txt</a> into its URL field.</p>
    <p class="note">The bookmarklet must be clicked again after each full page load. Counts keep updating while that page stays open.</p>
  </main>
</body>
</html>
`;

await writeFile(new URL("../bookmarklet.txt", import.meta.url), `${bookmarklet}\n`);
await writeFile(new URL("../install-bookmarklet.html", import.meta.url), html);
