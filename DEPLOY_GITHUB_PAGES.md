# How to Deploy PrintEase to GitHub Pages

If your website previously displayed a **blank white page** on GitHub Pages, this has now been completely diagnosed and resolved.

---

## Why did GitHub Pages show a blank white page?

1. **Source Code vs. Build Output**: If GitHub Pages is configured to serve the root repository (`/`), it tries to load `<script src="/src/main.tsx">`. Web browsers cannot execute TypeScript/JSX (`.tsx`) files directly without a build step, resulting in a blank white screen.
2. **Missing Base Path & Trailing Slashes**: GitHub Pages hosts repositories at `https://<username>.github.io/<repo-name>/`. Without proper base path resolution or when accessed without a trailing slash (`/`), the browser attempts to fetch assets from `https://<username>.github.io/assets/...` (which results in 404 Not Found errors).
3. **Missing `.nojekyll`**: GitHub Pages runs Jekyll by default, which can block or ignore certain directories or filenames.
4. **SPA 404 Routing**: Refreshing or loading nested states on GitHub Pages serves a 404 error page unless a `404.html` fallback is provided.

---

## All Fixes Applied to the Codebase

- **Automatic GitHub Pages workflow**: Added `.github/workflows/deploy.yml` which automatically builds and deploys to GitHub Pages on every push.
- **Dynamic Base Path**: Updated `vite.config.ts` to automatically detect your repository name (`/${repoName}/`) in GitHub Actions, while defaulting to `./` for universal compatibility.
- **Trailing Slash Correction & SPA redirect**: Added in `index.html` and `public/404.html` so asset paths resolve reliably regardless of URL format.
- **Bypass Jekyll Processing**: Added `.nojekyll` to build output.
- **Dual Output (`dist/` & `docs/`)**: The build command automatically updates both `dist` and `docs/` so you can deploy using any method you prefer.
- **Branded Instant Loader**: Added an inline theme-matching loader in `index.html` so visitors never see a blank white page while scripts load.

---

## 3 Easy Ways to Deploy

### Option 1: Automatic Deployment with GitHub Actions (Recommended)
This requires zero manual builds and automatically deploys whenever you push to GitHub:
1. Commit and push the repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. On GitHub, go to your repository **Settings** > **Pages** (in left sidebar).
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. GitHub Actions will automatically run the build and publish your site at `https://<username>.github.io/<repo-name>/`.

---

### Option 2: One-Command CLI Deployment (`gh-pages`)
1. Run in your terminal:
   ```bash
   npm run deploy
   ```
   *(This automatically builds your app and publishes it to the `gh-pages` branch)*.
2. On GitHub, go to **Settings** > **Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Set Branch to **`gh-pages`** and folder to **`/(root)`**, then click **Save**.

---

### Option 3: Deploy via `/docs` Folder
1. Run:
   ```bash
   npm run build
   ```
   *(This creates the build in both `dist/` and `docs/`)*.
2. Commit and push the `docs/` directory to GitHub:
   ```bash
   git add docs/
   git commit -m "Build for GitHub Pages docs"
   git push origin main
   ```
3. On GitHub, go to **Settings** > **Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Select Branch **`main`** (or `master`) and Folder **`/docs`**, then click **Save**.
