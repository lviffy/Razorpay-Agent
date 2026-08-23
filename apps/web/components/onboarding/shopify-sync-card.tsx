"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ShopifySyncCardProps {
  onSyncComplete: (shopDomain: string) => void;
}

export function ShopifySyncCard({ onSyncComplete }: ShopifySyncCardProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Authenticating with Shopify Admin API",
    "Fetching products & variant metadata",
    "Indexing prices & floor rules",
    "Syncing real-time inventory levels",
    "Deploying AI Seller catalog knowledge",
  ];

  const handleStartSync = () => {
    if (!shopDomain) return;
    setSyncing(true);
    setStepIndex(1);

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            onSyncComplete(shopDomain);
          }, 450);
          return prev;
        }
        return prev + 1;
      });
    }, 550);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900">Connect Shopify Store</h4>
            <p className="text-[11px] text-zinc-500">
              Auto-sync 180+ products, inventory counts, and pricing
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200/60 rounded-full font-medium">
          SHOPIFY APP
        </span>
      </div>

      {!syncing && stepIndex === 0 ? (
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="brand-store.myshopify.com"
              className="bg-white border-zinc-200 text-xs rounded-xl h-10 flex-1 font-mono"
            />
            <Button
              onClick={handleStartSync}
              className="h-10 px-4 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white gap-2 flex-shrink-0"
            >
              <span>Sync Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Quick Test:</span>
            <button
              type="button"
              onClick={() => setShopDomain("runfast-sports.myshopify.com")}
              className="text-[11px] text-brand-600 hover:text-brand-700 font-mono underline underline-offset-2"
            >
              runfast-sports.myshopify.com
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 py-2">
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
                    <Check className="w-3.5 h-3.5" /> Synced
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

