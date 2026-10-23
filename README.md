# PrintEase — Online Xerox & Document Printing Service

PrintEase is a modern web application designed for campus print shops and Xerox centers. Students and customers can upload PDF/image documents, configure printing options (color/black-and-white, duplex/single-sided, paper size, binding, and copies), review price calculations, and track their orders. Shopkeepers and administrators have access to an Owner Console to manage the print queue, update pricing, verify pickup codes, and monitor shop status.

---

## Architecture Overview

PrintEase uses a decoupled, serverless production architecture:

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│           STATIC FRONTEND            │       │             BACKEND API              │
│            (GitHub Pages)            │  ───> │               (Vercel)               │
│  https://vinayd-v10.github.io/       │  CORS │  https://your-backend.vercel.app     │
│  PrintEase/                          │       │                                      │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
                   │                                       │
                   ▼                                       ▼
        React + Vite Static SPA                 Node.js + Express Serverless
                                                ├── Supabase (Auth, DB, Storage)
                                                └── Razorpay (Payments)
```

1. **Frontend**: React + TypeScript + Vite deployed statically to **GitHub Pages** (`https://vinayd-v10.github.io/PrintEase/`).
2. **Backend**: Express application pre-bundled into a self-contained serverless entry point at `api/index.js` for **Vercel**.
3. **Database & Auth**: Supabase PostgreSQL and Supabase Auth with 6-digit email OTP.
4. **Document Storage**: Private Supabase Storage bucket (`print-documents`) with time-limited signed access URLs.
5. **Payments**: Server-authoritative Razorpay order creation and HMAC SHA-256 signature verification.

---

## Investigation & Fixes Applied

### 1. Fixed Vercel `ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/server/app'`
- **Cause**: Vercel serverless lambdas run in isolated containers where files outside the `api/` directory (e.g. `server/app.ts`) are not traced or compiled to `.js` files by default. Extensionless ESM imports threw runtime module resolution errors.
- **Fix**: Added an automated serverless build step (`npm run build:server` via `esbuild`) that inlines and bundles all server routes, middleware, and models into a standalone, zero-dependency `api/index.js` file (60 kB). Updated `vercel.json` to route all incoming requests directly to `/api/index.js`.

### 2. Dual-Prefix Route Mounting
- **Cause**: Vercel rewrites sometimes deliver paths with `/api` intact or stripped down to root.
- **Fix**: Express routes are mounted under both `/api/*` and bare root `/*` (e.g. `/api/auth/send-otp` and `/auth/send-otp`), ensuring requests always match regardless of proxy or rewrite settings.

### 3. Transparent Error Reporting (No Generic Masking)
- **Cause**: The frontend previously discarded response bodies whenever `Content-Type` was not `application/json` (such as on Vercel 500 edge errors or 404 HTML), throwing a generic `"Server returned an unexpected response. Please verify backend deployment."`
- **Fix**: Added `parseAuthResponse` in `src/components/AuthScreen.tsx` that reads and extracts the actual error snippet, HTTP status, and specific Supabase/backend messages, directly surfacing what configuration is missing or what error occurred.

### 4. GitHub Actions CI/CD Parameter Injection
- **Cause**: The GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) built the Vite frontend without passing `VITE_API_BASE_URL`.
- **Fix**: Updated `.github/workflows/deploy.yml` to inject `VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL || vars.VITE_API_BASE_URL }}` during `npm run build`. Added an in-app banner on GitHub Pages alerting users if the backend URL is not yet connected.

---

## Required Environment Variables

