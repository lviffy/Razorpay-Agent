"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { NegotiationRules } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sliders,
  ShieldCheck,
  CreditCard,
  Store,
  Check,
} from "lucide-react";

export default function GeneralSettingsPage() {
  const [rules, setRules] = useState<NegotiationRules | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const r = await api.settings.getRules();
      setRules(r);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    await api.settings.saveRules(rules);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!rules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-xs text-zinc-500 font-mono">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Store & Negotiation Rules</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-zinc-100 text-zinc-700 border border-zinc-200">
            Global Policies
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Configure global margin boundaries, discount ceilings, free shipping rules, and payment gateway credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Merchant Store Identity</h2>
              <p className="text-[11px] text-zinc-500">Business details displayed to buyers in WhatsApp greetings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Business Name</label>
              <Input defaultValue="RunFast Sports" className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Base Currency</label>
              <Input defaultValue="INR (₹)" readOnly className="bg-zinc-50 font-mono text-xs text-zinc-700" />
            </div>
          </div>
        </div>

        {/* Global Negotiation Boundaries */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Autonomous AI Negotiation Boundaries</h2>
              <p className="text-[11px] text-zinc-500">Hard ceilings and discount limits the AI seller is prohibited from exceeding.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Maximum Discount Ceiling (%)</label>
              <Input
                type="number"
                value={rules.maxDiscountPercent}
                onChange={(e) =>
                  setRules({ ...rules, maxDiscountPercent: Number(e.target.value) })
                }
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-500">
                AI will never accept buyer counter-offers exceeding this percentage.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Free Shipping Sweetener Threshold (₹)</label>
              <Input
                type="number"
                value={rules.freeShippingAbove}
                onChange={(e) =>
                  setRules({ ...rules, freeShippingAbove: Number(e.target.value) })
                }
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-500">
                Automatically offered to close negotiations above this order value.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-zinc-700">
              Human Escalation Value Threshold (₹)
            </label>
            <Input
              type="number"
              value={rules.humanApprovalAbove}
              onChange={(e) =>
                setRules({ ...rules, humanApprovalAbove: Number(e.target.value) })
              }
              className="font-mono text-xs sm:w-1/2"
            />
            <p className="text-[11px] text-zinc-500">
              Orders above this amount automatically pause for human merchant confirmation.
            </p>
          </div>
        </div>

        {/* Razorpay Integration */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Razorpay Payment Gateway</h2>
              <p className="text-[11px] text-zinc-500">Instant UPI Payment Link generator credentials.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Razorpay Key ID</label>
              <Input defaultValue="rzp_test_9k81729341" className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Environment</label>
              <Input defaultValue="Test Mode / Sandbox" readOnly className="bg-zinc-50 font-mono text-xs text-zinc-700" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            className="h-8 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
          >
            Save Store Rules
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-700 font-medium bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Settings saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
