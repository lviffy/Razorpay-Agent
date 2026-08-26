"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Package,
  User,
  Phone,
  Tag,
  CheckCircle2,
  Send,
  Truck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: (updated: Order) => void;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [sku, setSku] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending" | "failed" | "refunded">("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || "");
      setCustomerPhone(order.customerPhone || "");
      setProductTitle(order.productTitle || "");
      setSku(order.sku || "");
      setAmount(order.amount || 0);
      setPaymentStatus(order.paymentStatus || "pending");
      setTrackingNumber("");
      setNotes("");
      setError(null);
      setSuccessNotice(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.orders.update(order.id, {
        customerName,
        customerPhone,
        productTitle,
        sku,
        amount,
        paymentStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        notifyWhatsApp,
      });

      if (updated) {
        onOrderUpdated(updated);
        setSuccessNotice("Order updated successfully!");
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Fallback optimistic update
        onOrderUpdated({
          ...order,
          customerName,
          customerPhone,
          productTitle,
          sku,
          amount,
          paymentStatus,
        });
        setSuccessNotice("Order updated successfully!");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Failed to update order:", err);
      setError(err.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100">
                  Edit Order #{order.orderNumber}
                </h3>
                <Badge
                  variant={paymentStatus === "paid" ? "default" : paymentStatus === "refunded" ? "destructive" : "secondary"}
                  className="text-[10px] font-mono capitalize"
                >
                  {paymentStatus === "paid" ? "Captured" : paymentStatus}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Update customer information, order status, and dispatch tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Payment & Order Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="paid">Captured / Paid (Settled)</option>
                <option value="pending">Pending Payment</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Cancelled / Failed</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Settled Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="1200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Aarav Patel"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                WhatsApp Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="917077013159"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Product Title */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Product Title
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Rohan Running Shoes"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="SKU-001"
              />
            </div>
          </div>

          {/* Tracking / Dispatch info */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-zinc-400" />
              Dispatch / Courier Tracking #
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. BlueDart #BD-8849201"
            />
          </div>

          {/* Merchant Notes */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Merchant Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. Special packaging requested"
            />
          </div>

          {/* WhatsApp Notification Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-zinc-800/40 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs text-zinc-200">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send WhatsApp status update to customer on save</span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 text-xs px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
