(() => {
  "use strict";

  const INSTANCE_KEY = "__padletSectionCounter";
  const BADGE_CLASS = "padlet-section-counter-badge";
  const STYLE_ID = "padlet-section-counter-styles";
  const SECTION_SELECTOR = [
    "section.surface-section",
    'section[id^="section-"]',
    '[data-testid="section"]',
    '[data-testid="column"]',
    '[data-testid="row"]',
    '[data-testid="shelf"]',
    '[data-testid="board-section"]',
    '[data-testid="section-container"]',
    '[data-testid="column-container"]',
    "[data-section-id]",
    "[data-section-uid]",
    "[data-column-id]",
    "[data-column-uid]"
  ].join(",");
  const POST_SELECTOR = [
    '[data-testid="postWrapper"]',
    '[data-testid="surfacePost"]',
    '[data-testid="post"]',
    '[data-testid="post-card"]',
    '[data-testid="postCard"]',
    '[data-testid="board-post"]',
    "[data-post-id]",
    "[data-post-uid]",
    '[data-item-type="post"]',
    "article"
  ].join(",");
  const HEADER_SELECTOR = [
    '[data-testid="sectionTitle"]',
    '[data-testid="sectionTitleText"]',
    '[data-testid="section-header"]',
    '[data-testid="column-header"]',
    '[data-testid="row-header"]',
    '[data-testid="section-title"]',
    '[data-testid="column-title"]',
    "header",
    "h1",
    "h2",
    "h3",
    '[role="heading"]'
  ].join(",");

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${BADGE_CLASS} {
        align-items: center !important;
        background: #111827 !important;
        border: 1px solid rgba(255, 255, 255, .2) !important;
        border-radius: 999px !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .2) !important;
        box-sizing: border-box !important;
        color: #fff !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        font: 700 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        height: 22px !important;
        justify-content: center !important;
        margin-inline-start: 8px !important;
        min-width: 22px !important;
        padding: 0 7px !important;
        pointer-events: none !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
      }
      @media (prefers-contrast: more) {
        .${BADGE_CLASS} { border: 2px solid #fff !important; }
      }
    `;
    (document.head || document.documentElement).append(style);
  }

  function allPosts(root = document) {
    return [...new Set(root.querySelectorAll(POST_SELECTOR))].filter(
      (post) =>
        !post.parentElement?.closest(POST_SELECTOR) &&
        !post.closest("[role=dialog], [contenteditable=true]")
    );
  }

  function externalHeader(container) {
    const sectionTitle = container.querySelector('[data-testid="sectionTitle"]');
    if (sectionTitle && !sectionTitle.closest(POST_SELECTOR)) return sectionTitle;

    return [...container.querySelectorAll(HEADER_SELECTOR)].find(
      (header) => !header.closest(POST_SELECTOR) && !header.closest("[role=dialog]")
    );
  }

  function explicitSections() {
    const candidates = [...new Set(document.querySelectorAll(SECTION_SELECTOR))].filter(
      (section) => !section.closest(POST_SELECTOR) && externalHeader(section)
    );
    return candidates.filter(
      (section) =>
        !candidates.some(
          (other) => other !== section && section.contains(other) && externalHeader(other)
        )
    );
  }

  // Padlet occasionally changes its data attributes. This fallback finds the
  // nearest post container with a heading that is not itself part of a post.
  function inferredSections(posts) {
    const sections = new Set();

    for (const post of posts) {
      let parent = post.parentElement;
      let levels = 0;
      while (parent && parent !== document.body && levels < 8) {
        if (externalHeader(parent)) {
          sections.add(parent);
          break;
        }
        parent = parent.parentElement;
        levels += 1;
      }
    }

    // A single shared ancestor is usually the whole board, not a section.
    return sections.size > 1 ? [...sections] : [];
  }

  function sectionPosts(section, inferred, posts, sections) {
    return posts.filter((post) => {
      if (!section.contains(post)) return false;
      if (inferred) {
        return !sections.some(
          (other) => other !== section && section.contains(other) && other.contains(post)
        );
      }
      return !sections.some(
        (other) => other !== section && section.contains(other) && other.contains(post)
      );
    });
  }

  function putBadge(section, count) {
    const target = externalHeader(section);
    if (!target || target.closest(POST_SELECTOR)) return false;

    let badge = [...target.children].find((child) => child.classList?.contains(BADGE_CLASS));
    if (!badge) {
      badge = document.createElement("span");
      badge.className = BADGE_CLASS;
      badge.setAttribute("aria-live", "polite");
      target.append(badge);
    }

    const label = `${count} ${count === 1 ? "entry" : "entries"}`;
    if (badge.textContent !== String(count)) badge.textContent = String(count);
    badge.setAttribute("aria-label", label);
    badge.title = label;
    return true;
  }

  function createCounter() {
    let timer;
    let observer;

    function refresh() {
      clearTimeout(timer);
      addStyles();

      const posts = allPosts();
      let sections = explicitSections();
      const inferred = sections.length === 0;
      if (inferred) sections = inferredSections(posts);

      const activeBadges = new Set();
      for (const section of sections) {
        const count = sectionPosts(section, inferred, posts, sections).length;
        if (putBadge(section, count)) {
          const badge = section.querySelector(`.${BADGE_CLASS}`);
          if (badge) activeBadges.add(badge);
        }
      }

      document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => {
        if (!activeBadges.has(badge)) badge.remove();
      });
    }

    function queueRefresh() {
      clearTimeout(timer);
      timer = setTimeout(refresh, 120);
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => mutation.target.closest?.(`.${BADGE_CLASS}`))) return;
      queueRefresh();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    refresh();

    return {
      refresh,
      destroy() {
        clearTimeout(timer);
        observer.disconnect();
        document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
        document.getElementById(STYLE_ID)?.remove();
        delete window[INSTANCE_KEY];
      }
    };
  }

  window[INSTANCE_KEY]?.destroy?.();
  window[INSTANCE_KEY] = createCounter();
})();
