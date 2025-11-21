# Vibecoding quick index

Static GitHub Pages front page that lists HTML pages under `web/` in a repository via the GitHub API and links to open them directly.

## How to use
- Initialize and push this folder to a GitHub repo (e.g. `git init`, add remote, `git add . && git commit -m "Add index" && git push -u origin main`).
- Turn on GitHub Pages for that repo (Settings → Pages → Deploy from Branch → `main` / `/`).
- Visit the published site; on `*.github.io/<repo>` it auto-detects owner/repo. Otherwise fill Owner/Repo/Branch in the form and hit Save.
- The browser fetches `web/` contents from GitHub; any `.html` file there will show as a card that opens the live page (`/web/<file>.html`), with raw/GitHub links beside it.

## Notes
- Config is kept in `localStorage` (`vibecoding-repo`) so you can point the index at any repo without redeploying.
- GitHub API is unauthenticated here; heavy traffic could hit rate limits (60 req/hr per IP). Add your own tokenized fetch if needed.
