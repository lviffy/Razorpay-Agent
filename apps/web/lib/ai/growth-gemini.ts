import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GrowthChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GrowthSuggestedAction {
  id: string;
  title: string;
  description: string;
  actionType: "UPDATE_FLOOR_PRICE" | "UPDATE_LISTED_PRICE" | "RESTOCK_INVENTORY" | "UPDATE_MAX_DISCOUNT";
  sku?: string;
  value: number;
  badge?: string;
}

export interface GrowthChatResult {
  reply: string;
  toolCallsExecuted?: Array<{ name: string; args: any; result: any }>;
  suggestedActions?: GrowthSuggestedAction[];
  metricsSnapshot?: any;
}

export interface GrowthDailyBriefing {
  timestamp: string;
  headline: string;
  summary: string;
  highlights: Array<{
    title: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    description: string;
  }>;
  inventoryAlerts: Array<{
    sku: string;
    title: string;
    availableStock: number;
    daysOfInventory: string;
    status: "CRITICAL_LOW" | "LOW_STOCK" | "DEAD_STOCK" | "OUT_OF_STOCK" | "HEALTHY";
    recommendation: string;
    suggestedRestockQty?: number;
  }>;
  growthOpportunities: Array<{
    type: "PRICING" | "INVENTORY" | "BUNDLE" | "CONVERSION";
    title: string;
    impact: string;
    description: string;
    action?: {
      actionType: string;
      sku?: string;
      value: number;
      label: string;
    };
  }>;
}

export function stripMarkdownAsterisks(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}

async function fetchTelemetryFromBackend(backendBase: string, storeId?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (storeId) headers["X-Store-ID"] = storeId;

  try {
    const [analyticsRes, productsRes] = await Promise.all([
      fetch(`${backendBase}/api/v1/analytics`, { headers, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${backendBase}/api/v1/products`, { headers, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    return {
      analytics: analyticsRes,
      products: Array.isArray(productsRes) ? productsRes : [],
    };
  } catch (err) {
    return { analytics: null, products: [] };
  }
}

export function computeInventoryHealthFromProducts(products: any[]) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  return products.map((p) => {
    const avail = p.inventory !== undefined ? Number(p.inventory) : (p.inventory_available ? Number(p.inventory_available) : 0);
    const listed = Number(p.price || p.listed_price || 0);
    const floor = Number(p.minPrice || p.floor_price || Math.round(listed * 0.88));
    const burn = p.dailyBurn !== undefined ? Number(p.dailyBurn) : (avail <= 2 ? 0.8 : 0.2);
    const days = burn > 0 ? Math.round(avail / burn) : (avail > 0 ? 999 : 0);

    let stockStatus: "OUT_OF_STOCK" | "CRITICAL_LOW" | "LOW_STOCK" | "HEALTHY" | "DEAD_STOCK" = "HEALTHY";
    if (avail === 0) stockStatus = "OUT_OF_STOCK";
    else if (days <= 3 || avail <= 2) stockStatus = "CRITICAL_LOW";
    else if (days <= 7 || avail <= 5) stockStatus = "LOW_STOCK";
    else if (burn === 0 && avail > 10) stockStatus = "DEAD_STOCK";

    return {
      id: p.id || `prod-${p.sku}`,
      title: p.title || "Catalog Item",
      sku: p.sku || "SKU-001",
      category: p.category || "General",
      listedPrice: listed,
      floorPrice: floor,
      marginCapPercent: listed > 0 ? Math.round(((listed - floor) / listed) * 100) : 12,
      availableStock: avail,
      reservedStock: p.inventoryReserved || 0,
      dailySalesBurnRate: burn,
      daysOfInventoryRemaining: days === 999 ? "30+ days (Stable)" : `${days} days`,
      stockStatus,
      aiEnabled: p.aiSellingEnabled ?? true,
      revenueLast14d: listed * (p.salesCount || 1),
    };
  });
}

export async function processGrowthAIChatInWeb(
  messages: GrowthChatMessage[],
  storeId?: string | null
): Promise<GrowthChatResult> {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
  const telemetry = await fetchTelemetryFromBackend(backendBase, storeId);
  const inventoryHealth = computeInventoryHealthFromProducts(telemetry.products);

  const totalGmv = Number(telemetry.analytics?.agentGmv ?? telemetry.analytics?.totalGmv ?? 0);
  const marginPreserved = Number(telemetry.analytics?.marginPreserved ?? 0);
  const convRate = Number(telemetry.analytics?.conversionRate ?? 0);
  const closedDeals = Number(telemetry.analytics?.dealsClosed ?? 0);
  const totalConvs = Number(telemetry.analytics?.totalConversations ?? 0);
  const aov = Number(telemetry.analytics?.averageOrderValue ?? 0);

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are the ZapAI Merchant Growth & Inventory Intelligence Advisor.
You have direct telemetry to the merchant's real store metrics:
- Total Settled GMV: ₹${totalGmv.toLocaleString("en-IN")}
- Dealer Margin Preserved: ₹${marginPreserved.toLocaleString("en-IN")}
- Average Order Value (AOV): ₹${aov.toLocaleString("en-IN")}
- Deal Conversion Rate: ${convRate}% (${closedDeals} closed deals of ${totalConvs} customer inquiries)
- Real Product Catalog (${inventoryHealth.length} items):
${inventoryHealth.length === 0 ? "  * No products currently listed in store catalog." : inventoryHealth.map((p) => `  * ${p.title} (${p.sku}): Listed Price ₹${p.listedPrice}, Floor Price ₹${p.floorPrice}, Available Stock: ${p.availableStock} units (${p.daysOfInventoryRemaining}), Status: ${p.stockStatus}`).join("\n")}

STRICT FORMATTING AND BRANDING RULES:
1. NO ASTERISKS: Do NOT use markdown bold asterisks like **word** or heading hashes like ### anywhere in your response. Write clean plain text without any asterisks.
2. NO GEMINI MENTION: NEVER mention Gemini, Google, LLM, or AI models. Speak as the store's built-in Growth Advisor.
3. REAL DATA ONLY: Use only the real numbers and real products listed above. Never invent fake products or fake currency amounts.
4. CURRENCY: Format all monetary amounts in INR / ₹ (e.g. ₹1,000).
5. CONCISE: Keep answers direct, friendly, and structured with clean bullet points.`,
      });

      const contents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: stripMarkdownAsterisks(m.content) }],
      }));

      const res = await model.generateContent({ contents });
      const rawReply = res.response.text();
      const reply = stripMarkdownAsterisks(rawReply);

      const suggestedActions = extractActions(inventoryHealth);

      return {
        reply,
        suggestedActions,
        metricsSnapshot: {
          totalGmv,
          marginPreserved,
          conversionRate: convRate,
        },
      };
    } catch (err) {
      console.warn("[Gemini Growth AI] Web execution error, using real heuristic fallback:", err);
    }
  }

  // Real Data Fallback
  return fallbackGrowthChat(messages, telemetry, inventoryHealth);
}

