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

#### Method C: GitHub Actions (Automated CI/CD Workflow)
1. On GitHub, navigate to your repository: **Settings** > **Pages** (in the left navigation).
2. Under **Build and deployment** -> **Source**, switch the dropdown from *Deploy from a branch* to **GitHub Actions**.
3. Under repository **Settings** -> **Actions** -> **General**:
   - Scroll down to **Workflow permissions**.
   - Ensure **Read and write permissions** is selected (allows GitHub Pages deployment token write access).
4. Push your changes (`git add . && git commit -m "Fix CI dependencies and lockfile" && git push origin main`).
5. Go to the **Actions** tab on GitHub: The `Deploy PrintEase to GitHub Pages / build-and-deploy` workflow will now complete with a green checkmark and automatically deploy your application!

---

## Why was `build-and-deploy (push)` Failing?
1. **Missing `package-lock.json`**:
   The workflow `actions/setup-node@v4` with `cache: 'npm'` strictly required a lockfile. Without `package-lock.json`, the setup step threw an immediate fatal error: `Dependencies lock file is not found`.
2. **`esbuild` Peer Dependency Conflict (`ERESOLVE`)**:
   `esbuild@^0.25.0` was pinned in `devDependencies` which collided with Vite 8's required peer dependency range (`esbuild@^0.27.0 || ^0.28.0`), causing `npm ci` and `npm install` to abort with exit code 1.
3. **Repository Pages Source Setting**:
   If the GitHub repository's **Pages Source** was set to *Deploy from a branch*, the `actions/deploy-pages@v4` step could not request deployment without the Source being toggled to **GitHub Actions**.

All dependency conflicts and lockfile requirements are now resolved and verified!
