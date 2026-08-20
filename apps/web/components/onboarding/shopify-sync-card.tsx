"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";

interface ShopifySyncCardProps {
  onSyncComplete: (shopDomain: string) => void;
}

export function ShopifySyncCard({ onSyncComplete }: ShopifySyncCardProps) {
  const [shopDomain, setShopDomain] = useState("runfast-sports.myshopify.com");
  const [syncing, setSyncing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Connecting to Shopify Admin API",
    "Reading catalog & variants",
    "Importing products & prices",
    "Syncing real-time inventory",
    "Building AI Seller catalog index",
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
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <div className="bg-white border border-surface-200 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-surface-100">
        <div>
          <h4 className="text-xs font-semibold text-surface-900">Connect Shopify Store</h4>
          <p className="text-[11px] text-surface-500">
            Import existing products, inventory levels, and variants
          </p>
        </div>
        <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200 rounded">
          OPTIONAL PROVIDER
        </span>
      </div>

      {!syncing && stepIndex === 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-700">Shopify Store Domain</label>
            <Input
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="your-brand.myshopify.com"
            />
          </div>
          <Button onClick={handleStartSync} className="w-full text-xs">
            Connect & Import Catalog (184 Products)
          </Button>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          {steps.map((st, i) => {
            const isDone = stepIndex > i + 1 || stepIndex === steps.length;
            const isCurrent = stepIndex === i + 1;

            return (
              <div
                key={st}
                className="flex items-center justify-between text-xs py-1 border-b border-surface-50 last:border-none"
              >
                <span
                  className={
                    isDone
                      ? "text-surface-900 font-medium"
                      : isCurrent
                      ? "text-brand-600 font-semibold"
                      : "text-surface-400"
                  }
                >
                  {st}
                </span>
                {isDone ? (
                  <span className="flex items-center text-emerald-600 gap-1 text-[11px] font-semibold">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                ) : (
                  <span className="text-surface-300 text-[10px]">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
