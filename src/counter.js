(() => {
  "use strict";

  const INSTANCE_KEY = "__padletSectionCounter";
  const BADGE_CLASS = "padlet-section-counter-badge";
  const SEGMENT_CLASS = "padlet-section-counter-segment";
  const STYLE_ID = "padlet-section-counter-styles";
  const COLOURS = [
    { id: "default", label: "White", bg: "#fff", samples: [[255, 255, 255], [17, 17, 17]] },
    { id: "red", label: "Red", bg: "#ffd9da", samples: [[255, 217, 218], [124, 0, 0]] },
    { id: "orange", label: "Yellow", bg: "#fff4ce", samples: [[255, 244, 206], [145, 61, 0]] },
    { id: "green", label: "Green", bg: "#ddffde", samples: [[221, 255, 222], [1, 61, 0]] },
    { id: "blue", label: "Blue", bg: "#bbeafe", samples: [[187, 234, 254], [1, 50, 108]] },
    { id: "purple", label: "Purple", bg: "#eed8ff", samples: [[238, 216, 255], [61, 0, 98]] }
  ];
  const ALIAS = {
    default: "default",
    white: "default",
    black: "default",
    gray: "default",
    grey: "default",
    red: "red",
    orange: "orange",
    yellow: "orange",
    green: "green",
    blue: "blue",
    purple: "purple"
  };
  const COLOUR_ATTRS = [
    "data-color",
    "data-post-color",
    "data-wish-color",
    "data-colour",
    "data-post-colour"
  ];
  const COLOUR_IDS = COLOURS.map((colour) => colour.id);
  const MAX_SAMPLE_DISTANCE = 50;
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

    const swatches = COLOURS.map(
      (colour) =>
        `.${SEGMENT_CLASS}[data-colour="${colour.id}"] { background: ${colour.bg} !important; }`
    ).join("");
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
        cursor: pointer !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        font: 700 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        height: 22px !important;
        justify-content: center !important;
        margin-inline-start: 8px !important;
        min-width: 22px !important;
        overflow: hidden !important;
        padding: 0 7px !important;
        pointer-events: auto !important;
        user-select: none !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
      }
      .${BADGE_CLASS}[aria-expanded="true"] {
        background: #fff !important;
        border: 1px solid rgba(17, 24, 39, .18) !important;
        color: #111827 !important;
        padding: 0 !important;
      }
      .${SEGMENT_CLASS} {
        align-items: center !important;
        box-sizing: border-box !important;
        color: #111827 !important;
        display: inline-flex !important;
        font: inherit !important;
        height: 22px !important;
        justify-content: center !important;
        min-width: 22px !important;
        padding: 0 6px !important;
      }
      .${SEGMENT_CLASS}[data-empty="true"] { opacity: .55 !important; }
      ${swatches}
      @media (prefers-contrast: more) {
        .${BADGE_CLASS} { border: 2px solid #fff !important; }
        .${BADGE_CLASS}[aria-expanded="true"] { border: 2px solid #111 !important; }
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

  function sectionPosts(section, posts, sections) {
    return posts.filter(
      (post) =>
        section.contains(post) &&
        !sections.some((other) => other !== section && section.contains(other) && other.contains(post))
    );
  }

  function namedColour(value) {
    const v = String(value ?? "")
      .trim()
      .toLowerCase();
    if (!v || v === "null" || v === "none" || v === "undefined") return "default";
    return ALIAS[v] || null;
  }

  function parseCssColor(value) {
    if (value == null) return null;
    const s = String(value).trim().toLowerCase();
    if (!s || s === "transparent" || s === "inherit" || s === "none") return null;
    const hex = s.match(/#([0-9a-f]{3,8})\b/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
      if (h.length >= 6) {
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16)
        };
      }
    }
    const rgb = s.match(/rgba?\(\s*([0-9.]+)\s*[,/\s]\s*([0-9.]+)\s*[,/\s]\s*([0-9.]+)/i);
    return rgb ? { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) } : null;
  }

  function nearestColour({ r, g, b }) {
    let best = "default";
    let bestDist = MAX_SAMPLE_DISTANCE;
    for (const colour of COLOURS) {
      for (const [sr, sg, sb] of colour.samples) {
        const dist = Math.hypot(r - sr, g - sg, b - sb);
        if (dist < bestDist) {
          best = colour.id;
          bestDist = dist;
        }
      }
    }
    return best;
  }

  function colourFromClass(className) {
    if (!className) return null;
    for (const token of String(className).split(/\s+/)) {
      const exact = token.toLowerCase();
      if (ALIAS[exact]) return ALIAS[exact];
      const prefixed = exact.match(
        /^(?:wish|post|pdlt|color|colour)[-_]?(red|orange|yellow|green|blue|purple|white|black)$/
      );
      if (prefixed) return ALIAS[prefixed[1]];
    }
    return null;
  }

  function colourFromAttributes(el) {
    if (!el) return null;
    for (const attr of COLOUR_ATTRS) {
      if (el.hasAttribute(attr)) return namedColour(el.getAttribute(attr));
    }
    if (el.hasAttribute("color")) return namedColour(el.getAttribute("color"));
    return null;
  }

  function colourFromStyle(el) {
    if (!el) return null;
    const inline =
      el.style?.getPropertyValue?.("background-color") ||
      el.style?.backgroundColor ||
      el.style?.getPropertyValue?.("--post-color") ||
      el.style?.getPropertyValue?.("--wish-color");
    const fromInline = parseCssColor(inline);
    if (fromInline) return nearestColour(fromInline);

    const cs = el.ownerDocument?.defaultView?.getComputedStyle?.(el);
    if (!cs) return null;
    for (const prop of ["--post-color", "--wish-color", "--pdlt-post-color"]) {
      const rgb = parseCssColor(cs.getPropertyValue(prop));
      if (rgb) return nearestColour(rgb);
    }
    const bg = parseCssColor(cs.backgroundColor);
    return bg ? nearestColour(bg) : null;
  }

  function postCard(post) {
    return (
      post.querySelector('[data-testid="surfacePost"], [data-testid="post"], article') || post
    );
  }

  function postColour(post) {
    const card = postCard(post);
    for (const el of [post, card]) {
      const named = colourFromAttributes(el);
      if (named) return named;
    }
    for (const el of [post, card]) {
      const fromClass = colourFromClass(el.className);
      if (fromClass) return fromClass;
    }
    return colourFromStyle(card) || colourFromStyle(post) || "default";
  }

  function colourCounts(posts) {
    const counts = Object.fromEntries(COLOUR_IDS.map((id) => [id, 0]));
    for (const post of posts) counts[postColour(post)] += 1;
    return counts;
  }

  function describe(count, counts, expanded) {
    const entry = `${count} ${count === 1 ? "entry" : "entries"}`;
    const parts = COLOURS.filter((colour) => counts[colour.id] > 0).map(
      (colour) => `${counts[colour.id]} ${colour.label.toLowerCase()}`
    );
    const summary = parts.length ? `${entry}: ${parts.join(", ")}` : entry;
    return `${summary}. Click to ${expanded ? "hide" : "show"} counts by colour.`;
  }

  function findBadge(header) {
    return [...header.children].find((child) => child.classList?.contains(BADGE_CLASS));
  }

  function renderBadge(badge, count, counts, expanded) {
    const label = describe(count, counts, expanded);
    badge.setAttribute("aria-expanded", expanded ? "true" : "false");
    badge.setAttribute("aria-live", expanded ? "off" : "polite");
    badge.setAttribute("aria-label", label);
    badge.title = label;

    if (!expanded) {
      delete badge.dataset.breakdown;
      if (badge.childElementCount || badge.textContent !== String(count)) {
        badge.replaceChildren(document.createTextNode(String(count)));
      }
      return;
    }

    const breakdown = COLOUR_IDS.map((id) => `${id}:${counts[id]}`).join();
    if (badge.dataset.breakdown === breakdown) return;
    badge.dataset.breakdown = breakdown;

    const frag = document.createDocumentFragment();
    for (const colour of COLOURS) {
      const segment = document.createElement("span");
      segment.className = SEGMENT_CLASS;
      segment.dataset.colour = colour.id;
      segment.textContent = String(counts[colour.id]);
      segment.title = `${counts[colour.id]} ${colour.label.toLowerCase()}`;
      if (!counts[colour.id]) segment.dataset.empty = "true";
      frag.append(segment);
    }
    badge.replaceChildren(frag);
  }

  function putBadge(section, posts, expanded) {
    const target = externalHeader(section);
    if (!target || target.closest(POST_SELECTOR)) return null;

    let badge = findBadge(target);
    if (!badge) {
      badge = document.createElement("span");
      badge.className = BADGE_CLASS;
      target.append(badge);
    }

    renderBadge(badge, posts.length, colourCounts(posts), expanded);
    return badge;
  }

  function isCounterNode(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    return Boolean(el?.closest?.(`.${BADGE_CLASS}, #${STYLE_ID}`));
  }

  function isPostNode(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    return Boolean(el?.closest?.(POST_SELECTOR));
  }

  function createCounter() {
    let timer;
    let observer;
    const expandedSections = new WeakSet();
    const badgeSections = new WeakMap();

    function refresh() {
      clearTimeout(timer);
      addStyles();

      const posts = allPosts();
      let sections = explicitSections();
      if (sections.length === 0) sections = inferredSections(posts);

      const activeBadges = new Set();
      for (const section of sections) {
        const badge = putBadge(
          section,
          sectionPosts(section, posts, sections),
          expandedSections.has(section)
        );
        if (!badge) continue;
        badgeSections.set(badge, section);
        activeBadges.add(badge);
      }

      document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => {
        if (!activeBadges.has(badge)) badge.remove();
      });
    }

    function queueRefresh() {
      clearTimeout(timer);
      timer = setTimeout(refresh, 120);
    }

    function toggleBadge(badge) {
      const section = badgeSections.get(badge);
      if (!section) return;
      if (expandedSections.has(section)) expandedSections.delete(section);
      else expandedSections.add(section);
      refresh();
    }

    function onBadgePointer(event) {
      if (!event.target?.closest?.(`.${BADGE_CLASS}`)) return;
      event.stopPropagation();
    }

    function onBadgeClick(event) {
      const badge = event.target?.closest?.(`.${BADGE_CLASS}`);
      if (!badge) return;
      event.preventDefault();
      event.stopPropagation();
      toggleBadge(badge);
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => isCounterNode(mutation.target))) return;
      if (
        mutations.every(
          (mutation) => mutation.type === "attributes" && !isPostNode(mutation.target)
        )
      ) {
        return;
      }
      queueRefresh();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "color", ...COLOUR_ATTRS]
    });
    document.addEventListener("pointerdown", onBadgePointer, true);
    document.addEventListener("mousedown", onBadgePointer, true);
    document.addEventListener("click", onBadgeClick, true);
    refresh();

    return {
      refresh,
      destroy() {
        clearTimeout(timer);
        observer.disconnect();
        document.removeEventListener("pointerdown", onBadgePointer, true);
        document.removeEventListener("mousedown", onBadgePointer, true);
        document.removeEventListener("click", onBadgeClick, true);
        document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
        document.getElementById(STYLE_ID)?.remove();
        delete window[INSTANCE_KEY];
      }
    };
  }

  window[INSTANCE_KEY]?.destroy?.();
  window[INSTANCE_KEY] = createCounter();
})();
