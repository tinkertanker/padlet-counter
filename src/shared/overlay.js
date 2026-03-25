(() => {
  if (globalThis.PadletCounterOverlay) {
    return;
  }

  const PANEL_ID = "padlet-counter-panel";
  const STYLE_ID = "padlet-counter-style";
  const ACTIVE_ROW_ATTR = "data-padlet-counter-row-active";
  const ACTIVE_COLUMN_ATTR = "data-padlet-counter-column-active";
  const ROOT_ATTR = "data-padlet-counter-root";

  function ensureStyles(documentRef) {
    if (documentRef.getElementById(STYLE_ID)) {
      return;
    }

    const style = documentRef.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: 280px;
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(19, 37, 64, 0.15);
        background: rgba(255, 252, 247, 0.96);
        box-shadow: 0 16px 40px rgba(19, 37, 64, 0.16);
        color: #132540;
        font: 13px/1.45 "Avenir Next", "Segoe UI", sans-serif;
        backdrop-filter: blur(10px);
      }

      #${PANEL_ID} button {
        border: 0;
        border-radius: 999px;
        padding: 8px 12px;
        background: #132540;
        color: #fff;
        cursor: pointer;
        font: inherit;
      }

      #${PANEL_ID} button[data-mode="ghost"] {
        background: #e8edf5;
        color: #132540;
      }

      #${PANEL_ID} .padlet-counter-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      [${ROOT_ATTR}] [${ACTIVE_ROW_ATTR}] {
        outline: 3px solid rgba(255, 107, 53, 0.88);
        outline-offset: 3px;
      }

      [${ROOT_ATTR}] [${ACTIVE_COLUMN_ATTR}] {
        box-shadow: 0 0 0 4px rgba(20, 115, 230, 0.72);
        border-radius: 10px;
      }
    `;

    documentRef.head.append(style);
    documentRef.documentElement.setAttribute(ROOT_ATTR, "true");
  }

  function clearHighlights(boardState) {
    for (const card of boardState.cards) {
      card.element.removeAttribute(ACTIVE_ROW_ATTR);
      card.element.removeAttribute(ACTIVE_COLUMN_ATTR);
    }
  }

  function updateHighlights(boardState, hoveredCard) {
    clearHighlights(boardState);

    if (!hoveredCard) {
      return;
    }

    const rowIndex = boardState.rowIndexByElement.get(hoveredCard.element);
    const columnIndex = boardState.columnIndexByElement.get(hoveredCard.element);

    for (const card of boardState.cards) {
      if (boardState.rowIndexByElement.get(card.element) === rowIndex) {
        card.element.setAttribute(ACTIVE_ROW_ATTR, "true");
      }

      if (boardState.columnIndexByElement.get(card.element) === columnIndex) {
        card.element.setAttribute(ACTIVE_COLUMN_ATTR, "true");
      }
    }
  }

  function ensurePanel(documentRef, source) {
    const existing = documentRef.getElementById(PANEL_ID);
    if (existing) {
      return existing;
    }

    const panel = documentRef.createElement("aside");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <strong>Padlet Counter</strong>
      <div id="padlet-counter-summary" style="margin-top: 8px;">Scanning board…</div>
      <div id="padlet-counter-focus" style="margin-top: 6px; min-height: 40px;">Hover a post to inspect its row and column.</div>
      <div class="padlet-counter-actions">
        <button type="button" id="padlet-counter-rescan">Rescan</button>
        <button type="button" id="padlet-counter-close" data-mode="ghost">${source === "bookmarklet" ? "Dismiss" : "Hide"}</button>
      </div>
    `;

    documentRef.body.append(panel);
    return panel;
  }

  function setPanelText(documentRef, boardState, hoveredCard) {
    const summary = documentRef.getElementById("padlet-counter-summary");
    const focus = documentRef.getElementById("padlet-counter-focus");

    if (!summary || !focus) {
      return;
    }

    summary.textContent = `${boardState.cards.length} posts detected across ${boardState.columns.length} columns and ${boardState.rows.length} rows.`;

    if (!hoveredCard) {
      focus.textContent = "Hover a post to inspect its row and column.";
      return;
    }

    const rowIndex = boardState.rowIndexByElement.get(hoveredCard.element);
    const columnIndex = boardState.columnIndexByElement.get(hoveredCard.element);
    const rowCount = boardState.rows[rowIndex]?.cards.length ?? 0;
    const columnCount = boardState.columns[columnIndex]?.cards.length ?? 0;

    focus.textContent = `Row ${rowIndex + 1}: ${rowCount} posts. Column ${columnIndex + 1}: ${columnCount} posts.`;
  }

  function bootstrapPadletCounter({ source }) {
    const { scanBoard, getCardFromTarget } = globalThis.PadletCounterCore;

    if (globalThis.__PADLET_COUNTER_CONTROLLER__) {
      globalThis.__PADLET_COUNTER_CONTROLLER__.refresh();
      return;
    }

    ensureStyles(document);
    const panel = ensurePanel(document, source);

    let boardState = scanBoard(document);
    let enabled = true;

    const refresh = () => {
      boardState = scanBoard(document);
      clearHighlights(boardState);
      setPanelText(document, boardState, null);
    };

    const onPointerMove = (event) => {
      if (!enabled) {
        return;
      }

      const hoveredCard = getCardFromTarget(event.target, boardState);
      updateHighlights(boardState, hoveredCard);
      setPanelText(document, boardState, hoveredCard);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });

    panel.querySelector("#padlet-counter-rescan")?.addEventListener("click", refresh);
    panel.querySelector("#padlet-counter-close")?.addEventListener("click", () => {
      enabled = false;
      clearHighlights(boardState);
      panel.remove();
      document.removeEventListener("pointermove", onPointerMove);
      delete globalThis.__PADLET_COUNTER_CONTROLLER__;
    });

    globalThis.__PADLET_COUNTER_CONTROLLER__ = {
      refresh
    };

    refresh();
  }

  globalThis.PadletCounterOverlay = {
    bootstrapPadletCounter
  };
})();
