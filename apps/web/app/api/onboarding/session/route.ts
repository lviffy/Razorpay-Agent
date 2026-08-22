import { NextRequest, NextResponse } from "next/server";
import { OnboardingState } from "@/lib/types";

let sessionStore: OnboardingState = {
  id: "onb_sess_001",
  merchantId: "merch_runfast",
  currentStep: "WELCOME",
  provider: null,
  businessName: null,
  productCount: 4,
  agentConfigured: false,
  whatsappConnected: false,
  razorpayConnected: false,
  completionPercentage: 10,
  history: [
    {
      id: "msg_init",
      sender: "assistant",
      content: "Welcome to ZapAI! Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
      step: "WELCOME",
      createdAt: new Date().toISOString(),
    },
  ],
};

export async function GET() {
  return NextResponse.json(sessionStore);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "reset") {
      sessionStore = {
        id: `onb_sess_${Date.now()}`,
        merchantId: "merch_runfast",
        currentStep: "WELCOME",
        provider: null,
        businessName: null,
        productCount: 4,
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
      return NextResponse.json(sessionStore);
    }

    if (body.state) {
      sessionStore = body.state;
      return NextResponse.json(sessionStore);
    }

    return NextResponse.json(sessionStore);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
