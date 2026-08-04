import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHTML } from "linkedom";

const source = await readFile(new URL("../src/counter.js", import.meta.url), "utf8");

function load(html, code = source) {
  const { window } = parseHTML(`<html><head></head><body>${html}</body></html>`);
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.MutationObserver = window.MutationObserver;
  eval(code);
  return window;
}

function counts(window) {
  return [...window.document.querySelectorAll(".padlet-section-counter-badge")].map(
    (badge) => badge.textContent
  );
}

test("counts posts in explicit columns, including an empty column", () => {
  const window = load(`
    <section data-testid="column"><header>First</header>
      <article data-testid="post"><div data-post-id="duplicate-selector"></div></article>
    </section>
    <section data-testid="column"><header>Second</header>
      <article data-testid="post"></article><article data-testid="post"></article>
    </section>
    <section data-testid="column"><header>Empty</header></section>
  `);

  assert.deepEqual(counts(window), ["1", "2", "0"]);
  window.__padletSectionCounter.destroy();
});

test("counts article cards only at the section title", () => {
  const window = load(`
    <section id="section-123" class="surface-section">
      <header><div data-testid="sectionTitle"><h2 data-testid="sectionTitleText">Announcements</h2></div></header>
      <div id="group-posts-123">
        <div data-testid="postWrapper"><div data-section-id="123"><article data-testid="surfacePost"><h3 data-testid="postSubject">Feedback for Day 2</h3></article></div></div>
        <div data-testid="postWrapper"><div data-section-id="123"><article data-testid="surfacePost"><h3 data-testid="postSubject">Let us know you are here</h3></article></div></div>
        <div data-testid="postWrapper"><div data-section-id="123"><article data-testid="surfacePost"><h3 data-testid="postSubject">Lovable migration guide</h3></article></div></div>
      </div>
    </section>
  `);

  assert.deepEqual(counts(window), ["3"]);
  assert.equal(window.document.querySelector('[data-testid="sectionTitle"] > .padlet-section-counter-badge')?.textContent, "3");
  assert.equal(window.document.querySelector("article .padlet-section-counter-badge"), null);
  window.__padletSectionCounter.destroy();
});

test("falls back to section structure when Padlet data attributes change", () => {
  const window = load(`
    <div class="lane"><h2>Ideas</h2><div><article data-testid="post"></article></div></div>
    <div class="lane"><h2>Done</h2><div>
      <article data-testid="post"></article><article data-testid="post"></article>
    </div></div>
  `);

  assert.deepEqual(counts(window), ["1", "2"]);
  window.__padletSectionCounter.destroy();
});

test("updates after posts are added", async () => {
  const window = load(`
    <section data-testid="row"><header>Queue</header><div class="posts"></div></section>
  `);
  const post = window.document.createElement("article");
  post.setAttribute("data-testid", "post");
  window.document.querySelector(".posts").append(post);

  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.deepEqual(counts(window), ["1"]);
  window.__padletSectionCounter.destroy();
});

test("generated bookmarklet is executable and self-contained", async () => {
  const bookmarklet = await readFile(new URL("../bookmarklet.txt", import.meta.url), "utf8");
  assert.match(bookmarklet, /^javascript:/);

  const window = load(
    '<section data-testid="column"><header>Empty</header></section>',
    bookmarklet.slice("javascript:".length)
  );
  assert.deepEqual(counts(window), ["0"]);
  window.__padletSectionCounter.destroy();
});

test("replaces a counter left behind by an older bookmarklet", () => {
  const window = load(
    '<section class="surface-section"><div data-testid="sectionTitle"><h2>News</h2></div><div data-testid="postWrapper"></div></section>'
  );
  window.__padletSectionCounter.destroy();
  window.oldCounterDestroyed = false;
  window.__padletSectionCounter = {
    refresh() {},
    destroy() {
      window.oldCounterDestroyed = true;
    }
  };

  eval(source);

  assert.equal(window.oldCounterDestroyed, true);
  assert.deepEqual(counts(window), ["1"]);
  window.__padletSectionCounter.destroy();
});