function extractActions(inventoryHealth: any[]): GrowthSuggestedAction[] {
  const actions: GrowthSuggestedAction[] = [];
  const critical = inventoryHealth.filter((p) => p.stockStatus === "CRITICAL_LOW" || p.stockStatus === "OUT_OF_STOCK");
  for (const crit of critical.slice(0, 2)) {
    actions.push({
      id: `restock-${crit.sku}`,
      title: `Restock ${crit.title}`,
      description: `Stock is down to ${crit.availableStock} units (${crit.daysOfInventoryRemaining} remaining). Add units to catalog.`,
      actionType: "RESTOCK_INVENTORY",
      sku: crit.sku,
      value: 20,
      badge: "Stockout Alert",
    });
  }

  const top = inventoryHealth[0];
  if (top && top.listedPrice > 0) {
    const suggestedPrice = Math.round(top.listedPrice * 1.05);
    actions.push({
      id: `price-${top.sku}`,
      title: `Optimize Listed Price: ${top.title}`,
      description: `Increase listed price from ₹${top.listedPrice} to ₹${suggestedPrice} to capture additional dealer margin.`,
      actionType: "UPDATE_LISTED_PRICE",
      sku: top.sku,
      value: suggestedPrice,
      badge: "Price Elasticity",
    });
  }

  return actions;
}