### 1. Vercel Environment Variables (Backend)
Configure these in your **Vercel Dashboard > Project Settings > Environment Variables**:

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `SUPABASE_URL` | **Yes** | Your Supabase project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase public anonymous API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase secret service role key (for admin tasks) | `eyJhbGciOi...` |
| `OWNER_EMAIL` | **Yes** | Designated administrator email address | `vinay8046d@gmail.com` |
| `FRONTEND_URL` | Recommended | Allowed CORS origin | `https://vinayd-v10.github.io` |
| `RAZORPAY_KEY_ID` | Optional | Razorpay Key ID for payments | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay Key Secret | `your_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Secret for webhook verification | `your_webhook_secret` |

> **Note on Email OTP & SMTP**:
> Supabase Auth handles email OTP delivery. In your **Supabase Dashboard > Project Settings > Authentication > Email**:
> - Confirm **Enable Email provider** is turned ON.
> - By default, Supabase provides a built-in email service with a rate limit of 3 emails per hour for development.
> - For production, enable **Custom SMTP** in Supabase and supply your own SMTP credentials (e.g. Gmail App Password, Resend, or SendGrid).

---

### 2. GitHub Pages Environment Variables (Frontend)
Configure this in your **GitHub Repository > Settings > Secrets and variables > Actions > Variables** (or Secrets):

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | Public HTTPS URL of your deployed Vercel backend | `https://your-printease-backend.vercel.app` |

---

## Deployment Steps

### Step 1: Deploy Backend to Vercel
1. Push the updated repository to GitHub:
   ```bash
   git add .
   git commit -m "Fix Vercel serverless bundle and OTP error handling"
   git push origin main
   ```
2. Open [vercel.com](https://vercel.com) and import the repository (or open your existing project).
3. In **Settings > Environment Variables**, ensure all required variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL`, `FRONTEND_URL`) are entered.
4. Redeploy the project on Vercel.
5. Once deployed, verify your backend health by opening in your browser:
   ```
   https://YOUR-BACKEND.vercel.app/api/health
   ```
   It should return:
   ```json
   {
     "ok": true,
     "service": "PrintEase API",
     "version": "2.0.0",
     "supabaseConfigured": true
   }
   ```

---

### Step 2: Deploy Frontend to GitHub Pages
1. Go to your GitHub repository: `https://github.com/vinayd-v10/PrintEase/settings/variables/actions`.
2. Add a new repository variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your Vercel backend URL (e.g., `https://your-backend.vercel.app`).
3. Trigger a redeploy:
   - Go to **Actions** tab.
   - Select **Deploy PrintEase to GitHub Pages**.
   - Click **Run workflow**.
4. Once completed, your live site at `https://vinayd-v10.github.io/PrintEase/` is now permanently connected to your Vercel backend!

*(Optional Runtime Fallback)*: You can also click the **"Connect API"** or **Server Settings** icon directly in the PrintEase footer on GitHub Pages at any time to test and store your Vercel URL in your browser without waiting for a rebuild.

---

## How to Test Send OTP Successfully

1. Open `https://vinayd-v10.github.io/PrintEase/` (or your local app at `http://localhost:3000`).
2. Click **Login** to open the Customer Login screen.
3. If your backend URL is not yet baked into GitHub Pages, click **Connect API** and paste your Vercel URL (e.g., `https://your-backend.vercel.app`), then click **Test & Connect**.
4. Enter your email address (e.g., `student@example.com`) and click **Send Verification Code**.
5. **Expected result**:
   - The screen transitions to the 6-digit OTP entry boxes with a 30-second cooldown timer.
   - Check your email inbox (and spam folder) for the 6-digit Supabase verification code.
   - Enter the code into the boxes — you will be authenticated and redirected to your student printing dashboard.
6. **Error Diagnosis**:
   - If Supabase environment variables are missing on Vercel, the screen will clearly display:
     `"Supabase authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY."`
   - If Supabase free tier email rate limit is hit, it will display:
     `"Email rate limit exceeded. Please wait a moment."`

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server (runs Express + Vite on port 3000)
npm run dev

# Run TypeScript check
npm run lint

# Build production bundles (Frontend + Serverless api/index.js)
npm run build
```

---

## License

Apache-2.0 License.
