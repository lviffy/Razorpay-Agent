import "dotenv/config";
import express from "express";
import cors from "cors";

// Routers
import dashboardRouter from "../src/api/dashboard.ts";
import productsRouter from "../src/api/products.ts";
import ordersRouter from "../src/api/orders.ts";
import conversationsRouter from "../src/api/conversations.ts";
import analyticsRouter from "../src/api/analytics.ts";
import settingsRouter from "../src/api/settings.ts";
import merchantRouter from "../src/api/merchant.ts";
import activityRouter from "../src/api/activity.ts";
import simulatorRouter from "../src/api/simulator.ts";
import onboardingRouter from "../src/api/onboarding.ts";

const app = express();
app.use(cors());
app.use(express.json());

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

const server = app.listen(3099, async () => {
  console.log("Test server listening on port 3099");
  try {
    const endpoints = [
      "/api/v1/dashboard/overview",
      "/api/v1/products",
      "/api/v1/orders",
      "/api/v1/conversations",
      "/api/v1/analytics",
      "/api/v1/settings/rules",
      "/api/v1/settings/agent",
      "/api/v1/merchant/profile",
      "/api/v1/activity",
      "/api/v1/activity/notifications",
      "/api/v1/onboarding/session",
    ];

    for (const ep of endpoints) {
      const res = await fetch(`http://localhost:3099${ep}`);
      const json = await res.json();
      console.log(`✅ [GET ${ep}] -> Status: ${res.status} | Data Keys: ${Object.keys(json).length > 0 ? (Array.isArray(json) ? `Array(${json.length})` : Object.keys(json).join(", ")) : "empty"}`);
    }

    // Test POST to products
    const createProdRes = await fetch("http://localhost:3099/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Marathon Hydro Flask",
        price: 999,
        minPrice: 850,
        inventory: 25,
        category: "Accessories",
      }),
    });
    const createdProd = await createProdRes.json();
    console.log(`✅ [POST /api/v1/products] -> Status: ${createProdRes.status} | Created ID: ${createdProd.id}`);

    // Test POST simulator chat
    const simRes = await fetch("http://localhost:3099/api/v1/simulator/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Can you do ₹3,600 for Nike Pegasus?",
      }),
    });
    const simJson = await simRes.json();
    console.log(`✅ [POST /api/v1/simulator/chat] -> Status: ${simRes.status} | Reply: "${simJson.reply.slice(0, 60)}..."`);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});
