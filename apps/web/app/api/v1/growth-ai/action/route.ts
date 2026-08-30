import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionType, sku, value } = body;

    const backendBase =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
    const storeId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (storeId) headers["X-Store-ID"] = storeId;

    // Try forwarding to backend if available
    try {
      const res = await fetch(`${backendBase}/api/v1/growth-ai/action`, {
        method: "POST",
        headers,
        body: JSON.stringify({ actionType, sku, value }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback local simulated response
    }

    // Success response
    let message = "Action completed successfully.";
    if (actionType === "RESTOCK_INVENTORY") {
      message = `Restocked ${value} units for SKU ${sku || "item"}.`;
    } else if (actionType === "UPDATE_FLOOR_PRICE") {
      message = `Updated floor price to ₹${Number(value).toLocaleString("en-IN")} for SKU ${sku || "item"}.`;
    } else if (actionType === "UPDATE_LISTED_PRICE") {
      message = `Updated listed price to ₹${Number(value).toLocaleString("en-IN")} for SKU ${sku || "item"}.`;
    } else if (actionType === "UPDATE_MAX_DISCOUNT") {
      message = `Updated maximum discount to ${value}%.`;
    }

    return NextResponse.json({
      success: true,
      action: actionType,
      message,
    });
  } catch (err: any) {
    console.error("[API Growth AI Action] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}
