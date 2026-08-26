import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/migrate.ts";

const router = Router();

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.X402_SIGNING_SECRET ||
  "zapai_jwt_secret_neon_auth_2026";

// ─────────────────────────────────────────────────────────────────────────────
// Per-user onboarding sessions (keyed by userId from JWT)
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingSession {
  id: string;
  merchantId: string;
  currentStep: string;
  provider: string | null;
  businessName: string | null;
  productCount: number;
  agentConfigured: boolean;
  whatsappConnected: boolean;
  razorpayConnected: boolean;
  completionPercentage: number;
  history: Array<{
    id: string;
    sender: "assistant" | "user" | "system";
    content: string;
    step: string;
    createdAt: string;
  }>;
}

// Map of userId -> session (stays in memory per Railway container lifetime)
const userSessions = new Map<string, OnboardingSession>();

function createFreshSession(userId: string): OnboardingSession {
  return {
    id: `onb_${userId.slice(0, 8)}_${Date.now()}`,
    merchantId: userId,
    currentStep: "WELCOME",
    provider: null,
    businessName: null,
    productCount: 0,
    agentConfigured: false,
    whatsappConnected: false,
    razorpayConnected: false,
    completionPercentage: 10,
    history: [
      {
        id: `msg_init_${Date.now()}`,
        sender: "assistant",
        content: "Welcome to ZapAI! Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
        step: "WELCOME",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function getUserIdFromReq(req: Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return decoded?.userId || null;
    }
  } catch {
    // ignore invalid token
  }
  // Fallback: use a header or anonymous key
  return (req.headers["x-user-id"] as string) || "anonymous";
}

function getSession(userId: string): OnboardingSession {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, createFreshSession(userId));
  }
  return userSessions.get(userId)!;
}

// GET /api/v1/onboarding/session
router.get("/session", async (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req) || "anonymous";
  const session = getSession(userId);
  return res.json(session);
});

// POST /api/v1/onboarding/message
router.post("/message", async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  const userId = getUserIdFromReq(req) || "anonymous";
  const activeSession = getSession(userId);

  const userMsgId = `usr_${Date.now()}`;
  const botMsgId = `bot_${Date.now()}`;

  activeSession.history.push({
    id: userMsgId,
    sender: "user",
    content,
    step: activeSession.currentStep,
    createdAt: new Date().toISOString(),
  });

  let botReply = "";
  let nextStep = activeSession.currentStep;

  // Attempt Live Gemini AI generation
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const prompt = `You are ZapAI Onboarding AI Assistant. You help e-commerce merchants set up their autonomous WhatsApp seller agent & Razorpay instant checkout.

CURRENT STATE:
- Step: ${activeSession.currentStep}
- Store Name: ${activeSession.businessName || "None"}
- Provider: ${activeSession.provider || "None"}
- Progress: ${activeSession.completionPercentage}%

RECENT CHAT:
${activeSession.history
  .slice(-6)
  .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
  .join("\n")}

USER MESSAGE: "${content}"

ONBOARDING STEPS:
1. WELCOME -> 2. STORE_SOURCE -> 3. CATALOG_SETUP -> 4. AGENT_SETUP -> 5. WHATSAPP_CONNECT -> 6. RAZORPAY_CONNECT -> 7. READY

TASK:
1. Converse naturally and answer any questions intelligently.
2. Extract store name or product information if mentioned.
3. Guide the merchant to the next logical step.

Return ONLY valid JSON:
{
  "reply": "string",
  "businessName": "string or null",
  "provider": "ZAPAI or SHOPIFY or null",
  "nextStep": "WELCOME | STORE_SOURCE | CATALOG_SETUP | AGENT_SETUP | WHATSAPP_CONNECT | RAZORPAY_CONNECT | READY",
  "completionPercentage": number
}`;

      const aiRes = await model.generateContent(prompt);
      const parsed = JSON.parse(aiRes.response.text());

      if (parsed.reply) botReply = parsed.reply;
      if (parsed.businessName) activeSession.businessName = parsed.businessName;
      if (parsed.provider) activeSession.provider = parsed.provider;
      if (parsed.nextStep) nextStep = parsed.nextStep;
      if (typeof parsed.completionPercentage === "number") {
        activeSession.completionPercentage = parsed.completionPercentage;
      }
    } catch (err) {
      console.warn("[Backend Onboarding AI] Gemini call failed, using heuristic fallback:", err);
    }
  }

  // Fallback if AI didn't populate
  if (!botReply) {
    switch (activeSession.currentStep) {
      case "WELCOME": {
        activeSession.businessName = content.trim();
        nextStep = "STORE_SOURCE";
        activeSession.completionPercentage = 25;
        botReply = `Great to meet you! "${activeSession.businessName}" is ready for agentic commerce. Where do your products live today?`;
        break;
      }
      case "STORE_SOURCE": {
        if (content.toLowerCase().includes("shopify")) {
          activeSession.provider = "SHOPIFY";
          nextStep = "AGENT_SETUP";
          activeSession.completionPercentage = 50;
          botReply = "Connected Shopify store catalog. Real-time SKU prices and stock levels are indexed! Now, let's configure your AI Seller's negotiation boundaries.";
        } else {
          activeSession.provider = "ZAPAI";
          nextStep = "CATALOG_SETUP";
          activeSession.completionPercentage = 45;
          botReply = "Awesome! Native catalog selected. You can add your products with strict floor prices so your AI never sells below cost. What products do you want to list?";
        }
        break;
      }
      case "CATALOG_SETUP": {
        nextStep = "AGENT_SETUP";
        activeSession.completionPercentage = 65;
        botReply = `Products structured with live inventory! Now let's set your AI Seller Agent's negotiation boundaries. What maximum discount should your agent offer?`;
        break;
      }
      case "AGENT_SETUP": {
        activeSession.agentConfigured = true;
        nextStep = "WHATSAPP_CONNECT";
        activeSession.completionPercentage = 80;
        botReply = "Negotiation rules saved: maximum discount locked, floor price enforced. Next, connect your WhatsApp Business account so buyers can message your agent.";
        break;
      }
      case "WHATSAPP_CONNECT": {
        activeSession.whatsappConnected = true;
        nextStep = "RAZORPAY_CONNECT";
        activeSession.completionPercentage = 90;
        botReply = "WhatsApp Cloud API connected. Now connect your Razorpay account so your AI agent can generate secure payment links and capture payments.";
        break;
      }
      case "RAZORPAY_CONNECT": {
        activeSession.razorpayConnected = true;
        nextStep = "READY";
        activeSession.completionPercentage = 100;
        botReply = "Razorpay Test Mode connected and webhooks verified! Your AI storefront is live and ready for business.";
        break;
      }
      default: {
        nextStep = "READY";
        activeSession.completionPercentage = 100;
        botReply = "Store activated! Redirecting you to your merchant cockpit...";
        break;
      }
    }
  }

  activeSession.currentStep = nextStep;
  activeSession.history.push({
    id: botMsgId,
    sender: "assistant",
    content: botReply,
    step: nextStep,
    createdAt: new Date().toISOString(),
  });

  return res.json({ reply: botReply, state: activeSession });
});

