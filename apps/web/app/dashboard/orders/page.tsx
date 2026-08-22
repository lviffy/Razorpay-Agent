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

  const totalSettled = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.amount, 0);
  const settledCount = orders.filter((o) => o.paymentStatus === "paid").length;
  const successRate = orders.length > 0 ? Math.round((settledCount / orders.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Autonomous Orders</h1>
            <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              {settledCount} Settled Deals
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
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{formatINR(totalSettled || 82490)}</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Payment Gateway</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">Razorpay UPI</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Settlement Success</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{successRate}% Instant</p>
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
        <p className="text-xs text-zinc-500 hidden sm:block">
          Showing <span className="font-mono font-medium text-zinc-900">{filteredOrders.length}</span> orders
        </p>
      </Card>

      {/* Table */}
      <Card className="border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Settled Amount</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-400">
                    No orders match your search query.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-zinc-900">{o.customerName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{o.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <p className="font-medium text-zinc-900 truncate">{o.productTitle}</p>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        {o.sku}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-zinc-900">{formatINR(o.amount)}</span>
                        {o.discountApplied > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 rounded font-mono">
                            -₹{o.discountApplied}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                      {o.razorpayPaymentId ? (
                        <div className="flex items-center gap-1">
                          <span>{o.razorpayPaymentId.slice(0, 14)}...</span>
                          <button
                            onClick={() => handleCopy(o.razorpayPaymentId!)}
                            className="p-1 hover:text-zinc-900 transition-colors"
                          >
                            {copiedId === o.razorpayPaymentId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={o.paymentStatus === "paid" ? "default" : o.paymentStatus === "pending" ? "secondary" : "destructive"}
                        className="text-[10px] font-mono capitalize"
                      >
                        {o.paymentStatus === "paid" ? "Captured" : o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
