"use client";

import React from "react";
import { OnboardingState } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Store, Package, Zap, Smartphone, CreditCard, CheckCircle2 } from "lucide-react";

interface LiveStorePreviewProps {
  state: OnboardingState;
}

export function LiveStorePreview({ state }: LiveStorePreviewProps) {
  const storeName = state.businessName || "Your Store";
  const providerLabel =
    state.provider === "SHOPIFY"
      ? "Shopify Connected"
      : state.provider === "AGENTBRIDGE"
      ? "Native Catalog"
      : "Not Selected";

  return (
    <div className="bg-white border border-surface-200 rounded-md p-5 flex flex-col h-full space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex items-start justify-between pb-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0C2340] text-white rounded flex items-center justify-center font-bold text-base">
            <Store className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 leading-tight truncate max-w-[180px]">
              {storeName}
            </h3>
            <p className="text-[11px] text-surface-500">{providerLabel}</p>
          </div>
        </div>
        <Badge variant={state.completionPercentage === 100 ? "success" : "brand"}>
          {state.completionPercentage}% READY
        </Badge>
      </div>

      {/* Setup Progress Bar (Flat, solid blue) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-surface-600 font-medium">
          <span>AI Storefront Setup</span>
          <span className="font-mono">{state.completionPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden border border-surface-200">
          <div
            className="h-full bg-[#0C83FD] transition-all duration-300 rounded-full"
            style={{ width: `${state.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Live State Grid */}
      <div className="space-y-3 flex-1">
        <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
          Live Store Parameters
        </p>

        {/* Products Card */}
        <div className="p-3 bg-surface-50 border border-surface-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-surface-600" />
            <div>
              <p className="text-xs font-semibold text-surface-900">Products Catalog</p>
              <p className="text-[11px] text-surface-500">
                {state.productCount > 0
                  ? `${state.productCount} products ready for AI`
                  : "Awaiting catalog input"}
              </p>
            </div>
          </div>
          <span className="text-sm font-bold font-mono text-surface-900">
            {state.productCount}
          </span>
        </div>

        {/* AI Seller Status */}
        <div className="p-3 bg-surface-50 border border-surface-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-surface-600" />
            <div>
              <p className="text-xs font-semibold text-surface-900">AI Seller Agent</p>
              <p className="text-[11px] text-surface-500">
                {state.agentConfigured ? "Negotiation mandate configured" : "Pending setup"}
              </p>
            </div>
          </div>
          <Badge variant={state.agentConfigured ? "success" : "default"}>
            {state.agentConfigured ? "● Configured" : "○ Idle"}
          </Badge>
        </div>

        {/* WhatsApp Channel */}
        <div className="p-3 bg-surface-50 border border-surface-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-surface-600" />
            <div>
              <p className="text-xs font-semibold text-surface-900">WhatsApp Commerce</p>
              <p className="text-[11px] text-surface-500">
                {state.whatsappConnected ? "+91 98765 00000" : "Not connected"}
              </p>
            </div>
          </div>
          <Badge variant={state.whatsappConnected ? "success" : "default"}>
            {state.whatsappConnected ? "● Connected" : "○ Disconnected"}
          </Badge>
        </div>

        {/* Razorpay Payments */}
        <div className="p-3 bg-surface-50 border border-surface-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-surface-600" />
            <div>
              <p className="text-xs font-semibold text-surface-900">Razorpay Payments</p>
              <p className="text-[11px] text-surface-500">
                {state.razorpayConnected ? "Test Mode & Links Active" : "Pending connection"}
              </p>
            </div>
          </div>
          <Badge variant={state.razorpayConnected ? "brand" : "default"}>
            {state.razorpayConnected ? "● Test Mode" : "○ Pending"}
          </Badge>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Real-Time State Sync</span>
        </div>
        <p className="text-[11px] text-blue-800 leading-normal">
          Every setting chosen in conversation updates your store instantly.
        </p>
      </div>
    </div>
  );
}
