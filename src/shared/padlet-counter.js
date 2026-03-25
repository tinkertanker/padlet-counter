(() => {
  if (globalThis.PadletCounterCore) {
    return;
  }

  const CANDIDATE_SELECTORS = [
    "[data-testid*='post']",
    "[data-testid*='brick']",
    "[class*='post']",
    "[class*='brick']",
    "[role='listitem']",
    "article"
  ];

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width >= 80 && rect.height >= 40;
  }

  function isNestedCandidate(element, candidates) {
    return candidates.some((candidate) => candidate !== element && candidate.contains(element));
  }

  function getCandidateElements(root = document) {
    const seen = new Set();
    const elements = [];

    for (const selector of CANDIDATE_SELECTORS) {
      for (const element of root.querySelectorAll(selector)) {
        if (!(element instanceof HTMLElement) || seen.has(element) || !isVisible(element)) {
          continue;
        }

        seen.add(element);
        elements.push(element);
      }
    }

    return elements.filter((element) => !isNestedCandidate(element, elements));
  }

  function clusterByAxis(cards, axis, tolerance = 56) {
    const sorted = [...cards].sort((left, right) => left.centre[axis] - right.centre[axis]);
    const groups = [];

    for (const card of sorted) {
      const lastGroup = groups.at(-1);
      if (!lastGroup) {
        groups.push({ key: card.centre[axis], cards: [card] });
        continue;
      }

      if (Math.abs(lastGroup.key - card.centre[axis]) <= tolerance) {
        lastGroup.cards.push(card);
        const total = lastGroup.cards.reduce((sum, item) => sum + item.centre[axis], 0);
        lastGroup.key = total / lastGroup.cards.length;
        continue;
      }

      groups.push({ key: card.centre[axis], cards: [card] });
    }

    return groups;
  }

  function scanBoard(root = document) {
    const elements = getCandidateElements(root);
    const cards = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        rect,
        centre: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      };
    });

    const columns = clusterByAxis(cards, "x");
    const rows = clusterByAxis(cards, "y");

    const columnIndexByElement = new Map();
    const rowIndexByElement = new Map();

    columns.forEach((group, index) => {
      group.cards.forEach((card) => {
        columnIndexByElement.set(card.element, index);
      });
    });

    rows.forEach((group, index) => {
      group.cards.forEach((card) => {
        rowIndexByElement.set(card.element, index);
      });
    });

    return {
      cards,
      columns,
      rows,
      columnIndexByElement,
      rowIndexByElement
    };
  }

  function getCardFromTarget(target, boardState) {
    if (!(target instanceof Element)) {
      return null;
    }

    const match = boardState.cards.find((card) => target === card.element || card.element.contains(target));
    return match ?? null;
  }

  globalThis.PadletCounterCore = {
    scanBoard,
    getCardFromTarget
  };
})();
