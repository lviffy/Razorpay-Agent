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
    service: "agentbridge",
    timestamp: new Date().toISOString(),
  });
});

// ── Core Protocol Routes ──────────────────────────────────────────────────────
app.use("/webhooks/whatsapp", whatsappRouter);
app.use("/webhooks/razorpay", razorpayWebhookRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/a2a", a2aRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/demo", demoRouter);

// ── Full Dashboard & Management REST APIs ─────────────────────────────────────
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
    console.log(`\n🚀 AgentBridge running on port ${PORT}`);
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
