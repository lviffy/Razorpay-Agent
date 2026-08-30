import { NextRequest, NextResponse } from "next/server";
import { computeInventoryHealthFromProducts } from "@/lib/ai/growth-gemini";

export async function GET(req: NextRequest) {
  try {
    const backendBase =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
    const storeId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");
    const filterStatus = (req.nextUrl.searchParams.get("filter") || "ALL").toUpperCase();

    const headers: Record<string, string> = {};
    if (storeId) headers["X-Store-ID"] = storeId;

    let products: any[] = [];
    try {
      const res = await fetch(`${backendBase}/api/v1/products`, { headers, cache: "no-store" });
      if (res.ok) {
        products = await res.json();
      }
    } catch {
      // fallback
    }

    const healthReports = computeInventoryHealthFromProducts(products);

    const filtered = filterStatus && filterStatus !== "ALL"
      ? healthReports.filter((h) => h.stockStatus === filterStatus || (filterStatus === "CRITICAL" && (h.stockStatus === "CRITICAL_LOW" || h.stockStatus === "OUT_OF_STOCK")))
      : healthReports;

    const criticalCount = healthReports.filter((h) => h.stockStatus === "CRITICAL_LOW" || h.stockStatus === "OUT_OF_STOCK").length;
    const lowCount = healthReports.filter((h) => h.stockStatus === "LOW_STOCK").length;
    const deadStockCount = healthReports.filter((h) => h.stockStatus === "DEAD_STOCK").length;

    return NextResponse.json({
      totalCatalogSKUs: healthReports.length,
      summary: {
        criticalStockoutRisks: criticalCount,
        lowStockWarnings: lowCount,
        deadStockAlerts: deadStockCount,
        healthyStockCount: healthReports.length - (criticalCount + lowCount + deadStockCount),
      },
      products: filtered,
    });
  } catch (err: any) {
    console.error("[API Growth AI Inventory Radar] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to compute inventory radar" },
      { status: 500 }
    );
  }
}
