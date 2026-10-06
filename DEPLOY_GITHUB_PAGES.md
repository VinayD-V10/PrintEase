# How to Deploy PrintEase to GitHub Pages

If your website previously displayed a **blank white page** or was **stuck on the "Loading Campus Xerox & Print Station..." screen** (as seen at `vinayd-v10.github.io/PrintEase/`), here is the exact diagnosis and resolution.

---

## Why did it stay stuck on "Loading Campus Xerox & Print Station..."?

When you pushed your repository and deployed via GitHub Pages (`Deploy from a branch -> main / (root)`):
1. **GitHub Pages served the root `index.html`**:
   The root `index.html` contained `<script type="module" src="/src/main.tsx"></script>`.
2. **Browsers cannot run uncompiled `.tsx` files**:
   Browsers do not understand TypeScript or JSX without transpilation. GitHub Pages returned a 404/MIME error for `/src/main.tsx`.
3. **`dist/` was ignored by git**:
   Previously, `.gitignore` contained `dist/`, so even after building locally, the compiled JavaScript was not pushed to your GitHub repository.
4. **React never mounted**:
   Because the script failed to download, React never mounted to replace the loading screen. The animated loading bar stayed visible indefinitely.

---

## All Fixes Applied to the Codebase

- **Un-ignored Production Builds**: Removed `dist/` from `.gitignore` so your compiled files can be pushed to GitHub.
- **Root-Level Asset Syncing (`assets/`)**: Every `npm run build` now places production-ready bundles (`assets/index.js` and `assets/index.css`) directly in the root, in `docs/`, and in `dist/`.
- **Intelligent Dual-Mode Loader in `index.html`**:
  - In local development (`npm run dev`), it loads `/src/main.tsx` via Vite.
  - On GitHub Pages (`vinayd-v10.github.io/PrintEase/`), it automatically detects static hosting and instantly launches `./assets/index.js` and `./assets/index.css`.
- **Interactive Fallback Watchdog**: Added a timeout fallback with a "Launch PrintEase Station" button so visitors can never get stuck even on heavily throttled network connections.
- **Automatic GitHub Pages workflow (`.github/workflows/deploy.yml`)**: Official GitHub Actions workflow that builds and deploys on every push to `main`.
- **SPA 404 Routing (`404.html`) & Jekyll Bypass (`.nojekyll`)**: Handles page refreshes, sub-routes, and prevents Jekyll from interfering with static assets.

---

## How to Update Your Live GitHub Pages Site

### Step 1: Push the Latest Code to GitHub
Run the following in your terminal:
```bash
git add .
git commit -m "Fix GitHub Pages deployment and bundle loader"
git push origin main
```

---

### Step 2: Choose Your Preferred GitHub Pages Setting

You can use **any** of the 3 methods below—all 3 are fully supported:

#### Method A: Direct Root Deployment (Fastest, zero config change)
If your GitHub Pages is already set to **Deploy from a branch** (`main` / `/(root)`):
- Simply pushing the code in Step 1 will fix it!
- Because `./assets/` and the automatic fallback loader are now in the root of the repository, your live site `https://vinayd-v10.github.io/PrintEase/` will now load and open immediately.

#### Method B: Deploy from `/docs` Folder
1. On GitHub, go to your repository **Settings** > **Pages** (in the left sidebar).
2. Under **Build and deployment** -> **Source**, keep **Deploy from a branch**.
3. Under **Branch**, select **`main`** and choose folder **`/docs`**, then click **Save**.

#### Method C: GitHub Actions (Recommended for automated builds)
1. On GitHub, go to **Settings** > **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. GitHub Actions will automatically run `.github/workflows/deploy.yml` and publish your build to GitHub Pages.

2. Commit and push the `docs/` directory to GitHub:
   ```bash
   git add docs/
   git commit -m "Build for GitHub Pages docs"
   git push origin main
   ```
3. On GitHub, go to **Settings** > **Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Select Branch **`main`** (or `master`) and Folder **`/docs`**, then click **Save**.
