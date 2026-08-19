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
    main { max-width: 640px; padding: 32px; text-align: center; }
    a { background: #e6007e; border-radius: 999px; color: white; display: inline-block; font-weight: 700; margin: 20px; padding: 14px 22px; text-decoration: none; }
    kbd { border: 1px solid #888; border-radius: 4px; padding: 2px 5px; }
  </style>
</head>
<body>
  <main>
    <h1>Padlet Section Counter</h1>
    <p>Drag this button to your bookmarks bar:</p>
    <p><a href="${escaped}">Count Padlet entries</a></p>
    <p>Then open a Padlet in rows or columns mode and click the bookmark. Click a count to expand the colour breakdown.</p>
    <p>If your bookmarks bar is hidden, show it with <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (Windows/Linux) or <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (Mac).</p>
  </main>
</body>
</html>
`;

await writeFile(new URL("../bookmarklet.txt", import.meta.url), `${bookmarklet}\n`);
await writeFile(new URL("../install-bookmarklet.html", import.meta.url), html);
