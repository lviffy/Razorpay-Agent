"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { NegotiationRules } from "@/lib/types";
import { defaultNegotiationRules } from "@/lib/api/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import {
  Sliders,
  ShieldCheck,
  CreditCard,
  Store,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Truck,
  AlertCircle,
} from "lucide-react";

export default function GeneralSettingsPage() {
  const [rules, setRules] = useState<NegotiationRules>(defaultNegotiationRules);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await api.settings.getRules();
        if (r) setRules(r);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
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

  // Dynamic simulated price outcome
  const sampleRetail = 4000;
  const maxDiscountAmount = Math.round(sampleRetail * (rules.maxDiscountPercent / 100));
  const finalCounterOffer = sampleRetail - maxDiscountAmount;
  const qualifiesFreeShipping = finalCounterOffer >= rules.freeShippingAbove;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Store & Negotiation Rules</h1>
            <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              Global Mandates
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Enforce strict margin boundaries, maximum discount concessions, shipping thresholds, and Razorpay gateway credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-white text-zinc-800 border-zinc-200">
            Mandate Level: Strict
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Merchant Store Identity</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Business details displayed to buyers in WhatsApp greetings.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              Active Store
            </Badge>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Business Name</label>
                <Input defaultValue="RunFast Sports" className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Support Contact (WhatsApp)</label>
                <Input defaultValue="+91 98765 00000" className="text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Base Currency</label>
                <Input defaultValue="INR (₹) — Indian Rupee" readOnly className="bg-zinc-50 font-mono text-xs text-zinc-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Negotiation Boundaries & Live Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rules Inputs (7 cols) */}
          <Card className="lg:col-span-7 border-zinc-200 shadow-xs">
            <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center gap-3 space-y-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Autonomous Negotiation Boundaries</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Hard margin ceilings the AI seller is prohibited from violating.</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700">Maximum Discount Ceiling</label>
                    <span className="text-xs font-mono font-bold text-zinc-900">{rules.maxDiscountPercent}%</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={rules.maxDiscountPercent}
                    onChange={(e) =>
                      setRules({ ...rules, maxDiscountPercent: Number(e.target.value) })
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    AI rejects any buyer offer demanding a discount greater than this ceiling.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700">Free Shipping Sweetener Threshold</label>
                    <span className="text-xs font-mono font-bold text-zinc-900">{formatINR(rules.freeShippingAbove)}</span>
                  </div>
                  <Input
                    type="number"
                    step={100}
                    value={rules.freeShippingAbove}
                    onChange={(e) =>
                      setRules({ ...rules, freeShippingAbove: Number(e.target.value) })
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Automatically added to close negotiations when order total exceeds this amount.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700">Human Escalation Value Threshold</label>
                    <span className="text-xs font-mono font-bold text-zinc-900">{formatINR(rules.humanApprovalAbove)}</span>
                  </div>
                  <Input
                    type="number"
                    step={1000}
                    value={rules.humanApprovalAbove}
                    onChange={(e) =>
                      setRules({ ...rules, humanApprovalAbove: Number(e.target.value) })
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Orders above this value automatically flag for human manager review before dispatch.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Outcome Visualizer (5 cols) */}
          <Card className="lg:col-span-5 border-zinc-200 shadow-xs flex flex-col justify-between bg-zinc-50/50">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <CardTitle className="text-xs font-bold text-zinc-900">Real-Time Mandate Simulator</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-500">
                Visualizing AI negotiation behavior on a sample ₹4,000 product.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-3">
              <div className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Sample Retail Price</span>
                  <span className="font-mono font-bold text-zinc-900">₹4,000</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Buyer Extreme Ask (25% off)</span>
                  <span className="font-mono text-red-600 font-medium">₹3,000 (Rejected)</span>
                </div>
                <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-zinc-900">AI Counter-Offer</p>
                    <p className="text-[10px] text-emerald-700 font-mono">
                      {rules.maxDiscountPercent}% max discount conceded
                    </p>
                  </div>
                  <span className="font-mono font-bold text-base text-zinc-900">
                    {formatINR(finalCounterOffer)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-600" />
                  <span className="text-zinc-700">Free Express Delivery:</span>
                </div>
                <Badge variant="outline" className={`font-mono text-[10px] ${qualifiesFreeShipping ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-zinc-100 text-zinc-600"}`}>
                  {qualifiesFreeShipping ? "✓ Included Free" : "Standard ₹150"}
                </Badge>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-2 border-t border-zinc-200 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
              <span>Dealer Margin Saved:</span>
              <span className="font-bold text-zinc-900 font-mono">+{formatINR(4000 - finalCounterOffer)} protected</span>
            </CardFooter>
          </Card>
        </div>

        {/* Razorpay Integration */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Razorpay Payment Gateway Integration</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Credentials used by the AI seller to generate instant UPI Payment Links.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-zinc-100 text-zinc-700 border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </Badge>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Razorpay Key ID</label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    defaultValue="rzp_test_9k81729341092831"
                    readOnly
                    className="font-mono text-xs bg-zinc-50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Environment</label>
                <Input defaultValue="Test Mode (Razorpay Sandbox)" readOnly className="bg-zinc-50 font-mono text-xs text-zinc-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            className="h-9 px-6 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
          >
            Save Store Rules & Mandates
          </Button>
          {saved && (
            <Badge variant="outline" className="gap-1 text-xs text-zinc-700 font-medium bg-zinc-100 px-3 py-1.5 border-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Settings saved & synced with AI Agent!
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}

