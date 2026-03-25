(() => {
  if (window.__PADLET_COUNTER_ACTIVE__) {
    return;
  }

  window.__PADLET_COUNTER_ACTIVE__ = true;
  globalThis.PadletCounterOverlay.bootstrapPadletCounter({ source: "extension" });
})();
