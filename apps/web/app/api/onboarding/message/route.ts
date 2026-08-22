import { NextRequest, NextResponse } from "next/server";
import { generateOnboardingAIResponse } from "@/lib/ai/gemini";
import { OnboardingState } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, state } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const currentState: OnboardingState = state || {
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
      history: [],
    };

    // Run real Gemini AI reasoning
    const aiOutput = await generateOnboardingAIResponse({
      userMessage: content,
      currentState: {
        currentStep: currentState.currentStep,
        businessName: currentState.businessName,
        provider: currentState.provider,
        productCount: currentState.productCount,
        agentConfigured: currentState.agentConfigured,
        whatsappConnected: currentState.whatsappConnected,
        razorpayConnected: currentState.razorpayConnected,
        completionPercentage: currentState.completionPercentage,
        history: currentState.history.map((h) => ({
          sender: h.sender,
          content: h.content,
          step: h.step,
        })),
      },
    });

    const userMsgId = `usr_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    // Apply extracted entities from AI
    if (aiOutput.extracted.businessName) {
      currentState.businessName = aiOutput.extracted.businessName;
    }
    if (aiOutput.extracted.provider) {
      currentState.provider = aiOutput.extracted.provider;
    }
    if (aiOutput.extracted.discountRules) {
      currentState.agentConfigured = true;
    }
    if (aiOutput.extracted.whatsappConnected) {
      currentState.whatsappConnected = true;
    }
    if (aiOutput.extracted.razorpayConnected) {
      currentState.razorpayConnected = true;
    }

    currentState.currentStep = (aiOutput.nextStep || currentState.currentStep) as any;
    currentState.completionPercentage = aiOutput.completionPercentage;

    currentState.history.push({
      id: userMsgId,
      sender: "user",
      content,
      step: currentState.currentStep,
      createdAt: new Date().toISOString(),
    });

    currentState.history.push({
      id: botMsgId,
      sender: "assistant",
      content: aiOutput.reply,
      step: currentState.currentStep,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      reply: aiOutput.reply,
      state: currentState,
    });
  } catch (err: any) {
    console.error("[API Onboarding Message] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process message with AI" },
      { status: 500 }
    );
  }
}