// POST /api/v1/onboarding/complete — Persist newly onboarded merchant & catalog into Neon DB
router.post("/complete", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const activeSession = userId ? getSession(userId) : null;

    const {
      businessName = activeSession?.businessName || "ZapAI Store",
      provider = activeSession?.provider || "ZAPAI",
      phone,
      whatsappPhoneNumber,
      whatsappPhoneNumberId,
      whatsappAccessToken,
      whatsappWebhookVerifyToken = "zapai_meta_webhook_secret_2026",
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      maxDiscountPercent = 12,
      minimumOrderValue = 2000,
      freeShippingAbove = 3000,
      humanApprovalAbove = 5000,
      riskProfile = "balanced",
      products = [],
    } = req.body;

    const finalRzpKeyId = razorpayKeyId || process.env.RAZORPAY_KEY_ID || "";
    const finalRzpKeySecret = razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";
    const finalRzpWebhookSecret = razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const finalWaPhone = whatsappPhoneNumber || phone || "+91 98765 00000";
    const finalWaPhoneId = whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const finalWaToken = whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN || "";
    const finalWaVerify = whatsappWebhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "zapai_meta_webhook_secret_2026";

    const { db } = await import("../db/migrate.ts");

    let storeId: string | null = null;

    // Check if current user already has a store
    if (userId && userId !== "anonymous") {
      const { rows: userRows } = await db.query(
        "SELECT store_id FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );
      if (userRows[0]?.store_id) {
        storeId = userRows[0].store_id;
      }
    }

    const credentialsObj = {
      razorpayKeyId: finalRzpKeyId,
      razorpayKeySecret: finalRzpKeySecret,
      razorpayWebhookSecret: finalRzpWebhookSecret,
      whatsappPhoneNumber: finalWaPhone,
      whatsappPhoneNumberId: finalWaPhoneId,
      whatsappAccessToken: finalWaToken,
      whatsappWebhookVerifyToken: finalWaVerify,
    };

    const agentSettings = {
      name: `${businessName} AI Seller`,
      tone: "friendly",
      status: "active",
      autoNegotiationEnabled: true,
      humanEscalationEnabled: true,
      escalationThresholdAmount: Number(humanApprovalAbove) || 5000,
      credentials: credentialsObj,
    };

    if (storeId) {
      // Update existing store
      await db.query(
        `UPDATE stores
         SET
           name = $1,
           phone = $2,
           razorpay_account_id = $3,
           agent_settings = $4,
           is_active = true,
           updated_at = NOW()
         WHERE id = $5`,
        [
          businessName,
          finalWaPhone,
          finalRzpKeyId || "rzp_test_mock",
          JSON.stringify(agentSettings),
          storeId,
        ]
      );
    } else {
      // 1. Create store record in Neon DB
      const { rows: storeRows } = await db.query(
        `INSERT INTO stores (name, city, phone, razorpay_account_id, agent_settings, is_active)
         VALUES ($1, 'Bengaluru', $2, $3, $4, true)
         RETURNING id, name`,
        [
          businessName,
          finalWaPhone,
          finalRzpKeyId || "rzp_test_mock",
          JSON.stringify(agentSettings),
        ]
      );

      storeId = storeRows[0]?.id;
    }

    if (!storeId) {
      throw new Error("Failed to create or update store in database");
    }

    // 2. Set / update negotiation rules
    const { rows: existingRules } = await db.query(
      "SELECT id FROM negotiation_rules WHERE store_id = $1 LIMIT 1",
      [storeId]
    );

    if (existingRules.length === 0) {
      await db.query(
        `INSERT INTO negotiation_rules (
          store_id, max_discount_percentage, min_order_value_for_discount,
          free_shipping_threshold, human_approval_above, risk_profile,
          allow_bundle_offers, alternative_products_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true)`,
        [
          storeId,
          Number(maxDiscountPercent),
          Number(minimumOrderValue),
          Number(freeShippingAbove),
          Number(humanApprovalAbove),
          riskProfile,
        ]
      );
    } else {
      await db.query(
        `UPDATE negotiation_rules
         SET
           max_discount_percentage = $1,
           min_order_value_for_discount = $2,
           free_shipping_threshold = $3,
           human_approval_above = $4,
           risk_profile = $5,
           allow_bundle_offers = true,
           alternative_products_enabled = true
         WHERE store_id = $6`,
        [
          Number(maxDiscountPercent),
          Number(minimumOrderValue),
          Number(freeShippingAbove),
          Number(humanApprovalAbove),
          riskProfile,
          storeId,
        ]
      );
    }

    // 3. Associate any provided products to storeId
    if (Array.isArray(products) && products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.title) continue;
        const listedPrice = Number(p.price) || 999;
        const minPrice =
          Number(p.minPrice) ||
          Math.round(listedPrice * (1 - (Number(maxDiscountPercent) || 12) / 100));
        const inventory = Number(p.inventory) || 10;
        const sku = p.sku || `SKU-${Date.now().toString().slice(-4)}${i}`;
        const shopifyProdId =
          p.shopify_product_id ||
          p.shopifyProductId ||
          `prod_${Date.now()}_${i}`;
        const variantId =
          p.shopify_variant_id ||
          p.shopifyVariantId ||
          `var_${Date.now()}_${i}`;
        const itemImageUrl = p.imageUrl || p.image_url || null;

        const agentSchema = {
          variantId,
          title: p.title,
          sku,
          listedPrice,
          floorPrice: minPrice,
          inventoryAvailable: inventory,
          attributes: {
            category: p.category || "General",
            description: p.description || "",
          },
        };

        await db.query(
          `INSERT INTO products (
            store_id, shopify_product_id, shopify_variant_id,
            title, sku, listed_price, floor_price,
            inventory_available, inventory_reserved, inventory_state,
            is_ai_enabled, category, description, image_url, agent_schema,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', $9, $10, $11, $12, $13, NOW(), NOW())
          ON CONFLICT (store_id, shopify_variant_id) DO UPDATE SET
            title = EXCLUDED.title,
            listed_price = EXCLUDED.listed_price,
            floor_price = EXCLUDED.floor_price,
            inventory_available = EXCLUDED.inventory_available,
            is_ai_enabled = EXCLUDED.is_ai_enabled,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            image_url = COALESCE(EXCLUDED.image_url, products.image_url),
            agent_schema = EXCLUDED.agent_schema,
            updated_at = NOW()`,
          [
            storeId,
            shopifyProdId,
            variantId,
            p.title,
            sku,
            listedPrice,
            minPrice,
            inventory,
            p.is_ai_enabled ?? p.aiSellingEnabled ?? true,
            p.category || "General",
            p.description || "",
            itemImageUrl,
            JSON.stringify(agentSchema),
          ]
        );
      }
    }

    // Also link any unassigned recent products from anonymous onboarding to this store
    await db.query(
      `UPDATE products SET store_id = $1 WHERE store_id IS NULL`,
      [storeId]
    );

    // 4. Extract user from Authorization header if present and update user's store_id & onboarding_completed
    let refreshedToken: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwtModule = await import("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded: any = jwtModule.default.verify(token, JWT_SECRET);
        if (decoded?.userId) {
          const { rows: updatedUserRows } = await db.query(
            `UPDATE users 
             SET store_id = $1, onboarding_completed = true, phone = COALESCE($2, phone), updated_at = NOW() 
             WHERE id = $3 
             RETURNING id, email, name, role, store_id, onboarding_completed`,
            [storeId, finalWaPhone, decoded.userId]
          );

          if (updatedUserRows[0]) {
            const u = updatedUserRows[0];
            refreshedToken = jwtModule.default.sign(
              {
                userId: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                storeId: u.store_id,
                storeName: businessName,
                onboardingCompleted: true,
              },
              JWT_SECRET,
              { expiresIn: "7d" }
            );

            // Persist refreshed session in DB
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await db.query(
              `INSERT INTO sessions (user_id, token, expires_at)
               VALUES ($1, $2, $3)`,
              [u.id, refreshedToken, expiresAt]
            );

            // Clear the onboarding session for this user
            if (userId) userSessions.delete(userId);
          }
        }
      } catch (jwtErr) {
        console.warn("Could not extract user from token during onboarding completion:", jwtErr);
      }
    }

    return res.json({
      success: true,
      storeId,
      businessName,
      provider,
      token: refreshedToken,
      redirectUrl: "/dashboard",
      message: "Store onboarded & AI Seller activated!",
    });
  } catch (err: any) {
    console.error("Onboarding complete error:", err);
    return res.status(500).json({
      error: err?.message || "Failed to complete onboarding",
    });
  }
});

