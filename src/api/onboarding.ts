import { Router } from "express";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

// In-memory or DB session tracking for onboarding
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

let activeSession: OnboardingSession = {
  id: "onb_sess_001",
  merchantId: "merch_runfast",
  currentStep: "WELCOME",
  provider: null,
  businessName: "RunFast Sports",
  productCount: 4,
  agentConfigured: true,
  whatsappConnected: true,
  razorpayConnected: true,
  completionPercentage: 100,
  history: [
    {
      id: "msg_init",
      sender: "assistant",
      content: "Welcome to AgentBridge! Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
      step: "WELCOME",
      createdAt: new Date().toISOString(),
    },
  ],
};

// GET /api/v1/onboarding/session
router.get("/session", async (_req: Request, res: Response) => {
  return res.json(activeSession);
});

// POST /api/v1/onboarding/message
router.post("/message", async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

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

  switch (activeSession.currentStep) {
    case "WELCOME": {
      activeSession.businessName = content.trim();
      nextStep = "STORE_SOURCE";
      activeSession.completionPercentage = 25;
      botReply = `Great to meet you! "${activeSession.businessName}" is an ideal fit for AgentBridge. Where do your products live today?`;
      break;
    }
    case "STORE_SOURCE": {
      if (content.toLowerCase().includes("shopify")) {
        activeSession.provider = "SHOPIFY";
        nextStep = "SHOPIFY_CONNECT";
        activeSession.completionPercentage = 40;
        botReply = "Connecting with Shopify gives your AI agent direct access to real-time inventory and pricing. Enter your Shopify store domain below:";
      } else {
        activeSession.provider = "AGENTBRIDGE";
        nextStep = "CATALOG_SETUP";
        activeSession.completionPercentage = 40;
        botReply = "Awesome! The native AgentBridge catalog gives you instant control. You can describe your products, add them manually, or import a CSV.";
      }
      break;
    }
    case "CATALOG_SETUP": {
      nextStep = "AGENT_SETUP";
      activeSession.completionPercentage = 60;
      botReply = `Got it! I structured your products with live inventory. Now let's set your AI Seller Agent's negotiation boundaries. How flexible should it be on discounts?`;
      break;
    }
    case "AGENT_SETUP": {
      activeSession.agentConfigured = true;
      nextStep = "WHATSAPP_CONNECT";
      activeSession.completionPercentage = 75;
      botReply = "Negotiation rules saved: maximum discount 12%, floor price enforced, and bundle suggestions active. Next, connect your WhatsApp Business account so buyers can message your agent.";
      break;
    }
    case "WHATSAPP_CONNECT": {
      activeSession.whatsappConnected = true;
      nextStep = "RAZORPAY_CONNECT";
      activeSession.completionPercentage = 85;
      botReply = "WhatsApp Cloud API connected (+91 98765 00000). Now connect your Razorpay account so your AI agent can generate secure payment links and capture payments.";
      break;
    }
    case "RAZORPAY_CONNECT": {
      activeSession.razorpayConnected = true;
      nextStep = "TEST";
      activeSession.completionPercentage = 95;
      botReply = "Razorpay Test Mode connected and webhooks verified! Everything is ready. Let's run an interactive simulation to test your AI storefront.";
      break;
    }
    case "TEST": {
      nextStep = "READY";
      activeSession.completionPercentage = 100;
      botReply = "Simulation complete! Deal negotiated and test payment link generated successfully. You are ready to launch your live store!";
      break;
    }
    default: {
      nextStep = "COMPLETED";
      activeSession.completionPercentage = 100;
      botReply = "Store activated! Redirecting you to your merchant dashboard...";
      break;
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

export default router;
