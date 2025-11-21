# Vibecoding quick index

Static GitHub Pages front page that lists any repository's directories/files via the GitHub API.

## How to use
- Initialize and push this folder to a GitHub repo (e.g. `git init`, add remote, `git add . && git commit -m "Add index" && git push -u origin main`).
- Turn on GitHub Pages for that repo (Settings → Pages → Deploy from Branch → `main` / `/`).
- Visit the published site; on `*.github.io/<repo>` it auto-detects owner/repo. Otherwise fill Owner/Repo/Branch in the form and hit Save.
- The browser fetches live contents from GitHub; directories are navigable, files link to GitHub and raw content.

## Notes
- Config is kept in `localStorage` (`vibecoding-repo`) so you can point the index at any repo without redeploying.
- GitHub API is unauthenticated here; heavy traffic could hit rate limits (60 req/hr per IP). Add your own tokenized fetch if needed.
