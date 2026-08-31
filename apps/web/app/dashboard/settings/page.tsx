"use client";

import React, { useEffect, useState } from "react";
import { api, defaultNegotiationRules, defaultStoreCredentials } from "@/lib/api/client";
import { NegotiationRules, StoreCredentials } from "@/lib/types";
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
  Smartphone,
  Copy,
  CheckCircle2,
  RefreshCw,
  Zap,
  ShoppingBag,
} from "lucide-react";

export default function GeneralSettingsPage() {
  const [rules, setRules] = useState<NegotiationRules>(defaultNegotiationRules);
  const [creds, setCreds] = useState<StoreCredentials>(defaultStoreCredentials);
  const [businessName, setBusinessName] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Visibility toggles
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showShopifyToken, setShowShopifyToken] = useState(false);

  // Test states
  const [testingRzp, setTestingRzp] = useState(false);
  const [rzpTestResult, setRzpTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const [testingShopify, setTestingShopify] = useState(false);
  const [shopifyTestResult, setShopifyTestResult] = useState<{ success?: boolean; message?: string; error?: string; shop?: any } | null>(null);
  const [syncingShopify, setSyncingShopify] = useState(false);
  const [shopifySyncResult, setShopifySyncResult] = useState<{ success?: boolean; message?: string; error?: string; syncedCount?: number } | null>(null);

  // Copy states
  const [copiedRzpUrl, setCopiedRzpUrl] = useState(false);
  const [copiedWaUrl, setCopiedWaUrl] = useState(false);
  const [copiedWaToken, setCopiedWaToken] = useState(false);

  // Dynamic simulated price outcome
  const [sampleRetail, setSampleRetail] = useState<number>(4000);

  useEffect(() => {
    async function load() {
      try {
        const [r, p, c, prods] = await Promise.all([
          api.settings.getRules(),
          api.profile.get(),
          api.settings.getCredentials(),
          api.products.list(),
        ]);
        if (r) setRules(r);
        if (p) {
          if (p.storeName) setBusinessName(p.storeName);
          if (p.phone) setSupportPhone(p.phone);
        }
        if (c) {
          setCreds(c);
          if (c.whatsappPhoneNumber && !supportPhone) {
            setSupportPhone(c.whatsappPhoneNumber);
          }
        }
        if (prods && prods.length > 0 && prods[0].price > 0) {
          setSampleRetail(prods[0].price);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    load();
  }, []);

  const handleTestRazorpay = async () => {
    if (!creds.razorpayKeyId) {
      setRzpTestResult({ error: "Please enter a Razorpay Key ID" });
      return;
    }
    setTestingRzp(true);
    setRzpTestResult(null);
    try {
      const res = await api.settings.testRazorpay({
        keyId: creds.razorpayKeyId,
        keySecret: creds.razorpayKeySecret || "",
      });
      setRzpTestResult(res);
    } catch (err: any) {
      setRzpTestResult({ error: err.message || "Failed to test Razorpay connection" });
    } finally {
      setTestingRzp(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!creds.whatsappPhoneNumberId) {
      setWaTestResult({ error: "Please enter a Meta Phone Number ID" });
      return;
    }
    setTestingWa(true);
    setWaTestResult(null);
    try {
      const res = await api.settings.testWhatsApp({
        phoneNumberId: creds.whatsappPhoneNumberId,
        accessToken: creds.whatsappAccessToken || "",
      });
      setWaTestResult(res);
    } catch (err: any) {
      setWaTestResult({ error: err.message || "Failed to test Meta Cloud API" });
    } finally {
      setTestingWa(false);
    }
  };

  const handleTestShopify = async () => {
    if (!creds.shopifyShopDomain) {
      setShopifyTestResult({ error: "Please enter your Shopify store domain (e.g., rohanm.in or your-store.myshopify.com)" });
      return;
    }
    if (!creds.shopifyAccessToken) {
      setShopifyTestResult({ error: "Please enter your Shopify Admin API Access Token (shpat_...)" });
      return;
    }
    setTestingShopify(true);
    setShopifyTestResult(null);
    try {
      const res = await api.settings.testShopify({
        shopDomain: creds.shopifyShopDomain,
        accessToken: creds.shopifyAccessToken,
      });
      setShopifyTestResult(res);
    } catch (err: any) {
      setShopifyTestResult({ error: err.message || "Failed to test Shopify connection" });
    } finally {
      setTestingShopify(false);
    }
  };

  const handleSyncShopify = async () => {
    if (!creds.shopifyShopDomain || !creds.shopifyAccessToken) {
      setShopifySyncResult({ error: "Please configure and test your Shopify domain and token first." });
      return;
    }
    setSyncingShopify(true);
    setShopifySyncResult(null);
    try {
      const res = await api.shopify.verifyAndSync({
        shopDomain: creds.shopifyShopDomain,
        accessToken: creds.shopifyAccessToken,
        maxDiscountPercent: rules.maxDiscountPercent || 15,
      });
      if (res.success) {
        setShopifySyncResult({
          success: true,
          syncedCount: res.syncedCount,
          message: `Synced ${res.syncedCount} products from ${res.shop?.name || creds.shopifyShopDomain}!`,
        });
      } else {
        setShopifySyncResult({ error: res.error || "Failed to sync Shopify products" });
      }
    } catch (err: any) {
      setShopifySyncResult({ error: err.message || "Failed to sync Shopify catalog" });
    } finally {
      setSyncingShopify(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setSaving(true);
    try {
      await Promise.all([
        api.settings.saveRules(rules),
        api.profile.save({ storeName: businessName, phone: supportPhone || creds.whatsappPhoneNumber }),
        api.settings.saveCredentials({
          razorpayKeyId: creds.razorpayKeyId,
          razorpayKeySecret: creds.razorpayKeySecret,
          razorpayWebhookSecret: creds.razorpayWebhookSecret,
          whatsappPhoneNumber: supportPhone || creds.whatsappPhoneNumber,
          whatsappPhoneNumberId: creds.whatsappPhoneNumberId,
          whatsappAccessToken: creds.whatsappAccessToken,
          whatsappWebhookVerifyToken: creds.whatsappWebhookVerifyToken,
          shopifyShopDomain: creds.shopifyShopDomain,
          shopifyAccessToken: creds.shopifyAccessToken,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };


  // Dynamic simulated price outcome
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
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Support Contact (WhatsApp)</label>
                <Input
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="text-xs font-mono"
                />
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
                Visualizing AI negotiation behavior on catalog baseline price.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-3">
              <div className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Simulated Product Price</span>
                  <span className="font-mono font-bold text-zinc-900">{formatINR(sampleRetail)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Buyer Extreme Ask (25% off)</span>
                  <span className="font-mono text-red-600 font-medium">{formatINR(Math.round(sampleRetail * 0.75))} (Rejected)</span>
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
              <span className="font-bold text-zinc-900 font-mono">+{formatINR(sampleRetail - finalCounterOffer)} protected</span>
            </CardFooter>
          </Card>
        </div>

        {/* Razorpay Integration */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Razorpay Payment Gateway Credentials</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Live & Test API credentials for autonomous payment links & webhooks.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1 font-mono text-[10px] ${creds.razorpayKeyId.startsWith("rzp_live") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${creds.razorpayKeyId.startsWith("rzp_live") ? "bg-emerald-500" : "bg-blue-500"}`} />
                {creds.razorpayKeyId.startsWith("rzp_live") ? "Live Mode" : "Test Mode"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Razorpay Key ID</span>
                  <span className="text-[10px] text-zinc-400 font-normal">rzp_test_... or rzp_live_...</span>
                </label>
                <Input
                  value={creds.razorpayKeyId}
                  onChange={(e) => setCreds({ ...creds, razorpayKeyId: e.target.value })}
                  placeholder="Enter Razorpay Key ID (rzp_test_... or rzp_live_...)"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Razorpay Key Secret</span>
                  <span className="text-[10px] text-zinc-400 font-normal">From Dashboard API Keys</span>
                </label>
                <div className="relative">
                  <Input
                    type={showRzpSecret ? "text" : "password"}
                    value={creds.razorpayKeySecret || ""}
                    onChange={(e) => setCreds({ ...creds, razorpayKeySecret: e.target.value })}
                    placeholder={creds.hasRazorpayKeySecret ? "••••••••••••••••" : "Enter Key Secret"}
                    className="font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRzpSecret(!showRzpSecret)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showRzpSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Webhook Secret</span>
                  <span className="text-[10px] text-zinc-400 font-normal">HMAC Signature Verification</span>
                </label>
                <Input
                  value={creds.razorpayWebhookSecret}
                  onChange={(e) => setCreds({ ...creds, razorpayWebhookSecret: e.target.value })}
                  placeholder="Enter Webhook Secret (optional)"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800">Webhook Endpoint URL</label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={creds.razorpayWebhookUrl || "https://razorpay-agent-production.up.railway.app/webhooks/razorpay"}
                    readOnly
                    className="bg-zinc-50 font-mono text-[11px] text-zinc-600 truncate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(creds.razorpayWebhookUrl || "https://razorpay-agent-production.up.railway.app/webhooks/razorpay");
                      setCopiedRzpUrl(true);
                      setTimeout(() => setCopiedRzpUrl(false), 2000);
                    }}
                    className="h-9 px-3 shrink-0 text-xs gap-1"
                  >
                    {copiedRzpUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRzpUrl ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>
            </div>

            {rzpTestResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${rzpTestResult.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                {rzpTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{rzpTestResult.message || rzpTestResult.error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">
                Subscribe to: <code className="text-zinc-800 font-mono">payment.captured</code>, <code className="text-zinc-800 font-mono">payment.failed</code>, <code className="text-zinc-800 font-mono">order.paid</code>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestRazorpay}
                disabled={testingRzp}
                className="h-8 text-xs gap-1.5"
              >
                {testingRzp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                <span>Test Razorpay Connection</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Cloud API Integration */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">WhatsApp Cloud API (Meta) Configuration</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Official Meta Graph API channel credentials for autonomous WhatsApp customer chat.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Meta Verified
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800">WhatsApp Business Number</label>
                <Input
                  value={creds.whatsappPhoneNumber}
                  onChange={(e) => setCreds({ ...creds, whatsappPhoneNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800">Meta Phone Number ID</label>
                <Input
                  value={creds.whatsappPhoneNumberId}
                  onChange={(e) => setCreds({ ...creds, whatsappPhoneNumberId: e.target.value })}
                  placeholder="Enter Meta Phone Number ID"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Meta Access Token</span>
                </label>
                <div className="relative">
                  <Input
                    type={showWaToken ? "text" : "password"}
                    value={creds.whatsappAccessToken || ""}
                    onChange={(e) => setCreds({ ...creds, whatsappAccessToken: e.target.value })}
                    placeholder={creds.hasWhatsAppAccessToken ? "••••••••••••••••" : "Enter Meta Graph Token"}
                    className="font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaToken(!showWaToken)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showWaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800">Meta Webhook Callback URL</label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={creds.whatsappWebhookUrl || "https://razorpay-agent-production.up.railway.app/webhooks/whatsapp"}
                    readOnly
                    className="bg-zinc-50 font-mono text-[11px] text-zinc-600 truncate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(creds.whatsappWebhookUrl || "https://razorpay-agent-production.up.railway.app/webhooks/whatsapp");
                      setCopiedWaUrl(true);
                      setTimeout(() => setCopiedWaUrl(false), 2000);
                    }}
                    className="h-9 px-3 shrink-0 text-xs gap-1"
                  >
                    {copiedWaUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaUrl ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800">Webhook Verify Token</label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={creds.whatsappWebhookVerifyToken || "zapai_meta_webhook_secret_2026"}
                    readOnly
                    className="bg-zinc-50 font-mono text-[11px] text-zinc-600 truncate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(creds.whatsappWebhookVerifyToken || "zapai_meta_webhook_secret_2026");
                      setCopiedWaToken(true);
                      setTimeout(() => setCopiedWaToken(false), 2000);
                    }}
                    className="h-9 px-3 shrink-0 text-xs gap-1"
                  >
                    {copiedWaToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaToken ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>
            </div>

            {waTestResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${waTestResult.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                {waTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{waTestResult.message || waTestResult.error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestWhatsApp}
                disabled={testingWa}
                className="h-8 text-xs gap-1.5"
              >
                {testingWa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-emerald-600" />}
                <span>Test Meta Cloud API Connection</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Shopify Store Integration */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-900">Shopify Connected Store & Catalog Sync</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Connect your Shopify store using an authenticated Admin API Access Token (<code className="font-mono text-[10px]">shpat_...</code>).
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                {creds.hasShopifyAccessToken ? "Connected" : "Custom App"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700">Shopify Store Domain</label>
                  <span className="text-[10px] text-zinc-400">Custom domain or myshopify.com</span>
                </div>
                <Input
                  value={creds.shopifyShopDomain || ""}
                  onChange={(e) => setCreds({ ...creds, shopifyShopDomain: e.target.value })}
                  placeholder="rohanm.in or your-brand.myshopify.com"
                  className="bg-white border-zinc-200 text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-400">Your custom domain (e.g. rohanm.in) or myshopify.com subdomain</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700">Admin API Access Token</label>
                  <span className="text-[10px] text-zinc-400 font-mono">Starts with shpat_</span>
                </div>
                <div className="relative">
                  <Input
                    type={showShopifyToken ? "text" : "password"}
                    value={creds.shopifyAccessToken || ""}
                    onChange={(e) => setCreds({ ...creds, shopifyAccessToken: e.target.value })}
                    placeholder={creds.hasShopifyAccessToken ? "shpat_•••••••• (Saved in DB)" : "shpat_xxxxxxxxxxxxxxxxxxxxxxxx"}
                    className="bg-white border-zinc-200 text-xs font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowShopifyToken(!showShopifyToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showShopifyToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">Requires <code className="bg-zinc-100 px-1 rounded text-[10px]">read_products</code> and <code className="bg-zinc-100 px-1 rounded text-[10px]">read_inventory</code></p>
              </div>
            </div>

            {shopifyTestResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${shopifyTestResult.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                {shopifyTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{shopifyTestResult.message || shopifyTestResult.error}</span>
              </div>
            )}

            {shopifySyncResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${shopifySyncResult.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                {shopifySyncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{shopifySyncResult.message || shopifySyncResult.error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestShopify}
                disabled={testingShopify}
                className="h-8 text-xs gap-1.5"
              >
                {testingShopify ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                <span>Test Shopify Connection</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSyncShopify}
                disabled={syncingShopify}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              >
                {syncingShopify ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Sync Catalog Now</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="h-9 px-6 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Saving All Credentials...</span>
              </>
            ) : (
              <span>Save Store Rules & Credentials</span>
            )}
          </Button>
          {saved && (
            <Badge variant="outline" className="gap-1 text-xs text-zinc-700 font-medium bg-zinc-100 px-3 py-1.5 border-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Settings & credentials saved to database!
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}