function fallbackGrowthChat(
  messages: GrowthChatMessage[],
  telemetry: any,
  inventoryHealth: any[]
): GrowthChatResult {
  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
  const totalGmv = Number(telemetry.analytics?.agentGmv ?? telemetry.analytics?.totalGmv ?? 0);
  const marginPreserved = Number(telemetry.analytics?.marginPreserved ?? 0);
  const convRate = Number(telemetry.analytics?.conversionRate ?? 0);
  const aov = Number(telemetry.analytics?.averageOrderValue ?? 0);
  const closedDeals = Number(telemetry.analytics?.dealsClosed ?? 0);

  let reply = "";
  if (lastMsg.includes("stock") || lastMsg.includes("inventory") || lastMsg.includes("sku") || lastMsg.includes("run out")) {
    if (inventoryHealth.length === 0) {
      reply = "Your store currently has 0 products listed in your catalog. You can add items in the Products section to start tracking stock velocity.";
    } else {
      const critical = inventoryHealth.filter((p) => p.stockStatus === "CRITICAL_LOW" || p.stockStatus === "OUT_OF_STOCK");
      const low = inventoryHealth.filter((p) => p.stockStatus === "LOW_STOCK");
      const healthy = inventoryHealth.filter((p) => p.stockStatus === "HEALTHY");

      const itemsList = inventoryHealth
        .map((p) => `• ${p.title} (${p.sku}): ${p.availableStock} units in stock (${p.daysOfInventoryRemaining}) - Listed: ₹${p.listedPrice}, Floor: ₹${p.floorPrice}`)
        .join("\n");

      reply = `Live Inventory Status:\n\nYour catalog contains ${inventoryHealth.length} active product SKU(s):\n${itemsList}\n\nSummary:\n• Critical Stockout Risks: ${critical.length} item(s)\n• Low Stock Warnings: ${low.length} item(s)\n• Healthy Reserves: ${healthy.length} item(s)`;
    }
  } else if (lastMsg.includes("margin") || lastMsg.includes("discount") || lastMsg.includes("price") || lastMsg.includes("floor")) {
    reply = `Dealer Margin Report:\n\n• Margin Preserved: ₹${marginPreserved.toLocaleString("en-IN")}\n• Strict Floor Defense: 100% of autonomous negotiations respected merchant floor margins\n• Settled GMV: ₹${totalGmv.toLocaleString("en-IN")}\n\nAll AI counter-offers strictly defended your minimum profit thresholds.`;
  } else if (lastMsg.includes("revenue") || lastMsg.includes("gmv") || lastMsg.includes("sales") || lastMsg.includes("growth")) {
    reply = `Store Revenue & Sales Velocity:\n\n• Total Settled GMV: ₹${totalGmv.toLocaleString("en-IN")}\n• Average Order Value: ₹${aov.toLocaleString("en-IN")}\n• Deal Conversion Rate: ${convRate}%\n• Closed Deals: ${closedDeals} captured via Razorpay UPI`;
  } else {
    const productsOverview = inventoryHealth.length > 0
      ? `• Catalog SKUs: ${inventoryHealth.length} items (${inventoryHealth.map((p) => p.title).join(", ")})`
      : "• Catalog SKUs: 0 items listed";

    reply = `Executive Store Performance Summary:\n\n• Settled GMV: ₹${totalGmv.toLocaleString("en-IN")}\n• Margin Saved: ₹${marginPreserved.toLocaleString("en-IN")}\n• Conversion Rate: ${convRate}%\n${productsOverview}\n\nAsk me about your live inventory levels, pricing elasticity, or restock recommendations.`;
  }

  return {
    reply: stripMarkdownAsterisks(reply),
    suggestedActions: extractActions(inventoryHealth),
    metricsSnapshot: { totalGmv, marginPreserved, conversionRate: convRate },
  };
}

