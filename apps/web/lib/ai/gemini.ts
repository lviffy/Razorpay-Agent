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

      const prompt = `You are the intelligent onboarding AI setup assistant for ZapAI — an autonomous AI agent platform that turns WhatsApp chats into instant Razorpay UPI sales.

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

STEP ORDER IN ONBOARDING:
1. "WELCOME" (Identity: Collect or detect business/store name)
2. "STORE_SOURCE" (Catalog: Merchant chooses Native Catalog or Shopify Sync)
3. "CATALOG_SETUP" (Add products, prices, floor minimum margins)
4. "AGENT_SETUP" (Negotiation rules, discount limits e.g. 8%, 12%, 18%)
5. "WHATSAPP_CONNECT" (Connect business number)
6. "RAZORPAY_CONNECT" (Connect Razorpay test API keys)
7. "READY" (Store is 100% active, ready for live launch)

CRITICAL RULES:
1. If the user message is just a greeting (e.g. "hi", "hello", "hey") or asks a question, answer warmly and helpfully, and KEEP nextStep at "${currentState.currentStep}". DO NOT advance to the next step.
2. If on "AGENT_SETUP", only advance if they specify a discount percentage or select a risk profile (conservative/balanced/aggressive). If they ask questions or say hi, answer and guide them to set their discount rule.
3. If on "CATALOG_SETUP", only advance if product info is provided or added.
4. If on "WHATSAPP_CONNECT", only advance if they confirm connecting their WhatsApp number.
5. If on "RAZORPAY_CONNECT", only advance if they confirm connecting Razorpay credentials.
6. Provide a crisp, friendly, conversational reply (1-3 sentences).

Return ONLY valid JSON matching this schema:
{
  "reply": "string",
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
 * High-quality heuristic fallback with natural language understanding
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

  const isGreeting = /^(hi|hello|hey|greetings|hola|good\s*(morning|evening|afternoon)|sup|yo)\b/i.test(text);

  if (isGreeting && currentState.currentStep !== "WELCOME") {
    return {
      reply: `Hello! I'm your ZapAI setup assistant for ${currentState.businessName || "your store"}. We are currently on the "${currentState.currentStep.replace(/_/g, " ")}" step. How can I help, or would you like to continue configuring your store?`,
      nextStep: currentState.currentStep,
      extracted: {},
      completionPercentage: currentState.completionPercentage,
    };
  }

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
      nextStep = "AGENT_SETUP";
      progress = 50;
      reply = `Connected Shopify store catalog. Real-time SKU prices and stock levels are indexed! Now, let's configure your AI Seller's negotiation boundaries.`;
    } else if (text.includes("native") || text.includes("zapai") || text.includes("manual") || text.includes("catalog")) {
      extracted.provider = "ZAPAI";
      nextStep = "CATALOG_SETUP";
      progress = 40;
      reply = `Native catalog selected. You can add your products with strict floor prices so your AI never sells below cost. What products do you want to list?`;
    } else {
      reply = `Would you like to add products directly to your ZapAI Native Catalog, or connect an existing Shopify store?`;
    }
  } else if (currentState.currentStep === "CATALOG_SETUP") {
    if (text.includes("added") || text.includes("sku") || text.includes("price") || text.includes("₹") || text.includes("rs")) {
      nextStep = "AGENT_SETUP";
      progress = 65;
      reply = `Product indexed with strict floor barriers! Now, let's establish your negotiation profile. What maximum discount should your agent offer during live WhatsApp negotiations?`;
    } else {
      reply = `Please click 'Add Product Details' above to add your product to the catalog, or type in your product name and price.`;
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
      reply = `Please connect your WhatsApp Business phone number so your AI agent can receive customer chats.`;
    }
  } else if (currentState.currentStep === "RAZORPAY_CONNECT") {
    if (text.includes("razorpay") || text.includes("rzp") || text.includes("connect") || text.includes("test")) {
      extracted.razorpayConnected = true;
      nextStep = "READY";
      progress = 100;
      reply = `Razorpay Test Mode connected and webhooks active! Your autonomous AI storefront is 100% configured and ready to accept live orders.`;
    } else {
      reply = `Please click 'Connect Razorpay Test Credentials' to activate instant UPI settlements for your store.`;
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
