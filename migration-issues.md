Viewed railway.toml:1-11
Viewed Dockerfile:1-12
Viewed docker-compose.yml:1-12
Listed directory Razorpay-Agent

Here is the exact breakdown of what risks exist for your **already deployed pipeline (e.g. Railway / Docker / Vercel)** and **live webhook / callback links**, along with the solutions to ensure **zero downtime and no broken links**:

---

### 1. Build & Start Commands in Hosting Platforms (e.g., Railway / Docker)

#### ⚠️ The Risk:
* Your [railway.toml](file:///home/lviffy/Projects/Razorpay-Agent/railway.toml) currently has:
  ```toml
  [deploy]
  startCommand = "bun src/index.ts"
  ```
* Your [Dockerfile](file:///home/lviffy/Projects/Razorpay-Agent/Dockerfile) currently has:
  ```dockerfile
  CMD ["bun", "src/index.ts"]
  ```
* If the backend entrypoint is moved to `apps/api/src/index.ts`, your next Railway auto-deploy on git push will fail with `Cannot find module 'src/index.ts'`.

#### 🛡️ The Fix:
1. Update [railway.toml](file:///home/lviffy/Projects/Razorpay-Agent/railway.toml) to:
   ```toml
   [deploy]
   startCommand = "bun run --filter=@zapai/api start"
   ```
2. Update root [package.json](file:///home/lviffy/Projects/Razorpay-Agent/package.json) so root scripts stay backward-compatible:
   ```json
   "scripts": {
     "start": "bun run --filter=@zapai/api start",
     "dev": "turbo run dev",
     "migrate": "bun run --filter=@zapai/database migrate"
   }
   ```
3. Update [Dockerfile](file:///home/lviffy/Projects/Razorpay-Agent/Dockerfile) to build the workspace properly so all packages (`@zapai/types`, `@zapai/database`) are included in the container.

---

### 2. Live Webhooks, OAuth & Payment Redirect URLs

#### ⚠️ The Risk:
In production, third-party platforms have already hardcoded your live domain URLs:
* **Meta WhatsApp Cloud API**: Webhook configured as `https://your-domain.up.railway.app/webhooks/whatsapp`
* **Razorpay Dashboard**: Webhook configured as `https://your-domain.up.railway.app/webhooks/razorpay`
* **Google Cloud Console (OAuth 2.0)**: Authorized redirect URIs configured as:
  * `https://your-domain.up.railway.app/api/v1/auth/google/callback`
  * `https://your-domain.up.railway.app/auth/callback`
* **Razorpay Payment Links**: Redirect URL configured as `https://your-domain.up.railway.app/payment-complete`

If any route path prefix changes during the refactoring (e.g., nesting `/webhooks` inside `/api/v1/webhooks` or changing query params), **live customer payments and WhatsApp messages will immediately fail with 404**.

#### 🛡️ The Fix:
* **Strict Route Preservation**: We keep every single existing route path mounted at the exact same public URL:
  * `/webhooks/whatsapp` (GET verification & POST message)
  * `/webhooks/razorpay` (POST signature verification)
  * `/auth/callback` & `/payment-complete` (HTML redirect bridges)
  * `/api/v1/*` (All dashboard & API endpoints)
  * `/health` (Healthcheck used by Railway/Docker)

---

### 3. Environment Variables & Zod Validation Failures

#### ⚠️ The Risk:
* On Railway / Vercel, not all optional environment variables may be configured in your live dashboard (e.g., you might have `DATABASE_URL` and `RAZORPAY_KEY_ID`, but `SHOPIFY_API_SECRET` or `GROQ_API_KEY` might be omitted).
* If we introduce strict Zod validation that treats **optional third-party integrations as required**, the deployed backend will throw a validation error and crash on startup.

#### 🛡️ The Fix:
* Define a 2-tier environment validation schema:
  1. **Strictly Required at Boot**: `DATABASE_URL`, `PORT`, `JWT_SECRET`.
  2. **Optional with Graceful Fallback**: `REDIS_URL` (falls back to memory queue if omitted), `SHOPIFY_*`, `GROQ_API_KEY`, `X402_SIGNING_SECRET` (defaults if unset), `CLOUDINARY_*`.
* The server will boot normally even if non-essential provider keys are missing in your deployment environment.

---

### 4. Next.js Frontend Rewrites & Separate Frontend Deployments

#### ⚠️ The Risk:
* [apps/web/next.config.ts](file:///home/lviffy/Projects/Razorpay-Agent/apps/web/next.config.ts) rewrites API traffic via `process.env.NEXT_PUBLIC_BACKEND_URL`:
  ```typescript
  source: "/api/v1/:path*",
  destination: `${backendUrl}/api/v1/:path*`
  ```
* If `apps/web` is deployed separately (e.g. on Vercel), it needs to resolve `@zapai/types` without requiring complex build steps.

#### 🛡️ The Fix:
* `@zapai/types` and `@zapai/config-typescript` will be configured as lightweight TypeScript packages with direct source exports (`src/index.ts`).
* Next.js compiles them directly with `transpilePackages: ["@zapai/types"]` without needing a separate pre-compilation step.

---

### Summary Checklist to Prevent Any Live Issues:

| Concern | Live Risk | Safeguard |
|---|---|---|
| **Railway Deploy** | Fails to find `src/index.ts` | Update `railway.toml`, `Dockerfile`, and root `package.json` scripts. |
| **Meta WhatsApp Hook** | Inbound messages drop | Preserve `/webhooks/whatsapp` URL and HMAC raw body pipeline. |
| **Razorpay Webhook** | Payment capture fails | Preserve `/webhooks/razorpay` URL and raw body verification. |
| **Google Sign-In** | OAuth redirect fails | Preserve `/auth/callback` and `/api/v1/auth/google/callback`. |
| **Env Variables** | Container crashes on boot | Make non-essential integration keys optional with defaults in Zod. |
| **Live Domain** | URL mismatch | All internal path refactoring is invisible to external callers. |