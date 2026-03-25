# AGENTS.md

This repo keeps the implementation intentionally small and legible.

## Read first

- [`README.md`](/Users/yingjie/Developer/tt-projects/padlet-counter/README.md) is the source of truth for setup and usage.
- `src/shared/` is the source of truth for Padlet DOM heuristics and overlay behaviour.
- `scripts/build.mjs` is the only build entrypoint and should stay dependency-light unless there is a clear payoff.

## Working norms

- Prefer changing shared logic before forking behaviour between extension and bookmarklet.
- Keep Padlet-specific selectors and heuristics centralised in `src/shared/padlet-counter.js`.
- If behaviour changes materially, update [`README.md`](/Users/yingjie/Developer/tt-projects/padlet-counter/README.md) in the same change.
