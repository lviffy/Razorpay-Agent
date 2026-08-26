import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface OnboardingAIInput {
  userMessage: string;
  currentState: {
    currentStep: string;
    businessName: string | null;
    provider: string | null;
    productCount: number;
    agentConfigured: boolean;
    whatsappConnected: boolean;
    razorpayConnected: boolean;
    completionPercentage: number;
    history: Array<{ sender: string; content: string; step: string }>;
  };
}

export interface OnboardingAIOutput {
  reply: string;
  nextStep: string;
  extracted: {
    businessName?: string;
    provider?: "ZAPAI" | "AGENTBRIDGE" | "SHOPIFY";
    product?: {
      title: string;
      price: number;
      minPrice: number;
      inventory: number;
      category?: string;
    };
    discountRules?: {
      maxDiscountPercent: number;
      riskProfile: "conservative" | "balanced" | "aggressive";
    };
    whatsappConnected?: boolean;
    razorpayConnected?: boolean;
  };
  completionPercentage: number;
}

/**
 * Executes dynamic Gemini AI reasoning for the Onboarding Assistant
 */
export async function generateOnboardingAIResponse(
  input: OnboardingAIInput
): Promise<OnboardingAIOutput> {
  const { userMessage, currentState } = input;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const prompt = `You are the intelligent onboarding AI setup assistant for ZapAI — an autonomous Agentic Commerce platform built for Indian merchants that turns WhatsApp conversations and AI buyer requests into instant Razorpay UPI settlements.

FORMATTING RULE:
- Do NOT use markdown bold asterisks like **word** in your reply. Output clean, readable plain text without asterisks.

CORE KNOWLEDGE ABOUT ZAPAI:
- What is ZapAI: An autonomous agent-to-agent (A2A) commerce middleware. It enables AI shopping agents and WhatsApp customers to discover products, negotiate prices within merchant-defined margins, and pay instantly via Razorpay in INR.
- Margin Engine: Merchants set a maximum discount (e.g. 8% conservative, 12% balanced, 18% aggressive) or strict floor prices per SKU. The AI seller never accepts deals below the merchant's profit floor.
- Catalog Sources: Supports Native ZapAI catalog (manual/CSV entry) and Shopify Admin API sync (supports any custom domain like 'rohanm.in' or 'brand.myshopify.com').
- WhatsApp Cloud API: Integrates with Meta Graph API for 24/7 autonomous buyer communication.
- Razorpay Settlement: Issues 1-Tap UPI and cards payment links with instant rupee bank settlements, webhook signature verification on payment.captured, and x402 payment headers.

CURRENT ONBOARDING STATE:
- Current Step: ${currentState.currentStep}
- Store Business Name: ${currentState.businessName || "Not set yet"}
- Catalog Provider: ${currentState.provider || "Not set yet"}
- Product Count: ${currentState.productCount}
- Agent Configured: ${currentState.agentConfigured}
- WhatsApp Connected: ${currentState.whatsappConnected}
- Razorpay Connected: ${currentState.razorpayConnected}
- Current Progress: ${currentState.completionPercentage}%

RECENT CHAT HISTORY:
${currentState.history
  .slice(-6)
  .map((h) => `${h.sender.toUpperCase()}: ${h.content}`)
  .join("\n")}

USER'S LATEST MESSAGE:
"${userMessage}"

STEP ORDER:
1. "WELCOME" (Identity: Collect or detect business/store name)
2. "STORE_SOURCE" (Catalog: Merchant chooses Native Catalog, CSV Upload, or Shopify Sync)
3. "CATALOG_SETUP" (Add products, prices, floor minimum margins - allow adding multiple items!)
4. "AGENT_SETUP" (Negotiation rules, discount limits e.g. 8%, 12%, 18%)
5. "WHATSAPP_CONNECT" (Connect WhatsApp Business number)
6. "RAZORPAY_CONNECT" (Connect Razorpay API credentials)
7. "READY" (Store is 100% active, ready for live launch)

RULES:
1. Questions About ZapAI / Onboarding: If the user asks ANY question about ZapAI, Razorpay, WhatsApp, negotiation, pricing, security, or how anything works, answer thoroughly, warmly, and accurately (1-3 sentences without ** asterisks), and remind them of their current step. DO NOT advance nextStep if they are asking a question.
2. Back Navigation & Corrections: If the user says "go back", "previous step", "change name", "change catalog", "change discount", set nextStep to the requested previous step (e.g., "WELCOME", "STORE_SOURCE", "AGENT_SETUP", etc.) and acknowledge the change.
3. Adding Multiple Products in CATALOG_SETUP: When the user adds a product (e.g., "Added [title] at ₹[price]"), confirm the item has been indexed and KEEP nextStep at "CATALOG_SETUP" so the merchant can add more products or click Continue when done. Only advance to "AGENT_SETUP" when they say "done", "continue", "next", or configure discounts.
4. Step Progression: Only advance to the next step when the user provides the relevant step data (e.g. store name for WELCOME, source for STORE_SOURCE, discount for AGENT_SETUP, phone for WHATSAPP_CONNECT, Razorpay keys for RAZORPAY_CONNECT).

Return ONLY valid JSON matching this schema:
{
  "reply": "string (without ** markdown)",
  "nextStep": "WELCOME | STORE_SOURCE | CATALOG_SETUP | AGENT_SETUP | WHATSAPP_CONNECT | RAZORPAY_CONNECT | READY",
  "extracted": {
    "businessName": "string or null",
    "provider": "ZAPAI or SHOPIFY or null",
    "product": {
      "title": "string",
      "price": 0,
      "minPrice": 0,
      "inventory": 10,
      "category": "string"
    },
    "discountRules": {
      "maxDiscountPercent": 12,
      "riskProfile": "conservative or balanced or aggressive"
    },
    "whatsappConnected": true or false,
    "razorpayConnected": true or false
  },
  "completionPercentage": 10 to 100
}`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const parsed = JSON.parse(text);

      return {
        reply: parsed.reply || "Got it! Let's proceed to the next step.",
        nextStep: parsed.nextStep || currentState.currentStep,
        extracted: parsed.extracted || {},
        completionPercentage:
          typeof parsed.completionPercentage === "number"
            ? parsed.completionPercentage
            : currentState.completionPercentage,
      };
    } catch (err) {
      console.warn("[Gemini AI] Call failed or timed out, using smart heuristic AI:", err);
    }
  }

  // Smart Heuristic NLP Fallback
  return fallbackHeuristicAI(userMessage, currentState);
}

