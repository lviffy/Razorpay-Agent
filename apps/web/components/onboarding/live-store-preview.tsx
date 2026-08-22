"use client";

import React from "react";
import { OnboardingState } from "@/lib/types";
import { Store, Package, Zap, Smartphone, CreditCard, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface LiveStorePreviewProps {
  state: OnboardingState;
  className?: string;
}

export function LiveStorePreview({ state, className }: LiveStorePreviewProps) {
  const storeName = state.businessName || "Your Store";
  const providerLabel =
    state.provider === "SHOPIFY"
      ? "Shopify Sync"
      : state.provider === "ZAPAI" || state.provider === "AGENTBRIDGE"
      ? "ZapAI Native"
      : "Pending Selection";

  const isComplete = state.completionPercentage === 100;

  return (
    <div className={`bg-white/80 backdrop-blur-md border border-zinc-200/80 rounded-2xl p-5 space-y-5 select-none ${className || ""}`}>
      {/* Store Identity & Readiness */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight leading-tight truncate max-w-[160px]">
              {storeName}
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">{providerLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/70">
          <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? "bg-emerald-500 animate-pulse" : "bg-brand-500"}`} />
          <span className="text-[11px] font-mono font-bold text-zinc-800">
            {state.completionPercentage}%
          </span>
        </div>
      </div>

      {/* Setup Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
          <span>AI Readiness Index</span>
          <span className="font-mono text-zinc-700">{state.completionPercentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${state.completionPercentage}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`h-full rounded-full transition-all duration-300 ${
              isComplete ? "bg-emerald-500" : "bg-brand-600"
            }`}
          />
        </div>
      </div>

      {/* Telemetry Parameters - Seamless Rows, No Clunky Boxes */}
      <div className="space-y-1 pt-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1 pb-1">
          Store Primitives
        </p>

        {/* 1. Products */}
        <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-none">Catalog</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {state.productCount > 0
                  ? `${state.productCount} SKU items indexed`
                  : "Awaiting input"}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-800">
            {state.productCount}
          </span>
        </div>

        {/* 2. AI Seller */}
        <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-none">Negotiation Mandate</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {state.agentConfigured ? "Floor & margin locked" : "Pending rules"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            state.agentConfigured
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              : "bg-zinc-100 text-zinc-500"
          }`}>
            {state.agentConfigured ? "● Active" : "○ Idle"}
          </span>
        </div>

        {/* 3. WhatsApp Commerce */}
        <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-none">WhatsApp Channel</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {state.whatsappConnected ? "+91 98765 00000" : "Disconnected"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            state.whatsappConnected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              : "bg-zinc-100 text-zinc-500"
          }`}>
            {state.whatsappConnected ? "● Live" : "○ Pending"}
          </span>
        </div>

        {/* 4. Razorpay */}
        <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-none">Razorpay Settlement</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {state.razorpayConnected ? "Test Mode Verified" : "Pending keys"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            state.razorpayConnected
              ? "bg-brand-50 text-brand-700 border border-brand-200/60"
              : "bg-zinc-100 text-zinc-500"
          }`}>
            {state.razorpayConnected ? "● Test Mode" : "○ Pending"}
          </span>
        </div>
      </div>

      {/* Real-Time Pulse Footer */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-600">Real-Time State Sync</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400">WebSocket / SSE</span>
      </div>
    </div>
  );
}

/**
 * Sleek Top-Bar Status Capsule for Compact Display
 */
export function OnboardingStatusCapsule({ state }: { state: OnboardingState }) {
  const isComplete = state.completionPercentage === 100;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-zinc-200/80 shadow-2xs backdrop-blur-sm text-xs text-zinc-700">
      <span className={`w-2 h-2 rounded-full ${isComplete ? "bg-emerald-500 animate-pulse" : "bg-brand-500"}`} />
      <span className="font-semibold text-zinc-900">{state.businessName || "Store"}</span>
      <span className="text-zinc-300">•</span>
      <span className="font-mono font-medium text-brand-600">{state.completionPercentage}% Ready</span>
    </div>
  );
}

