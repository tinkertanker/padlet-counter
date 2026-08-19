(() => {
  "use strict";

  const INSTANCE_KEY = "__padletSectionCounter";
  const BADGE_CLASS = "padlet-section-counter-badge";
  const SEGMENT_CLASS = "padlet-section-counter-segment";
  const STYLE_ID = "padlet-section-counter-styles";
  const COLOUR_IDS = ["default", "red", "orange", "green", "blue", "purple"];
  const COLOUR_LABELS = {
    default: "White",
    red: "Red",
    orange: "Yellow",
    green: "Green",
    blue: "Blue",
    purple: "Purple"
  };
  const COLOUR_ATTRS = [
    "data-color",
    "data-post-color",
    "data-wish-color",
    "data-colour",
    "data-post-colour"
  ];
  const COLOUR_ATTR_SELECTOR = COLOUR_ATTRS.map((attr) => `[${attr}]`).join(",");
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
      .${BADGE_CLASS}:focus-visible {
        outline: 2px solid #fff !important;
        outline-offset: 2px !important;
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
      .${SEGMENT_CLASS}[data-empty="true"] {
        opacity: .55 !important;
      }
      .${SEGMENT_CLASS}[data-colour="default"] { background: #fff !important; }
      .${SEGMENT_CLASS}[data-colour="red"] { background: #ffd9da !important; }
      .${SEGMENT_CLASS}[data-colour="orange"] { background: #fff4ce !important; }
      .${SEGMENT_CLASS}[data-colour="green"] { background: #ddffde !important; }
      .${SEGMENT_CLASS}[data-colour="blue"] { background: #bbeafe !important; }
      .${SEGMENT_CLASS}[data-colour="purple"] { background: #eed8ff !important; }
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

  function normalizeColourName(value) {
    const v = String(value || "")
      .trim()
      .toLowerCase();
    if (!v || v === "null" || v === "none" || v === "undefined") return "default";
    if (v === "white" || v === "black" || v === "default" || v === "gray" || v === "grey") {
      return "default";
    }
    if (v === "yellow" || v === "orange") return "orange";
    if (v === "red" || v === "green" || v === "blue" || v === "purple") return v;
    return null;
  }

  function parseCssColor(value) {
    if (value == null) return null;
    const s = String(value).trim().toLowerCase();
    if (!s || s === "transparent" || s === "inherit" || s === "none") return null;
    const hex = s.match(/#([0-9a-f]{3,8})\b/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
      if (h.length >= 6) {
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16)
        };
      }
    }
    const rgb = s.match(
      /rgba?\(\s*([0-9.]+)\s*[,/\s]\s*([0-9.]+)\s*[,/\s]\s*([0-9.]+)/i
    );
    if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    return null;
  }

  function colourFromRgb(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 0.04 || (d / (1 - Math.abs(2 * l - 1) || 1) < 0.12)) return "default";
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    if (h < 18 || h >= 340) return "red";
    if (h < 70) return "orange";
    if (h < 165) return "green";
    if (h < 250) return "blue";
    return "purple";
  }

  function colourFromCss(value) {
    const named = normalizeColourName(value);
    if (named) return named;
    const rgb = parseCssColor(value);
    return rgb ? colourFromRgb(rgb.r, rgb.g, rgb.b) : null;
  }

  function colourFromClass(className) {
    if (!className) return null;
    const tokens = String(className).split(/\s+/);
    for (const token of tokens) {
      const exact = token.toLowerCase();
      const named = normalizeColourName(exact);
      if (named && named !== "default" && exact === named) return named;
      if (exact === "yellow") return "orange";
      if (exact === "white" || exact === "black") return "default";
      const prefixed = exact.match(
        /^(?:wish|post|pdlt|color|colour)[-_]?(red|orange|yellow|green|blue|purple|white|black)$/
      );
      if (prefixed) return normalizeColourName(prefixed[1]);
    }
    return null;
  }

  function colourFromAttributes(el) {
    if (!el) return null;
    for (const attr of COLOUR_ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      return colourFromCss(el.getAttribute(attr)) || "default";
    }
    if (el.hasAttribute("color")) return colourFromCss(el.getAttribute("color")) || "default";
    return null;
  }

  function colourFromStyle(el) {
    if (!el) return null;
    const inline =
      el.style?.getPropertyValue?.("background-color") ||
      el.style?.backgroundColor ||
      el.style?.getPropertyValue?.("--post-color") ||
      el.style?.getPropertyValue?.("--wish-color");
    if (inline) {
      const fromInline = colourFromCss(inline);
      if (fromInline) return fromInline;
    }
    const view = el.ownerDocument?.defaultView;
    const cs = view?.getComputedStyle?.(el);
    if (!cs) return null;
    for (const prop of ["--post-color", "--wish-color", "--pdlt-post-color", "--color"]) {
      const value = cs.getPropertyValue(prop).trim();
      if (!value) continue;
      const fromVar = colourFromCss(value);
      if (fromVar) return fromVar;
    }
    const bg = cs.backgroundColor;
    if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") return null;
    return colourFromCss(bg);
  }

  function postCard(post) {
    return (
      post.querySelector('[data-testid="surfacePost"], [data-testid="post"], article') || post
    );
  }

  function postColour(post) {
    const card = postCard(post);
    const tagged = [...post.querySelectorAll(COLOUR_ATTR_SELECTOR)].filter(
      (el) => !el.closest("button, [role=menu], [role=listbox], [role=dialog]")
    );
    const attrColours = [post, card, ...tagged]
      .filter(Boolean)
      .map(colourFromAttributes)
      .filter(Boolean);
    const chromatic = attrColours.find((colour) => colour !== "default");
    if (chromatic) return chromatic;

    const fromClass = colourFromClass(post.className) || colourFromClass(card.className);
    if (fromClass) return fromClass;

    return colourFromStyle(card) || colourFromStyle(post) || attrColours[0] || "default";
  }

  function colourCounts(posts) {
    const counts = Object.fromEntries(COLOUR_IDS.map((id) => [id, 0]));
    for (const post of posts) counts[postColour(post)] += 1;
    return counts;
  }

  function describe(count, counts, expanded) {
    const entry = `${count} ${count === 1 ? "entry" : "entries"}`;
    const parts = COLOUR_IDS.filter((id) => counts[id] > 0).map(
      (id) => `${counts[id]} ${COLOUR_LABELS[id].toLowerCase()}`
    );
    const summary = parts.length > 1 ? `${entry}: ${parts.join(", ")}` : entry;
    return `${summary}. Click to ${expanded ? "hide" : "show"} counts by colour.`;
  }

  function renderBadge(badge, count, counts) {
    const expanded = badge.getAttribute("aria-expanded") === "true";
    const label = describe(count, counts, expanded);
    badge.setAttribute("aria-label", label);
    badge.title = label;

    if (!expanded) {
      if (badge.childElementCount || badge.textContent !== String(count)) {
        badge.replaceChildren(document.createTextNode(String(count)));
      }
      return;
    }

    const frag = document.createDocumentFragment();
    for (const id of COLOUR_IDS) {
      const segment = document.createElement("span");
      segment.className = SEGMENT_CLASS;
      segment.dataset.colour = id;
      segment.textContent = String(counts[id]);
      segment.title = `${counts[id]} ${COLOUR_LABELS[id].toLowerCase()}`;
      if (!counts[id]) segment.dataset.empty = "true";
      frag.append(segment);
    }
    badge.replaceChildren(frag);
  }

  function putBadge(section, posts, expandedSections, badgeSections) {
    const target = externalHeader(section);
    if (!target || target.closest(POST_SELECTOR)) return false;

    let badge = [...target.children].find((child) => child.classList?.contains(BADGE_CLASS));
    if (!badge) {
      badge = document.createElement("span");
      badge.className = BADGE_CLASS;
      badge.setAttribute("role", "button");
      badge.setAttribute("tabindex", "0");
      badge.setAttribute("aria-live", "polite");
      target.append(badge);
    }

    badgeSections.set(badge, section);
    badge.setAttribute("aria-expanded", expandedSections.has(section) ? "true" : "false");
    renderBadge(badge, posts.length, colourCounts(posts));
    return true;
  }

  function isCounterNode(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    return Boolean(el?.closest?.(`.${BADGE_CLASS}, #${STYLE_ID}`));
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
      const inferred = sections.length === 0;
      if (inferred) sections = inferredSections(posts);

      const activeBadges = new Set();
      for (const section of sections) {
        const inSection = sectionPosts(section, inferred, posts, sections);
        if (putBadge(section, inSection, expandedSections, badgeSections)) {
          const badge = [...(externalHeader(section)?.children || [])].find((child) =>
            child.classList?.contains(BADGE_CLASS)
          );
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

    function toggleBadge(badge) {
      const section = badgeSections.get(badge);
      if (!section) return;
      if (expandedSections.has(section)) expandedSections.delete(section);
      else expandedSections.add(section);
      refresh();
    }

    function onBadgeEvent(event) {
      const badge = event.target?.closest?.(`.${BADGE_CLASS}`);
      if (!badge) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (event.type === "pointerdown" || event.type === "mousedown") return;
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
      toggleBadge(badge);
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => isCounterNode(mutation.target))) return;
      queueRefresh();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "color",
        "data-color",
        "data-post-color",
        "data-wish-color",
        "data-colour",
        "data-post-colour"
      ]
    });
    document.addEventListener("click", onBadgeEvent, true);
    document.addEventListener("pointerdown", onBadgeEvent, true);
    document.addEventListener("mousedown", onBadgeEvent, true);
    document.addEventListener("keydown", onBadgeEvent, true);
    refresh();

    return {
      refresh,
      destroy() {
        clearTimeout(timer);
        observer.disconnect();
        document.removeEventListener("click", onBadgeEvent, true);
        document.removeEventListener("pointerdown", onBadgeEvent, true);
        document.removeEventListener("mousedown", onBadgeEvent, true);
        document.removeEventListener("keydown", onBadgeEvent, true);
        document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
        document.getElementById(STYLE_ID)?.remove();
        delete window[INSTANCE_KEY];
      }
    };
  }

  window[INSTANCE_KEY]?.destroy?.();
  window[INSTANCE_KEY] = createCounter();
})();
