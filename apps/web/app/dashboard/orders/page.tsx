"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Order } from "@/lib/types";
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
  Edit2,
  Zap,
  Package,
  ArrowRight,
} from "lucide-react";
import { EditOrderModal } from "@/components/orders/edit-order-modal";
import { useStore } from "@/lib/context/store-context";

export default function OrdersPage() {
  const { currentStore, refreshTrigger } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState<number>(0);

  useEffect(() => {
    loadOrders();
    loadEscalations();
  }, [currentStore?.id, refreshTrigger]);

  const loadOrders = async () => {
    try {
      const list = await api.orders.list();
      if (list) setOrders(list);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  };

  const loadEscalations = async () => {
    try {
      const convs = await api.conversations.list();
      if (convs && Array.isArray(convs)) {
        const count = convs.filter((c) => c.status === "escalated").length;
        setEscalatedCount(count);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  };

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
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{formatINR(totalSettled)}</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Payment Gateway</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">Razorpay Instant</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Settlement Success</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{successRate}% Instant</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Human Escalation</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{escalatedCount} Interventions</p>
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
          <table className="w-full min-w-[680px] text-xs text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Settled Amount</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 px-4">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center shadow-2xs">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">
                          {search ? "No matching orders found" : "No autonomous orders recorded yet"}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          {search
                            ? "Try clearing your search query or searching by a different customer name or payment ID."
                            : "When buyer agents negotiate with your AI Seller on WhatsApp, confirmed deals and Razorpay UPI settlements will appear here in real-time."}
                        </p>
                      </div>
                      {!search && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <Link href="/dashboard/whatsapp">
                            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                              <Zap className="w-3.5 h-3.5" />
                              <span>Simulate WhatsApp Order</span>
                            </Button>
                          </Link>
                          <Link href="/dashboard/products">
                            <Button size="sm" variant="outline" className="h-8 text-xs font-medium gap-1.5 bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-2xs">
                              <Package className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Manage Product Catalog</span>
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
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
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(o)}
                        className="text-xs h-7 px-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300 font-medium inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
