import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const extensionDistDir = path.join(distDir, "extension");

async function readSource(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function joinSources(parts) {
  return `${parts.join("\n\n")}\n`;
}

function toBookmarklet(source) {
  const wrapped = `(()=>{\n${source}\n})();`;
  return `javascript:${wrapped.replace(/\n+/g, " ")}`;
}

async function build() {
  const [coreSource, overlaySource, extensionEntry, bookmarkletEntry, manifestSource] = await Promise.all([
    readSource("src/shared/padlet-counter.js"),
    readSource("src/shared/overlay.js"),
    readSource("src/extension/content-script.js"),
    readSource("src/bookmarklet/entry.js"),
    readSource("extension/manifest.json")
  ]);

  const contentScript = joinSources([coreSource, overlaySource, extensionEntry]);
  const bookmarkletScript = joinSources([coreSource, overlaySource, bookmarkletEntry]);
  const bookmarkletUrl = toBookmarklet(bookmarkletScript);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(extensionDistDir, { recursive: true });

  await Promise.all([
    writeFile(path.join(extensionDistDir, "content-script.js"), contentScript, "utf8"),
    writeFile(path.join(extensionDistDir, "manifest.json"), `${manifestSource.trim()}\n`, "utf8"),
    writeFile(path.join(distDir, "bookmarklet.js"), bookmarkletScript, "utf8"),
    writeFile(path.join(distDir, "bookmarklet.txt"), `${bookmarkletUrl}\n`, "utf8")
  ]);

  console.log("Built scaffold outputs:");
  console.log("- dist/extension/manifest.json");
  console.log("- dist/extension/content-script.js");
  console.log("- dist/bookmarklet.js");
  console.log("- dist/bookmarklet.txt");
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
