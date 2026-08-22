"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Order } from "@/lib/types";
import { initialMockOrders } from "@/lib/api/mock-data";
import { formatINR, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ShoppingBag,
  Search,
  Check,
  Copy,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialMockOrders);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.orders.list();
        if (list && list.length > 0) setOrders(list);
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    }
    load();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.productTitle.toLowerCase().includes(term) ||
      (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Autonomous Orders</h1>
            <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              37 Settled Deals
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Full lifecycle orders captured through AI WhatsApp negotiations and settled via Razorpay UPI.
          </p>
        </div>
      </div>

      {/* Settlement KPIs using shadcn Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Total Settled Volume</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">₹82,490</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Payment Gateway</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">Razorpay UPI</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Settlement Success</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">100% Instant</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Human Escalation</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">0 Interventions</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-3 border-zinc-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, payment ID..."
            className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
        <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">
          Showing {filteredOrders.length} orders
        </span>
      </Card>

      {/* Desktop Orders Table */}
      <Card className="hidden md:block border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4 text-right">Negotiated Final</th>
                <th className="py-3 px-4">Razorpay Payment ID</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900">{ord.customerName}</div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900">{ord.productTitle}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{ord.sku}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="font-bold text-zinc-900">{formatINR(ord.amount)}</span>
                    {ord.discountApplied > 0 && (
                      <div className="text-[10px] text-zinc-500 font-mono">
                        -₹{ord.discountApplied} off
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600 text-[11px]">
                    {ord.razorpayPaymentId ? (
                      <button
                        onClick={() => handleCopy(ord.razorpayPaymentId!)}
                        className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-700 transition-colors"
                        title="Click to copy Razorpay payment ID"
                      >
                        <span>{ord.razorpayPaymentId}</span>
                        {copiedId === ord.razorpayPaymentId ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="outline" className="gap-1 text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Captured (UPI)
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="outline" className="text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200 font-mono uppercase">
                      {ord.orderStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-400 font-mono text-[11px]">
                    {formatDate(ord.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Orders Card List */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((ord) => (
          <Card
            key={ord.id}
            className="border-zinc-200 p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-blue-600">{ord.orderNumber}</span>
              <Badge variant="outline" className="gap-1 text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Paid
              </Badge>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-900">{ord.customerName}</p>
              <p className="text-[11px] text-zinc-500 font-mono">{ord.customerPhone}</p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-semibold text-zinc-900">{ord.productTitle}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{ord.sku}</p>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-zinc-900 text-sm">{formatINR(ord.amount)}</span>
                {ord.discountApplied > 0 && (
                  <p className="text-[10px] text-zinc-500">-₹{ord.discountApplied}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span className="font-mono">{ord.razorpayPaymentId || "UPI Instant"}</span>
              <span className="font-mono">{formatDate(ord.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

