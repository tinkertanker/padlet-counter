import "./build-bookmarklet.mjs";
import { mkdir, copyFile, writeFile, rm } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist);
for (const [source, target] of [
  ["install-bookmarklet.html", "index.html"],
  ["install-bookmarklet.html", "install-bookmarklet.html"],
  ["bookmarklet.txt", "bookmarklet.txt"],
  ["site/privacy.html", "privacy.html"],
]) {
  await copyFile(new URL(`../${source}`, import.meta.url), new URL(target, dist));
}
await writeFile(new URL("healthz", dist), "ok\n");
await writeFile(new URL("_redirects", dist), "/ /index.html 200\n/privacy /privacy.html 200\n");
await writeFile(new URL("_headers", dist), `/*
  Cache-Control: no-cache, must-revalidate
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/healthz
  Content-Type: text/plain; charset=utf-8
`);
