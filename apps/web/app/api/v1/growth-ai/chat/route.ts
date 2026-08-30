import { NextRequest, NextResponse } from "next/server";
import { processGrowthAIChatInWeb } from "@/lib/ai/growth-gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const storeId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");

    let messages = body.messages;
    if (!Array.isArray(messages) && body.message) {
      messages = [{ role: "user", content: body.message }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array or message string required" }, { status: 400 });
    }

    const result = await processGrowthAIChatInWeb(messages, storeId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API Growth AI Chat] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process chat with Growth AI" },
      { status: 500 }
    );
  }
}
