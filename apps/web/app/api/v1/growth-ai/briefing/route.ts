import { NextRequest, NextResponse } from "next/server";
import { generateDailyBriefingInWeb } from "@/lib/ai/growth-gemini";

export async function GET(req: NextRequest) {
  try {
    const storeId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");
    const briefing = await generateDailyBriefingInWeb(storeId);
    return NextResponse.json(briefing);
  } catch (err: any) {
    console.error("[API Growth AI Briefing] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate daily briefing" },
      { status: 500 }
    );
  }
}
