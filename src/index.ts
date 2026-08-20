import "dotenv/config";
import express from "express";
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

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// ── Middleware ────────────────────────────────────────────────────────────────
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

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/webhooks/whatsapp", whatsappRouter);
app.use("/webhooks/razorpay", razorpayWebhookRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/a2a", a2aRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/demo", demoRouter);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 AgentBridge running on port ${PORT}`);
    console.log(`   Health:    http://0.0.0.0:${PORT}/health`);
    console.log(`   Demo:      http://0.0.0.0:${PORT}/demo`);
    console.log(`   Catalog:   http://0.0.0.0:${PORT}/api/v1/catalog`);
    console.log(`   WA Hook:   ${process.env.APP_URL}/webhooks/whatsapp`);
    console.log(`   RZP Hook:  ${process.env.APP_URL}/webhooks/razorpay\n`);
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
