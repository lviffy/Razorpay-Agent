'use client'

import React, { useState } from 'react'
import {
  Bot,
  CreditCard,
  ShieldCheck,
  Lock,
  Clock,
  Zap,
  Check,
  ArrowRight,
  Sliders,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FlowSection() {
  return (
    <section
      id="flow-intro"
      className="relative py-20 sm:py-28 overflow-hidden bg-[#070b14] text-white border-y border-white/10"
    >
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_70%)] blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        {/* Clean Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>How It Works</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              How ZapAI Executes Sales
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed font-normal">
            An automated 4-stage pipeline connecting WhatsApp buyer chat, deterministic profit guardrails,
            and instant Razorpay settlement.
          </p>
        </div>

        {/* Symmetrical 2x2 Bento Grid: Monochromatic, Clean, High Contrast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Stage 01: Intent Recall */}
          <div className="bg-white/[0.03] hover:bg-white/[0.05] rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between h-full space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  01 / Intent Recall
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  &lt;45ms Latency
                </span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Multi-Turn WhatsApp Inquiry &amp; Catalog Discovery
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Understands natural language in English, Hindi, and Hinglish. Detects SKU interest and bargaining intent instantly without scripted trees.
              </p>
            </div>

            {/* Clean Visual Preview */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-medium">Buyer WhatsApp</span>
                <p className="text-slate-200 text-xs font-sans">
                  &ldquo;Do you have UK 9 in Pegasus 40? Can I get it for ₹3,400?&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> SKU NK-PEG-40 Detected
                </span>
                <span className="text-slate-400">14 In Stock</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Natural Language Recall</span>
              <span className="text-slate-300">AI Agent Reasoning</span>
            </div>
          </div>

          {/* Stage 02: Margin Floor */}
          <div className="bg-white/[0.03] hover:bg-white/[0.05] rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between h-full space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  02 / Margin Mandate
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  Zero Hallucinations
                </span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Deterministic SKU Margin Protection
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                The AI is constrained by hard-coded mathematical boundaries. If an offer is below your floor, it generates a counter-offer with a sweetener.
              </p>
            </div>

            {/* Clean Pricing Guardrail Strip */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">MSRP</span>
                  <span className="font-bold text-white">₹4,299</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Floor</span>
                  <span className="font-bold text-slate-200">₹3,500</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Counter</span>
                  <span className="font-bold text-emerald-400">₹3,699</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>Rule: Counter + Free Shipping</span>
                <span className="text-emerald-400 font-bold">100% Floor Safe</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Mathematical Guardrail</span>
              <span className="text-slate-300">No Price Leakage</span>
            </div>
          </div>

          {/* Stage 03: Concurrency Hold */}
          <div className="bg-white/[0.03] hover:bg-white/[0.05] rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between h-full space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  03 / Concurrency Hold
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  15m Auto-Release
                </span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Atomic Inventory Reservation
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                When checkout begins, 1 unit is locked for 15 minutes. If unpaid, stock automatically returns to the live catalog to prevent double-selling.
              </p>
            </div>

            {/* Clean Hold Bar */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  1 Unit Reserved (SKU: NK-PEG-40)
                </span>
                <span className="text-slate-300 font-bold">14:48 Remaining</span>
              </div>

              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full w-[85%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>Hold Timer Active</span>
                <span>Auto-Releases if Unpaid</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Atomic Concurrency</span>
              <span className="text-slate-300">Zero Race Conditions</span>
            </div>
          </div>

          {/* Stage 04: Razorpay Rails */}
          <div className="bg-white/[0.03] hover:bg-white/[0.05] rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between h-full space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  04 / Razorpay Settlement
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  HMAC Verified
                </span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                1-Tap UPI Settlement &amp; Auto-Fulfillment
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Generates instant Razorpay payment links for GPay, PhonePe, and Paytm. Cryptographic webhooks confirm settlement and trigger ERP fulfillment.
              </p>
            </div>

            {/* Clean Checkout Link Preview */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="truncate min-w-0 pr-2">
                  <span className="text-slate-400 text-[10px] block uppercase font-sans">Payment Link</span>
                  <span className="text-slate-200 text-xs truncate block">rzp.io/i/plink_pegasus40_3699</span>
                </div>
                <span className="px-2.5 py-1 bg-white text-slate-950 font-bold rounded-lg text-xs shrink-0 font-sans">
                  ₹3,699 UPI
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Webhook 200 OK
                </span>
                <span>Instant Bank Settlement</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Razorpay Official Rails</span>
              <span className="text-slate-300">T+0 Settlement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