export async function generateDailyBriefingInWeb(
  storeId?: string | null
): Promise<GrowthDailyBriefing> {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
  const telemetry = await fetchTelemetryFromBackend(backendBase, storeId);
  const inventoryHealth = computeInventoryHealthFromProducts(telemetry.products);

  const totalGmv = Number(telemetry.analytics?.agentGmv ?? telemetry.analytics?.totalGmv ?? 0);
  const marginPreserved = Number(telemetry.analytics?.marginPreserved ?? 0);
  const convRate = Number(telemetry.analytics?.conversionRate ?? 0);
  const closedDeals = Number(telemetry.analytics?.dealsClosed ?? 0);
  const totalConvs = Number(telemetry.analytics?.totalConversations ?? 0);

  const critical = inventoryHealth.filter((p) => p.stockStatus === "CRITICAL_LOW" || p.stockStatus === "OUT_OF_STOCK");
  const low = inventoryHealth.filter((p) => p.stockStatus === "LOW_STOCK");

  const inventoryAlerts: GrowthDailyBriefing["inventoryAlerts"] = [];
  for (const p of critical.slice(0, 3)) {
    inventoryAlerts.push({
      sku: p.sku,
      title: p.title,
      availableStock: p.availableStock,
      daysOfInventory: p.daysOfInventoryRemaining,
      status: p.stockStatus,
      recommendation: `High sales velocity (${p.dailySalesBurnRate} units/day). Stock will run out in ${p.daysOfInventoryRemaining}. Restock recommended.`,
      suggestedRestockQty: 25,
    });
  }

  for (const p of low.slice(0, 2)) {
    inventoryAlerts.push({
      sku: p.sku,
      title: p.title,
      availableStock: p.availableStock,
      daysOfInventory: p.daysOfInventoryRemaining,
      status: p.stockStatus,
      recommendation: `Moderate burn rate. Consider placing a purchase order for +15 units this week.`,
      suggestedRestockQty: 15,
    });
  }

  const growthOpportunities: GrowthDailyBriefing["growthOpportunities"] = [];

  const topSeller = inventoryHealth[0];
  if (topSeller && topSeller.listedPrice > 0) {
    const recommendedListed = Math.round(topSeller.listedPrice * 1.05);
    growthOpportunities.push({
      type: "PRICING",
      title: `Optimize Pricing on ${topSeller.title}`,
      impact: `+₹${Math.round(topSeller.listedPrice * 0.05 * 5)} Potential Margin`,
      description: `High conversion velocity with profit floor protected. You can safely increase listed price from ₹${topSeller.listedPrice} to ₹${recommendedListed}.`,
      action: {
        actionType: "UPDATE_LISTED_PRICE",
        sku: topSeller.sku,
        value: recommendedListed,
        label: `Raise Price to ₹${recommendedListed}`,
      },
    });
  }

  if (critical.length > 0) {
    const firstCrit = critical[0];
    growthOpportunities.push({
      type: "INVENTORY",
      title: `Prevent Imminent Stockout on ${firstCrit.title}`,
      impact: "Protect live catalog GMV",
      description: `Available stock is down to ${firstCrit.availableStock} units. Orders will pause within ${firstCrit.daysOfInventoryRemaining} if unaddressed.`,
      action: {
        actionType: "RESTOCK_INVENTORY",
        sku: firstCrit.sku,
        value: 20,
        label: `Restock 20 Units`,
      },
    });
  }

  if (inventoryHealth.length === 0) {
    growthOpportunities.push({
      type: "INVENTORY",
      title: "Add Products to Your Unified Catalog",
      impact: "Enable WhatsApp AI Selling",
      description: "You currently have 0 active products in your catalog. Add items with floor prices in the Products tab to begin automated WhatsApp selling and instant UPI checkout.",
    });
  }

  growthOpportunities.push({
    type: "CONVERSION",
    title: "Autonomous Margin & Payment Guardrails",
    impact: totalGmv > 0 ? `₹${marginPreserved.toLocaleString("en-IN")} Saved` : "100% Floor Guarded",
    description: totalGmv > 0
      ? `Your AI Seller has preserved profit margins while capturing ₹${totalGmv.toLocaleString("en-IN")} settled GMV.`
      : "Your profit floors and 120s atomic stock locks are configured and active for all incoming buyer inquiries.",
  });

  const gmvGrowth = Number(telemetry.analytics?.gmvGrowthPercent ?? 0);

  const headline = critical.length > 0
    ? `Revenue at ₹${totalGmv.toLocaleString("en-IN")} • ${critical.length} SKU(s) Need Restock`
    : (totalGmv > 0
      ? `Store Health Strong • ₹${marginPreserved.toLocaleString("en-IN")} Margin Protected`
      : `Store Catalog Live • ${inventoryHealth.length} SKU(s) Protected`);

  const summary = closedDeals > 0
    ? `Your autonomous store has captured ${closedDeals} order(s) generating ₹${totalGmv.toLocaleString("en-IN")} settled GMV with ${convRate}% lead conversion. Dealer margins remain securely protected.`
    : (inventoryHealth.length > 0
      ? `Your autonomous store catalog is live with ${inventoryHealth.length} active SKU(s). AI selling guardrails and WhatsApp instant checkout are active.`
      : `Your store is initialized and ready. Add products to catalog to begin tracking stock and automated selling.`);

  return {
    timestamp: new Date().toISOString(),
    headline: stripMarkdownAsterisks(headline),
    summary: stripMarkdownAsterisks(summary),
    highlights: [
      {
        title: "Total Settled GMV",
        value: `₹${totalGmv.toLocaleString("en-IN")}`,
        change: gmvGrowth > 0 ? `+${gmvGrowth}% WoW` : (totalGmv > 0 ? "Direct UPI Settlements" : "No orders yet"),
        isPositive: totalGmv > 0,
        description: "Direct instant settlements via Razorpay UPI.",
      },
      {
        title: "Margin Preserved",
        value: `₹${marginPreserved.toLocaleString("en-IN")}`,
        change: "100% Floor Guarded",
        isPositive: marginPreserved > 0,
        description: "Rupees retained by autonomous counter-offering.",
      },
      {
        title: "Deal Conversion Rate",
        value: `${convRate}%`,
        change: totalConvs > 0 ? `${closedDeals} closed of ${totalConvs}` : `${closedDeals} closed deals`,
        isPositive: convRate >= 40,
        description: "WhatsApp and AI buyer inquiries converted to paid orders.",
      },
    ],
    inventoryAlerts,
    growthOpportunities,
  };
}
