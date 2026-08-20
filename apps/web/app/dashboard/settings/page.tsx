"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { NegotiationRules } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sliders, ShieldCheck, Zap, CreditCard, Lock } from "lucide-react";

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
    setTimeout(() => setSaved(false), 2000);
  };

  if (!rules) return <div className="text-xs text-surface-500">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Store & Negotiation Rules</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Global margin boundaries, discount ceilings, and payment gateway controls.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Store Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Merchant Store Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Business Name</label>
                <Input defaultValue="RunFast Sports" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Currency</label>
                <Input defaultValue="INR (₹)" readOnly className="bg-surface-50 font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Negotiation Boundaries */}
        <Card>
          <CardHeader>
            <CardTitle>Global AI Negotiation Boundaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Maximum Discount Ceiling (%)</label>
                <Input
                  type="number"
                  value={rules.maxDiscountPercent}
                  onChange={(e) =>
                    setRules({ ...rules, maxDiscountPercent: Number(e.target.value) })
                  }
                />
                <p className="text-[11px] text-surface-500">
                  AI will never accept customer bids exceeding this percentage.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Free Shipping Threshold (₹)</label>
                <Input
                  type="number"
                  value={rules.freeShippingAbove}
                  onChange={(e) =>
                    setRules({ ...rules, freeShippingAbove: Number(e.target.value) })
                  }
                />
                <p className="text-[11px] text-surface-500">
                  Automatically offered as a deal sweetener above this order amount.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">
                Human Escalation Threshold (₹)
              </label>
              <Input
                type="number"
                value={rules.humanApprovalAbove}
                onChange={(e) =>
                  setRules({ ...rules, humanApprovalAbove: Number(e.target.value) })
                }
              />
              <p className="text-[11px] text-surface-500">
                Deals above this value pause for merchant confirmation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Razorpay Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Razorpay Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Razorpay Key ID</label>
                <Input defaultValue="rzp_test_9k81729341" className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Environment</label>
                <Input defaultValue="TEST MODE" readOnly className="bg-surface-50 font-mono text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Save Settings
          </Button>
          {saved && <span className="text-xs text-emerald-600 font-semibold">Saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}
