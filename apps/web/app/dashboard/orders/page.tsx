"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Order } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShoppingBag, ArrowUpRight } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const list = await api.orders.list();
      setOrders(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Autonomous Orders</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Full lifecycle orders captured through AI WhatsApp negotiations and settled via Razorpay.
        </p>
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden md:block bg-white border border-surface-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-surface-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4 text-right">Negotiated Amount</th>
                <th className="py-3 px-4">Razorpay Payment ID</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-surface-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#195adc]">{ord.orderNumber}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-surface-900">{ord.customerName}</div>
                    <div className="text-[11px] text-surface-500 font-mono">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-surface-900">{ord.productTitle}</div>
                    <div className="text-[11px] text-surface-500 font-mono">{ord.sku}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="font-bold text-surface-900">{formatINR(ord.amount)}</span>
                    {ord.discountApplied > 0 && (
                      <div className="text-[10px] text-emerald-600 font-mono">
                        -₹{ord.discountApplied} off
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-surface-600 text-[11px]">
                    {ord.razorpayPaymentId || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Paid (UPI)</span>
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="brand">{ord.orderStatus.toUpperCase()}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right text-surface-500 font-mono text-[11px]">
                    {formatDate(ord.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Orders Card List */}
      <div className="md:hidden space-y-3">
        {orders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white border border-surface-200 rounded-xl p-4 space-y-3 shadow-subtle"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#195adc]">{ord.orderNumber}</span>
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Paid</span>
              </Badge>
            </div>

            <div>
              <p className="text-xs font-bold text-surface-900">{ord.customerName}</p>
              <p className="text-[11px] text-surface-500 font-mono">{ord.customerPhone}</p>
            </div>

            <div className="p-2.5 bg-surface-50 rounded-lg border border-surface-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-semibold text-surface-900">{ord.productTitle}</p>
                <p className="text-[10px] text-surface-500 font-mono">{ord.sku}</p>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-surface-900">{formatINR(ord.amount)}</span>
                {ord.discountApplied > 0 && (
                  <p className="text-[10px] text-emerald-600">-₹{ord.discountApplied}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-surface-500 pt-1">
              <span className="font-mono">{ord.razorpayPaymentId || "UPI Instant"}</span>
              <span className="font-mono">{formatDate(ord.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