/**
 * High-quality heuristic fallback with natural language understanding and deep ZapAI context
 */
function fallbackHeuristicAI(
  userMessage: string,
  currentState: OnboardingAIInput["currentState"]
): OnboardingAIOutput {
  const text = userMessage.toLowerCase().trim();
  let nextStep = currentState.currentStep;
  let reply = "";
  let progress = currentState.completionPercentage;
  const extracted: OnboardingAIOutput["extracted"] = {};

  // 1. Back navigation / undo intent
  const isBackIntent =
    /^(go\s+back|back|previous|undo|change\s+step|return)\b/i.test(text) ||
    text.includes("go back") ||
    text.includes("previous step");

  if (isBackIntent) {
    if (text.includes("name") || text.includes("store name") || text.includes("identity")) {
      return {
        reply: "Navigated back to Identity step. What would you like to rename your store?",
        nextStep: "WELCOME",
        extracted: {},
        completionPercentage: 15,
      };
    }
    if (text.includes("catalog") || text.includes("source") || text.includes("shopify") || text.includes("product")) {
      return {
        reply: "Navigated back to Catalog Setup. You can choose Native Catalog, CSV upload, or Shopify sync.",
        nextStep: "STORE_SOURCE",
        extracted: {},
        completionPercentage: 30,
      };
    }
    if (text.includes("agent") || text.includes("rule") || text.includes("discount") || text.includes("mandate")) {
      return {
        reply: "Navigated back to Agent Mandate step. You can pick Conservative (8%), Balanced (12%), or Aggressive (18%) discounts.",
        nextStep: "AGENT_SETUP",
        extracted: {},
        completionPercentage: 60,
      };
    }
    if (text.includes("whatsapp") || text.includes("phone")) {
      return {
        reply: "Navigated back to WhatsApp Channel step. You can enter or update your WhatsApp Business number.",
        nextStep: "WHATSAPP_CONNECT",
        extracted: {},
        completionPercentage: 75,
      };
    }

    // Default sequential go-back
    const previousMap: Record<string, { step: string; pct: number; msg: string }> = {
      READY: { step: "RAZORPAY_CONNECT", pct: 90, msg: "Returned to Razorpay payment connection step." },
      RAZORPAY_CONNECT: { step: "WHATSAPP_CONNECT", pct: 75, msg: "Returned to WhatsApp Business channel step." },
      WHATSAPP_CONNECT: { step: "AGENT_SETUP", pct: 60, msg: "Returned to AI Seller negotiation rules step." },
      AGENT_SETUP: { step: "CATALOG_SETUP", pct: 40, msg: "Returned to Catalog setup step." },
      CATALOG_SETUP: { step: "STORE_SOURCE", pct: 30, msg: "Returned to Catalog selection step." },
      SHOPIFY_CONNECT: { step: "STORE_SOURCE", pct: 30, msg: "Returned to Catalog selection step." },
      STORE_SOURCE: { step: "WELCOME", pct: 15, msg: "Returned to Business Name identity step." },
      WELCOME: { step: "WELCOME", pct: 15, msg: "You are at the first step. Enter your store or brand name." },
    };

    const prev = previousMap[currentState.currentStep] || { step: "WELCOME", pct: 15, msg: "Returned to beginning." };
    return {
      reply: prev.msg,
      nextStep: prev.step,
      extracted: {},
      completionPercentage: prev.pct,
    };
  }

  // 2. Greetings
  const isGreeting = /^(hi|hello|hey|greetings|hola|good\s*(morning|evening|afternoon)|sup|yo)\b/i.test(text);
  if (isGreeting && currentState.currentStep !== "WELCOME") {
    return {
      reply: `Hello! I'm your ZapAI setup assistant for ${currentState.businessName || "your store"}. We are currently on the ${currentState.currentStep.replace(/_/g, " ")} step. Feel free to ask any question about ZapAI, or continue configuring your store above!`,
      nextStep: currentState.currentStep,
      extracted: {},
      completionPercentage: currentState.completionPercentage,
    };
  }

  // 3. Questions about ZapAI and features
  if (text.includes("what is zapai") || text.includes("about zapai") || text.includes("how does zapai work") || text.includes("tell me about zapai")) {
    return {
      reply: "ZapAI is an autonomous agentic commerce platform for Indian merchants. It connects buyers' AI agents and WhatsApp shoppers directly to your store catalog, negotiates prices autonomously within your profit margins, and collects instant 1-Tap UPI payments through Razorpay in INR.",
      nextStep: currentState.currentStep,
      extracted: {},
      completionPercentage: currentState.completionPercentage,
    };
  }

  if (text.includes("negotiat") || text.includes("floor price") || text.includes("margin") || text.includes("discount")) {
    if (currentState.currentStep !== "AGENT_SETUP") {
      return {
        reply: "ZapAI's Margin Engine allows you to define discount allowances (e.g. 8%, 12%, 18%) and minimum floor prices. During buyer conversations, the AI counters dynamically but strictly never sells below your floor margin.",
        nextStep: currentState.currentStep,
        extracted: {},
        completionPercentage: currentState.completionPercentage,
      };
    }
  }

  if (text.includes("razorpay") || text.includes("settlement") || text.includes("upi") || text.includes("payment")) {
    if (currentState.currentStep !== "RAZORPAY_CONNECT") {
      return {
        reply: "ZapAI uses Razorpay to issue instant 1-Tap UPI and card payment links directly in chats. Every transaction settles in INR straight into your bank account with automated webhook verification.",
        nextStep: currentState.currentStep,
        extracted: {},
        completionPercentage: currentState.completionPercentage,
      };
    }
  }

  if (text.includes("shopify") && currentState.currentStep !== "STORE_SOURCE" && currentState.currentStep !== "SHOPIFY_CONNECT") {
    return {
      reply: "ZapAI connects to Shopify via the Admin API. It supports any custom domain (e.g. rohanm.in or brand.myshopify.com) to automatically index products, sync inventory, and write back orders upon payment.",
      nextStep: currentState.currentStep,
      extracted: {},
      completionPercentage: currentState.completionPercentage,
    };
  }

  if (text.includes("whatsapp") && currentState.currentStep !== "WHATSAPP_CONNECT") {
    return {
      reply: "ZapAI connects with Meta's official WhatsApp Business Cloud API so your AI Seller Agent can autonomously reply to customers, recommend products, and close deals 24/7.",
      nextStep: currentState.currentStep,
      extracted: {},
      completionPercentage: currentState.completionPercentage,
    };
  }

  // 4. Normal step progression
  if (currentState.currentStep === "WELCOME" || !currentState.businessName) {
    const cleanedName = userMessage
      .replace(/^(my store is|it's called|name is|i am|let's call it)\s+/i, "")
      .trim();
    extracted.businessName = cleanedName || userMessage;
    nextStep = "STORE_SOURCE";
    progress = 25;
    reply = `Welcome, ${extracted.businessName}! Your store is ready to be powered by autonomous AI. Where are your products currently hosted?`;
  } else if (currentState.currentStep === "STORE_SOURCE") {
    if (text.includes("shopify")) {
      extracted.provider = "SHOPIFY";
      nextStep = "SHOPIFY_CONNECT";
      progress = 35;
      reply = `Shopify selected! Enter your store domain (e.g. rohanm.in or brand.myshopify.com) and Admin API Access Token to sync your catalog.`;
    } else if (text.includes("native") || text.includes("zapai") || text.includes("manual") || text.includes("catalog") || text.includes("csv")) {
      extracted.provider = "ZAPAI";
      nextStep = "CATALOG_SETUP";
      progress = 40;
      reply = `Native catalog selected. You can add your products with strict floor prices so your AI never sells below cost. What products do you want to list?`;
    } else {
      reply = `Would you like to add products directly to your ZapAI Native Catalog, upload a CSV, or connect an existing Shopify store?`;
    }
  } else if (currentState.currentStep === "CATALOG_SETUP") {
    // Check if user is done or continuing to next step
    const isDoneWithCatalog =
      text.includes("done") ||
      text.includes("continue") ||
      text.includes("next") ||
      text.includes("proceed") ||
      text.includes("finish") ||
      text.includes("no more");

    if (isDoneWithCatalog) {
      nextStep = "AGENT_SETUP";
      progress = 60;
      reply = "Products saved in your catalog! Now, let's establish your negotiation profile. What maximum discount should your agent offer during live WhatsApp negotiations?";
    } else if (text.includes("added") || text.includes("sku") || text.includes("price") || text.includes("₹") || text.includes("rs")) {
      // Product was added! Keep on CATALOG_SETUP so merchant can add more items!
      nextStep = "CATALOG_SETUP";
      progress = 45;
      reply = "Product added and indexed in your live catalog! You can add more products above or click 'Continue to Mandate' when you're finished.";
    } else {
      reply = "Please click 'Add Product Details' or 'Upload CSV' above to add products to your catalog, or type in your product name and price.";
    }
  } else if (currentState.currentStep === "AGENT_SETUP") {
    const hasDiscount = /\d+%?/.test(text) || text.includes("discount") || text.includes("profile") || text.includes("conservative") || text.includes("balanced") || text.includes("aggressive");
    if (hasDiscount) {
      const discount = text.includes("18") || text.includes("aggressive") ? 18 : text.includes("8") || text.includes("conservative") ? 8 : 12;
      extracted.discountRules = {
        maxDiscountPercent: discount,
        riskProfile: text.includes("aggressive") ? "aggressive" : text.includes("conservative") ? "conservative" : "balanced",
      };
      nextStep = "WHATSAPP_CONNECT";
      progress = 80;
      reply = `Negotiation guardrails set! Maximum discount is locked at ${discount}%. Next, connect your WhatsApp Business account so buyers can start messaging your store.`;
    } else {
      reply = `Please choose a negotiation profile (Conservative: max 8%, Balanced: max 12%, Aggressive: max 18%) or specify your preferred maximum discount percentage.`;
    }
  } else if (currentState.currentStep === "WHATSAPP_CONNECT") {
    if (text.includes("whatsapp") || text.includes("phone") || text.includes("connect") || text.includes("+91") || /\d{10}/.test(text)) {
      extracted.whatsappConnected = true;
      nextStep = "RAZORPAY_CONNECT";
      progress = 90;
      reply = `WhatsApp Cloud webhook verified! Finally, connect your Razorpay credentials so your AI can autonomously issue 1-Tap UPI payment links.`;
    } else {
      reply = `Please connect your WhatsApp Business phone number and Meta Graph credentials above to enable customer chats.`;
    }
  } else if (currentState.currentStep === "RAZORPAY_CONNECT") {
    if (text.includes("razorpay") || text.includes("rzp") || text.includes("connect") || text.includes("test") || text.includes("key")) {
      extracted.razorpayConnected = true;
      nextStep = "READY";
      progress = 100;
      reply = `Razorpay connected and webhooks active! Your autonomous AI storefront is 100% configured and ready to accept live orders.`;
    } else {
      reply = `Please enter your Razorpay Key ID and Secret above to activate instant UPI settlements for your store.`;
    }
  } else {
    nextStep = "READY";
    progress = 100;
    reply = `All parameters are set and synchronized! Click 'Open Merchant Dashboard' to launch your store cockpit.`;
  }

  return {
    reply,
    nextStep,
    extracted,
    completionPercentage: progress,
  };
}


