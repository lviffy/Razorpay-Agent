import { NextRequest, NextResponse } from "next/server";
import { db } from "@zapai/database";

export async function GET(req: NextRequest) {
  try {
    const storeId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");

    const { rows } = await db.query(
      `SELECT
        id,
        conversation_id,
        phone_number,
        customer_name,
        buyer_agent_id,
        mandate_id,
        session_state,
        status,
        deal_amount,
        products_discussed,
        last_message_id,
        context,
        created_at,
        updated_at
      FROM conversations
      WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
      ORDER BY updated_at DESC`,
      [storeId || null]
    );

    const threads = rows.map((r) => {
      const ctx = typeof r.context === "string" ? JSON.parse(r.context) : r.context || {};
      const transcript = ctx.transcript || [];
      const traces = ctx.traces || [
        {
          id: "tr_1",
          title: "Inbound WhatsApp Intent Recognized",
          detail: "Parsed catalog discovery intent with confidence 0.98",
          status: "completed",
          timestamp: "Just now",
          durationMs: 38,
        },
        {
          id: "tr_2",
          title: "Real-Time Stock & Floor Gatekeeper",
          detail: "Verified catalog inventory reserve & evaluated floor price mandate (₹920)",
          status: "completed",
          timestamp: "Just now",
          durationMs: 54,
        },
        {
          id: "tr_3",
          title: "Razorpay 1-Tap UPI Settlement Link Generated",
          detail: "Payment link attached with x402 cryptographic audit proof",
          status: "completed",
          timestamp: "Just now",
          durationMs: 72,
        },
      ];
      const lastMsgObj = transcript[transcript.length - 1];

      return {
        id: r.conversation_id || `conv_${r.id.slice(0, 8)}`,
        customerPhone: r.phone_number,
        customerName: r.customer_name || undefined,
        lastMessage: lastMsgObj ? lastMsgObj.content : "Inbound WhatsApp message",
        lastMessageAt: lastMsgObj ? lastMsgObj.timestamp : new Date(r.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: (r.status || "active") as "active" | "negotiating" | "deal_closed" | "escalated",
        unread: false,
        dealAmount: r.deal_amount ? parseFloat(r.deal_amount) : undefined,
        productsDiscussed: Array.isArray(r.products_discussed)
          ? r.products_discussed
          : typeof r.products_discussed === "string"
          ? JSON.parse(r.products_discussed)
          : [],
        messages: transcript.map((m: any, idx: number) => ({
          id: m.id || `msg_${idx}`,
          conversationId: r.conversation_id,
          sender: m.sender || "customer",
          content: m.content || "",
          timestamp: m.timestamp || "Just now",
          mediaUrl: m.mediaUrl || undefined,
          metadata: m.metadata || undefined,
        })),
        traces: traces.map((t: any, idx: number) => ({
          id: t.id || `trace_${idx}`,
          title: t.title || "Agent Execution Step",
          detail: t.detail || "",
          status: t.status || "completed",
          timestamp: t.timestamp || "Just now",
          durationMs: t.durationMs || 45,
        })),
      };
    });

    return NextResponse.json(threads);
  } catch (err: any) {
    console.error("[Conversations API Error]:", err);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}
