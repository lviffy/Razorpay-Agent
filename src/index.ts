import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, migrate } from "./db/migrate.ts";
import { redis } from "./services/redis.ts";
import { startWhatsAppWorker } from "./workers/whatsapp-worker.ts";

// ── Routes ───────────────────────────────────────────────────────────────────
import whatsappRouter from "./api/whatsapp.ts";
import catalogRouter from "./api/catalog.ts";
import a2aRouter from "./api/a2a.ts";
import checkoutRouter from "./api/checkout.ts";
import razorpayWebhookRouter from "./api/razorpay-webhook.ts";
import demoRouter from "./api/demo.ts";

// ── New Full Dashboard REST APIs ──────────────────────────────────────────────
import dashboardRouter from "./api/dashboard.ts";
import productsRouter from "./api/products.ts";
import ordersRouter from "./api/orders.ts";
import conversationsRouter from "./api/conversations.ts";
import analyticsRouter from "./api/analytics.ts";
import settingsRouter from "./api/settings.ts";
import merchantRouter from "./api/merchant.ts";
import activityRouter from "./api/activity.ts";
import simulatorRouter from "./api/simulator.ts";
import onboardingRouter from "./api/onboarding.ts";
import authRouter from "./api/auth.ts";

const app = express();
const PORT = parseInt(process.env.PORT || "8000", 10);

// ── CORS & Body Parsing Middleware ────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-402-Authorization", "X-402-Receipt", "X-402-Version", "X-402-Scheme", "X-402-Order-ID", "X-402-Amount", "X-402-Expiry", "X-402-Challenge"],
  })
);

// Raw body needed for Razorpay & Meta webhook HMAC verification
app.use("/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use("/webhooks/whatsapp", express.json());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "zapai",
    timestamp: new Date().toISOString(),
  });
});

// ── OAuth Callback Handler (for direct backend redirects) ──────────────────────
app.get("/auth/callback", (req, res) => {
  const token = (req.query.token as string) || "";
  const error = (req.query.error as string) || "";

  if (error) {
    return res.status(400).send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Authentication Error</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;">
  <div style="text-align:center;padding:2.5rem;background:white;border-radius:1rem;border:1px solid #fee2e2;max-width:380px;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
    <h3 style="color:#dc2626;margin:0 0 0.5rem;font-size:1.1rem;">Authentication Failed</h3>
    <p style="color:#71717a;font-size:0.85rem;margin:0 0 1.25rem;">${error}</p>
    <a href="/login" style="display:inline-block;padding:0.6rem 1.2rem;background:#18181b;color:white;text-decoration:none;border-radius:0.75rem;font-size:0.8rem;font-weight:600;">Return to Sign In</a>
  </div>
</body></html>`);
  }

  return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Completing Sign In...</title>
  <script>
    try {
      const token = ${JSON.stringify(token)};
      if (token) {
        localStorage.setItem("zapai_auth_token", token);
        document.cookie = "zapai_auth_token=" + token + "; path=/; max-age=2592000; SameSite=Lax";
      }
      // Redirect to local Next.js frontend or current host /dashboard
      const target = window.location.port === "3000" ? "/dashboard" : "http://localhost:3000/dashboard";
      setTimeout(function() {
        window.location.href = target;
      }, 300);
    } catch (e) {
      window.location.href = "/dashboard";
    }
  </script>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fbfbfd;">
  <div style="text-align:center;padding:2.5rem;background:white;border-radius:1.25rem;border:1px solid #e4e4e7;max-width:380px;box-shadow:0 20px 35px rgba(0,0,0,0.06);">
    <div style="width:48px;height:48px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.5rem;">⚡</div>
    <h3 style="color:#09090b;margin:0 0 0.4rem;font-size:1.1rem;font-weight:700;">Signed in with Google</h3>
    <p style="color:#71717a;font-size:0.85rem;margin:0;">Redirecting to your merchant cockpit...</p>
  </div>
</body>
</html>`);
});

// ── Core Protocol Routes ──────────────────────────────────────────────────────
app.use("/webhooks/whatsapp", whatsappRouter);
app.use("/webhooks/razorpay", razorpayWebhookRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/a2a", a2aRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/demo", demoRouter);

// ── Full Dashboard & Management REST APIs ─────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/merchant", merchantRouter);
app.use("/api/v1/activity", activityRouter);
app.use("/api/v1/simulator", simulatorRouter);
app.use("/api/v1/onboarding", onboardingRouter);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 ZapAI running on port ${PORT}`);
    console.log(`   Health:      http://0.0.0.0:${PORT}/health`);
    console.log(`   Dashboard:   http://0.0.0.0:${PORT}/api/v1/dashboard/overview`);
    console.log(`   Products:    http://0.0.0.0:${PORT}/api/v1/products`);
    console.log(`   Orders:      http://0.0.0.0:${PORT}/api/v1/orders`);
    console.log(`   Demo:        http://0.0.0.0:${PORT}/demo`);
    console.log(`   Catalog:     http://0.0.0.0:${PORT}/api/v1/catalog`);
    console.log(`   WA Hook:     ${process.env.APP_URL}/webhooks/whatsapp`);
    console.log(`   RZP Hook:    ${process.env.APP_URL}/webhooks/razorpay\n`);
  });

  try {
    // Run schema migration & seed check
    await migrate();
    console.log("✅ Neon DB connected & schema verified");

    // Verify Redis connection
    await redis.ping();
    console.log("✅ Redis connected");

    // Start async WhatsApp worker
    startWhatsAppWorker();
    console.log("✅ WhatsApp worker started");
  } catch (err) {
    console.error("⚠️ Background initialization error:", err);
  }
}

start();