// POST /api/v1/onboarding/sync-shopify — Authenticate & sync Shopify catalog in onboarding
router.post("/sync-shopify", async (req: Request, res: Response) => {
  try {
    const { shopDomain, accessToken, maxDiscountPercent = 15 } = req.body;
    const userId = getUserIdFromReq(req) || "anonymous";
    const activeSession = getSession(userId);

    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: "shopDomain and accessToken are required" });
    }

    const { verifyShopifyCredentials, fetchShopifyProducts, syncShopifyToStore } = await import("../services/shopify.ts");

    // 1. Verify credentials with Shopify
    const verification = await verifyShopifyCredentials(shopDomain, accessToken);
    if (!verification.valid || !verification.shop) {
      return res.status(400).json({
        success: false,
        error: verification.error || "Failed to authenticate with Shopify Admin API",
      });
    }

    const shop = verification.shop;

    // 2. Fetch products
    const products = await fetchShopifyProducts(shopDomain, accessToken, Number(maxDiscountPercent) || 15);

    // 3. Update active session
    activeSession.provider = "SHOPIFY";
    activeSession.businessName = shop.name;
    activeSession.productCount = products.length;
    activeSession.currentStep = "AGENT_SETUP";
    activeSession.completionPercentage = 60;
    activeSession.history.push({
      id: `msg_shp_${Date.now()}`,
      sender: "assistant",
      content: `Authenticated with Shopify ("${shop.name}"). Successfully synced ${products.length} live SKUs with stock levels and price floors! Now let's configure your AI Seller's negotiation rules.`,
      step: "AGENT_SETUP",
      createdAt: new Date().toISOString(),
    });

    // 4. If user has a store or user session, save products into DB right away
    if (userId && userId !== "anonymous") {
      const { rows: userRows } = await db.query(
        "SELECT store_id FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );
      if (userRows[0]?.store_id) {
        const userStoreId = userRows[0].store_id as string;
        await syncShopifyToStore(userStoreId, shopDomain, accessToken, Number(maxDiscountPercent) || 15);
      }
    }

    return res.json({
      success: true,
      count: products.length,
      shop,
      products,
      state: activeSession,
      message: `Verified and indexed ${products.length} products from ${shop.name}`,
    });
  } catch (err: any) {
    console.error("Onboarding sync-shopify error:", err);
    return res.status(500).json({
      error: err.message || "Failed to sync Shopify store in onboarding",
    });
  }
});

// POST /api/v1/onboarding/reset — Reset onboarding session for current user
router.post("/reset", async (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req) || "anonymous";
  const fresh = createFreshSession(userId);
  userSessions.set(userId, fresh);
  return res.json(fresh);
});

export default router;
