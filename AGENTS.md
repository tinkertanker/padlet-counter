# Padlet Counter

- Production `https://padlet-counter.tk.sg` is served by Cloudflare Workers Static Assets, Worker `padlet-counter`, in the Tinkertanker account. `wrangler.jsonc` is the hosting configuration; README.md documents deployment.
- Run `npm ci` and `npm run check` to validate. `npm run deploy` builds the static hosting directory and deploys with Wrangler; verify the Tinkertanker identity before an explicitly authorized deployment.
- `src/counter.js` owns extension/bookmarklet behavior. `scripts/build-bookmarklet.mjs` generates the installer and bookmarklet; `scripts/build-cloudflare.mjs` packages only public assets into `dist/`. Do not edit generated files directly.
- Docker on `dev.tk.sg` was retired on 2026-09-12. Do not run the legacy `deploy.sh` or Compose configuration: they can recreate the old service.
- Deployment is manual. Pushing source does not deploy the site. Do not assume Cloudflare, GitHub, and the Amp Git repository are synchronized; inspect actual remote and deployment state.
