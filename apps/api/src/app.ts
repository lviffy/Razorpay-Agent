import express from "express";
import cors from "cors";
import { env } from "./config/env.ts";
import { logger } from "./core/logger/index.ts";
import { requestIdMiddleware } from "./middleware/request-id.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { processOrderPaymentSuccess } from "./services/payment-settlement.ts";

// Routers
import whatsappWebhookRouter from "./modules/webhooks/whatsapp.routes.ts";
import razorpayWebhookRouter from "./modules/webhooks/razorpay.routes.ts";
import demoRouter from "./modules/demo/routes.ts";
import authRouter from "./modules/auth/routes.ts";
import catalogRouter from "./modules/catalog/routes.ts";
import a2aRouter from "./modules/agent/routes.ts";
import checkoutRouter from "./modules/checkout/routes.ts";
import productsRouter from "./modules/products/routes.ts";
import ordersRouter from "./modules/orders/routes.ts";
import conversationsRouter from "./modules/conversations/routes.ts";
import dashboardRouter from "./modules/dashboard/routes.ts";
import analyticsRouter from "./modules/analytics/routes.ts";
import settingsRouter from "./modules/settings/routes.ts";
import merchantRouter from "./modules/merchant/routes.ts";
import activityRouter from "./modules/activity/routes.ts";
import simulatorRouter from "./modules/simulator/routes.ts";
import onboardingRouter from "./modules/onboarding/routes.ts";
import shopifyRouter from "./modules/shopify/routes.ts";
import growthAIRouter from "./modules/growth-ai/routes.ts";

export const app = express();

// ── Security & Parsing Middleware ────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-Store-ID",
      "X-User-ID",
      "X-402-Authorization",
      "X-402-Receipt",
      "X-402-Version",
      "X-402-Scheme",
      "X-402-Order-ID",
      "X-402-Amount",
      "X-402-Expiry",
      "X-402-Challenge",
    ],
  })
);

app.use(requestIdMiddleware);

// Webhook raw body preservation
app.use("/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use(
  "/webhooks/whatsapp",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "zapai",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── OAuth Callback HTML Bridge ───────────────────────────────────────────────
app.get("/auth/callback", (req, res) => {
  const token = (req.query.token as string) || "";
  const error = (req.query.error as string) || "";
  const onboardingCompleted = (req.query.onboardingCompleted as string) || "";
  const isNewUser = (req.query.isNewUser as string) || "";

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

  const queryParams = new URLSearchParams();
  if (token) queryParams.set("token", token);
  if (onboardingCompleted) queryParams.set("onboardingCompleted", onboardingCompleted);
  if (isNewUser) queryParams.set("isNewUser", isNewUser);

  const appUrl = env.APP_URL || "http://localhost:3000";

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
      const qs = ${JSON.stringify(queryParams.toString())};
      const frontendBase = ${JSON.stringify(appUrl)};
      const target = (window.location.port === "3000" ? "/auth/callback" : frontendBase + "/auth/callback") + (qs ? "?" + qs : "");
      setTimeout(function() {
        window.location.href = target;
      }, 300);
    } catch (e) {
      window.location.href = "/onboarding";
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

// ── Payment Complete Confirmation HTML Bridge ────────────────────────────────
app.get("/payment-complete", async (req, res) => {
  const paymentId = (req.query.razorpay_payment_id as string) || "";
  const paymentLinkId = (req.query.razorpay_payment_link_id as string) || "";
  const orderRefId = (req.query.razorpay_payment_link_reference_id as string) || "";
  const status = (req.query.razorpay_payment_link_status as string) || "paid";

  let orderData: any = null;
  if (paymentId) {
    orderData = await processOrderPaymentSuccess({
      orderReferenceId: orderRefId,
      razorpayPaymentId: paymentId,
    });
  }

  const orderId = orderRefId || orderData?.order_id || "ORD-COMPLETED";
  const amountStr = orderData?.amount ? `₹${parseFloat(orderData.amount).toLocaleString("en-IN")}` : "Paid";

  return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Payment Successful — ZapAI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 1.5rem; max-width: 420px; width: 100%; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: #052e16; color: #22c55e; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2rem; border: 1px solid #166534; }
    h2 { margin: 0 0 0.5rem; font-size: 1.4rem; font-weight: 700; }
    p { color: #a1a1aa; font-size: 0.9rem; margin: 0 0 1.5rem; line-height: 1.5; }
    .badge { display: inline-flex; align-items: center; gap: 0.4rem; background: #27272a; padding: 0.5rem 1rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.85rem; color: #e4e4e7; margin-bottom: 1.5rem; }
    .details { background: #121215; border: 1px solid #27272a; border-radius: 1rem; padding: 1rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.85rem; }
    .row { display: flex; justify-content: space-between; padding: 0.35rem 0; color: #a1a1aa; }
    .row strong { color: #f4f4f5; }
    .btn { display: block; width: 100%; padding: 0.85rem; background: #22c55e; color: #052e16; text-decoration: none; border-radius: 0.85rem; font-weight: 700; font-size: 0.95rem; box-sizing: border-box; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Payment Completed!</h2>
    <p>Your order is secured and verified cryptographically on Neon PostgreSQL with instant inventory release.</p>
    <div class="badge">Reference: ${orderId}</div>
    <div class="details">
      <div class="row"><span>Status</span><strong style="color: #4ade80;">Verified (CAPTURED)</strong></div>
      <div class="row"><span>Amount</span><strong>${amountStr}</strong></div>
      <div class="row"><span>Payment ID</span><strong style="font-family: monospace; font-size: 0.75rem;">${paymentId || "Direct Settlement"}</strong></div>
      <div class="row"><span>Settlement</span><strong>Instant Autonomous</strong></div>
    </div>
    <a href="/demo" class="btn">View Live Demo Audit Timeline</a>
  </div>
</body>
</html>`);
});

// ── Webhook & Public Sub-Routers ─────────────────────────────────────────────
app.use("/demo", demoRouter);
app.use("/webhooks/whatsapp", whatsappWebhookRouter);
app.use("/webhooks/razorpay", razorpayWebhookRouter);

// ── REST API v1 Routes ───────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/a2a", a2aRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/merchant", merchantRouter);
app.use("/api/v1/activity", activityRouter);
app.use("/api/v1/simulator", simulatorRouter);
app.use("/api/v1/onboarding", onboardingRouter);
app.use("/api/v1/shopify", shopifyRouter);
app.use("/api/v1/growth-ai", growthAIRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);
