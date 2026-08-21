import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHTML } from "linkedom";

const source = await readFile(new URL("../src/counter.js", import.meta.url), "utf8");

function load(html, code = source, setup) {
  const { window } = parseHTML(`<html><head></head><body>${html}</body></html>`);
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.MutationObserver = window.MutationObserver;
  setup?.(window);
  eval(code);
  return window;
}

function counts(window) {
  return [...window.document.querySelectorAll(".padlet-section-counter-badge")].map(
    (badge) => badge.textContent
  );
}

function click(window, el) {
  el.dispatchEvent(new window.Event("click", { bubbles: true, cancelable: true }));
}

function segments(window) {
  return [...window.document.querySelectorAll(".padlet-section-counter-segment")].map((segment) => ({
    colour: segment.dataset.colour,
    count: segment.textContent
  }));
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

test("clicking a count expands a colour-segmented breakdown", () => {
  const window = load(`
    <section data-testid="column"><header>Status</header>
      <article data-testid="post"></article>
      <article data-testid="post" data-color="red"></article>
      <article data-testid="post" data-color="red"></article>
      <article data-testid="post" data-color="orange"></article>
      <article data-testid="post" data-color="yellow"></article>
      <article data-testid="post" data-color="green"></article>
    </section>
  `);
  const badge = window.document.querySelector(".padlet-section-counter-badge");

  assert.equal(badge.textContent, "6");
  assert.equal(badge.getAttribute("aria-expanded"), "false");
  assert.equal(segments(window).length, 0);

  click(window, badge);

  assert.equal(badge.getAttribute("aria-expanded"), "true");
  assert.deepEqual(segments(window), [
    { colour: "default", count: "1" },
    { colour: "red", count: "2" },
    { colour: "orange", count: "2" },
    { colour: "green", count: "1" },
    { colour: "blue", count: "0" },
    { colour: "purple", count: "0" }
  ]);
  assert.match(badge.getAttribute("aria-label"), /1 white, 2 red, 2 yellow, 1 green/i);

  click(window, badge);
  assert.equal(badge.getAttribute("aria-expanded"), "false");
  assert.equal(badge.textContent, "6");
  assert.equal(segments(window).length, 0);
  window.__padletSectionCounter.destroy();
});

test("reads colours from nested cards, classes, and inline backgrounds", () => {
  const window = load(`
    <section data-testid="row"><header>Mixed</header>
      <div data-testid="postWrapper"><article data-testid="surfacePost" data-color="blue"></article></div>
      <article data-testid="post" class="wish-purple"></article>
      <article data-testid="post" style="background-color: #ddffde"></article>
    </section>
  `);
  const badge = window.document.querySelector(".padlet-section-counter-badge");
  click(window, badge);

  assert.deepEqual(segments(window), [
    { colour: "default", count: "0" },
    { colour: "red", count: "0" },
    { colour: "orange", count: "0" },
    { colour: "green", count: "1" },
    { colour: "blue", count: "1" },
    { colour: "purple", count: "1" }
  ]);
  window.__padletSectionCounter.destroy();
});

test("keeps a colour breakdown open after posts are added", async () => {
  const window = load(`
    <section data-testid="column"><header>Queue</header>
      <div class="posts">
        <article data-testid="post" data-color="red"></article>
      </div>
    </section>
  `);
  click(window, window.document.querySelector(".padlet-section-counter-badge"));
  assert.equal(
    segments(window).find((segment) => segment.colour === "red")?.count,
    "1"
  );

  const post = window.document.createElement("article");
  post.setAttribute("data-testid", "post");
  post.setAttribute("data-color", "blue");
  window.document.querySelector(".posts").append(post);

  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.deepEqual(
    Object.fromEntries(segments(window).map((segment) => [segment.colour, segment.count])),
    { default: "0", red: "1", orange: "0", green: "0", blue: "1", purple: "0" }
  );
  window.__padletSectionCounter.destroy();
});

test("reads an exact colour class on the post", () => {
  const window = load(`
    <section data-testid="column"><header>Keys</header>
      <article data-testid="post" class="red"></article>
    </section>
  `);
  const badge = window.document.querySelector(".padlet-section-counter-badge");
  click(window, badge);
  assert.equal(
    segments(window).find((segment) => segment.colour === "red")?.count,
    "1"
  );
  window.__padletSectionCounter.destroy();
});

test("explicit white wins over nested colour markup and dark surfaces stay default", () => {
  const window = load(`
    <section data-testid="column"><header>Paint</header>
      <article data-testid="post" data-color="white"><span data-color="red"></span></article>
      <article data-testid="post" style="background-color: #111827"></article>
    </section>
  `);
  const badge = window.document.querySelector(".padlet-section-counter-badge");
  click(window, badge);
  assert.deepEqual(
    Object.fromEntries(segments(window).map((segment) => [segment.colour, segment.count])),
    { default: "2", red: "0", orange: "0", green: "0", blue: "0", purple: "0" }
  );
  window.__padletSectionCounter.destroy();
});

test("counts lazy post wrappers that have not rendered a card yet", () => {
  const window = load(`
    <section data-testid="row"><header>Presenting</header>
      <div data-testid="postWrapper" data-id="1"><article data-testid="surfacePost"></article></div>
      <div data-testid="postWrapper" data-id="2"></div>
    </section>
  `);
  assert.deepEqual(counts(window), ["2"]);
  window.__padletSectionCounter.destroy();
});

test("reads colour from a nested wish and Padlet background classes", () => {
  const window = load(`
    <section data-testid="row"><header>Mixed</header>
      <div data-testid="postWrapper" data-id="1"><div class="surface-post wish" data-color="orange"></div></div>
      <div data-testid="postWrapper" data-id="2"><article data-testid="surfacePost" class="bg-park-200"></article></div>
      <div data-testid="postWrapper" data-id="3"><article data-testid="surfacePost" style="background-color: rgb(181, 255, 184)"></article></div>
    </section>
  `);
  const badge = window.document.querySelector(".padlet-section-counter-badge");
  click(window, badge);
  assert.deepEqual(
    Object.fromEntries(segments(window).map((segment) => [segment.colour, segment.count])),
    { default: "0", red: "0", orange: "1", green: "2", blue: "0", purple: "0" }
  );
  window.__padletSectionCounter.destroy();
});

test("uses Padlet wish data so unloaded posts keep their colours", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      data: [
        { id: 1, attributes: { color: "red", wall_section_id: 10 } },
        { id: 2, attributes: { color: "green", wall_section_id: 10 } },
        { id: 3, attributes: { color: null, wall_section_id: 10 } }
      ],
      meta: {}
    })
  });

  try {
    const window = load(`
      <!-- wall_hashid=board_TestHash1 -->
      <section class="surface-section" data-id="10" id="section-10">
        <div data-testid="sectionTitle"><h2>Announcements</h2></div>
        <div data-testid="postWrapper" data-id="1"></div>
      </section>
    `);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const badge = window.document.querySelector(".padlet-section-counter-badge");
    assert.equal(badge.textContent, "1");
    click(window, badge);
    assert.equal(segments(window).find((segment) => segment.colour === "red")?.count, "1");
    window.__padletSectionCounter.destroy();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fills a section from wish data when no posts are in the DOM", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      data: [
        { id: 8, attributes: { color: "blue", wall_section_id: 22 } },
        { id: 9, attributes: { color: "purple", wall_section_id: 22 } }
      ],
      meta: {}
    })
  });

  try {
    const window = load(`
      <!-- wall_hashid=board_TestHash2 -->
      <section class="surface-section" data-id="22" id="section-22">
        <div data-testid="sectionTitle"><h2>Introductions</h2></div>
      </section>
    `);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const badge = window.document.querySelector(".padlet-section-counter-badge");
    assert.equal(badge.textContent, "2");
    click(window, badge);
    assert.deepEqual(
      Object.fromEntries(segments(window).map((segment) => [segment.colour, segment.count])),
      { default: "0", red: "0", orange: "0", green: "0", blue: "1", purple: "1" }
    );
    window.__padletSectionCounter.destroy();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
