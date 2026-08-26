"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/client";

interface ShopifySyncCardProps {
  onSyncComplete: (shopDomain: string, accessToken: string) => void;
  onBack?: () => void;
}

export function ShopifySyncCard({ onSyncComplete, onBack }: ShopifySyncCardProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedShopName, setVerifiedShopName] = useState<string | null>(null);

  const steps = [
    "Authenticating with Shopify Admin API",
    "Fetching products & variant metadata",
    "Indexing prices & floor rules",
    "Syncing real-time inventory levels",
    "Deploying AI Seller catalog knowledge",
  ];

  const handleStartSync = async () => {
    setErrorMsg(null);

    const cleanDomain = shopDomain.trim();
    const cleanToken = accessToken.trim();

    if (!cleanDomain) {
      setErrorMsg("Please enter your Shopify store domain (e.g., rohanm.in or your-brand.myshopify.com)");
      return;
    }

    if (!cleanToken) {
      setErrorMsg("Please enter your Admin API Access Token (starts with 'shpat_')");
      return;
    }

    setSyncing(true);
    setStepIndex(1);

    try {
      // Step 1: Real test verification against backend Shopify service
      const testRes = await api.shopify.test({
        shopDomain: cleanDomain,
        accessToken: cleanToken,
      });

      if (!testRes.success) {
        throw new Error(testRes.error || "Authentication failed with Shopify Admin API.");
      }

      if (testRes.shop?.name) {
        setVerifiedShopName(testRes.shop.name);
      }

      setStepIndex(2);

      // Step 2 & 3: Run verify-and-sync
      const syncRes = await api.onboarding.syncShopify({
        shopDomain: cleanDomain,
        accessToken: cleanToken,
        maxDiscountPercent: 15,
      });

      if (syncRes.error) {
        throw new Error(syncRes.error);
      }

      setStepIndex(3);
      await new Promise((r) => setTimeout(r, 400));
      setStepIndex(4);
      await new Promise((r) => setTimeout(r, 400));
      setStepIndex(5);
      await new Promise((r) => setTimeout(r, 400));

      onSyncComplete(cleanDomain, cleanToken);
    } catch (err: any) {
      console.error("Shopify sync failed:", err);
      setErrorMsg(err.message || "Failed to authenticate and sync with Shopify. Please check your credentials.");
      setSyncing(false);
      setStepIndex(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Connect Shopify Store</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Authenticated
              </span>
            </h4>
            <p className="text-[11px] text-zinc-500">
              Auto-sync live catalog, variants, and stock via Shopify Admin API
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className="text-zinc-400 hover:text-zinc-700 text-xs flex items-center gap-1 transition-colors"
          title="How to get credentials"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">How to get token</span>
        </button>
      </div>

      {/* Expandable Help Instructions */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-600 space-y-2"
          >
            <div className="flex items-center justify-between font-semibold text-zinc-900 text-[11px]">
              <span>How to generate your Shopify Admin API Token (1 min):</span>
              <span className="text-[10px] text-brand-600 font-mono">Custom App</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 pl-1">
              <li>Open your <strong>Shopify Admin &gt; Settings &gt; Apps and sales channels</strong>.</li>
              <li>Click <strong>Develop apps &gt; Create an app</strong> (e.g. <em>ZapAI AI Seller</em>).</li>
              <li>In <strong>Configuration &gt; Admin API access scopes</strong>, select <code className="bg-zinc-100 px-1 rounded text-[10px]">read_products</code> and <code className="bg-zinc-100 px-1 rounded text-[10px]">read_inventory</code>.</li>
              <li>Click <strong>Install app</strong>, then copy your <strong>Admin API access token</strong> (<code className="bg-zinc-100 px-1 rounded text-[10px]">shpat_...</code>).</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-red-50/90 border border-red-200/80 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Shopify Authentication Failed</p>
            <p className="text-[11px] text-red-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Form or Step Progress */}
      {!syncing && stepIndex === 0 ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-2.5">
            {/* Store Domain Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-700 block">
                  Shopify Store Domain
                </label>
                <span className="text-[10px] text-zinc-400">Custom domain or myshopify.com</span>
              </div>
              <Input
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="rohanm.in or your-brand.myshopify.com"
                className="bg-white border-zinc-200 text-xs rounded-xl h-9 font-mono"
              />
            </div>

            {/* Admin API Access Token Input */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  Admin API Access Token
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Starts with shpat_</span>
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="bg-white border-zinc-200 text-xs rounded-xl h-9 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: Back + Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            {onBack ? (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full sm:w-auto h-9 px-3.5 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-900 border-zinc-200 cursor-pointer"
              >
                ← Back to Options
              </Button>
            ) : <div />}

            <Button
              onClick={handleStartSync}
              className="w-full sm:w-auto h-9 px-5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white gap-2 cursor-pointer shadow-xs"
            >
              <span>Authenticate & Sync Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          {verifiedShopName && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium pb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Connected to <strong>{verifiedShopName}</strong></span>
            </div>
          )}
          {steps.map((st, i) => {
            const isDone = stepIndex > i + 1 || stepIndex === steps.length;
            const isCurrent = stepIndex === i + 1;

            return (
              <div
                key={st}
                className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 last:border-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-mono text-[10px] w-4">{i + 1}.</span>
                  <span
                    className={
                      isDone
                        ? "text-zinc-800 font-medium"
                        : isCurrent
                        ? "text-brand-600 font-semibold"
                        : "text-zinc-400"
                    }
                  >
                    {st}
                  </span>
                </div>
                {isDone ? (
                  <span className="flex items-center text-emerald-600 gap-1 text-[11px] font-semibold">
                    <Check className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                ) : (
                  <span className="text-zinc-300 text-[10px] font-mono">Queued</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
