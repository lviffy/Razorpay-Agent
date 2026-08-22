'use client'

import React from 'react'
import {
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  Layers,
  Zap,
} from 'lucide-react'

const PRIMITIVES = [
  {
    primitive: '1. Structured Product Data',
    humanStore: 'Unstructured HTML, messy DOM selectors, buried attributes in image graphics.',
    agenticLayer: 'Machine-readable JSON schema with real-time variants, tags, and stock counts.',
    icon: Database,
  },
  {
    primitive: '2. Real-Time Live Inventory',
    humanStore: 'Periodic cache updates (hours stale). High risk of flash-sale double-selling.',
    agenticLayer: 'Atomic Redis state machine (AVAILABLE → RESERVED → PAYMENT_PENDING → PAID).',
    icon: Lock,
  },
  {
    primitive: '3. Autonomous Price Negotiation',
    humanStore: 'Static fixed prices. Shoppers walk away over ₹150 price friction.',
    agenticLayer: 'Dynamic A2A multi-turn counter-bidding bounded by merchant margin floors.',
    icon: Layers,
  },
  {
    primitive: '4. Atomic Inventory Reservation',
    humanStore: 'No reservation primitive. Items sell out while the agent parses checkout.',
    agenticLayer: '120s concurrency hold with automatic catalog release if unpaid.',
    icon: Lock,
  },
  {
    primitive: '5. Programmable Payment Rails',
    humanStore: '5-step manual browser flow (OTP, redirects, CAPTCHA, manual app switches).',
    agenticLayer: 'x402 protocol handshake + 1-Tap Razorpay UPI links with instant INR settlement.',
    icon: Zap,
  },
]

export default function ComparisonSection() {
  return (
    <section
      id="why-agentic"
      className="py-20 sm:py-28 bg-white text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
            Traditional Stores Are Built for Humans. <br />
            <span className="text-brand-600">AI Agents Need New Primitives.</span>
          </h2>
          <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
            Shopping agents cannot click buttons, solve CAPTCHAs, or wait for static email recovery.
            AgentBridge provides the 5 machine-native primitives required for autonomous commerce.
          </p>
        </div>

        {/* 5-Primitive Comparison Table */}
        <div className="rounded-3xl overflow-hidden border border-black/[0.08] bg-white shadow-2xs">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 bg-surface-100/80 border-b border-black/[0.08] text-xs font-mono font-bold uppercase text-surface-700">
            <div className="col-span-4 p-4 sm:p-5">Required Commerce Primitive</div>
            <div className="col-span-4 p-4 sm:p-5 text-surface-600 bg-surface-100/50 flex items-center gap-2 border-l border-black/[0.06]">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Traditional Web Storefronts</span>
            </div>
            <div className="col-span-4 p-4 sm:p-5 text-brand-700 bg-brand-50/40 flex items-center gap-2 border-l border-black/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>AgentBridge Layer</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-black/[0.06]">
            {PRIMITIVES.map((row, idx) => {
              const IconComponent = row.icon
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 text-xs sm:text-sm items-stretch hover:bg-surface-50/50 transition-colors"
                >
                  {/* Feature Title */}
                  <div className="md:col-span-4 p-4 sm:p-5 space-y-1 flex flex-col justify-center bg-surface-50/30 md:bg-transparent">
                    <span className="font-bold text-surface-900 font-sans text-sm sm:text-base flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-brand-600 shrink-0" />
                      {row.primitive}
                    </span>
                  </div>

                  {/* Traditional Side */}
                  <div className="md:col-span-4 p-4 sm:p-5 text-surface-600 border-t md:border-t-0 md:border-l border-black/[0.06] leading-relaxed font-sans flex flex-col md:flex-row md:items-center">
                    <span className="md:hidden text-[10px] font-mono font-bold text-surface-400 uppercase tracking-wider mb-1">
                      Traditional Web:
                    </span>
                    <span>{row.humanStore}</span>
                  </div>

                  {/* AgentBridge Side */}
                  <div className="md:col-span-4 p-4 sm:p-5 text-surface-900 font-medium bg-brand-50/20 border-t md:border-t-0 md:border-l border-black/[0.06] leading-relaxed font-sans flex flex-col md:flex-row md:items-start gap-1 md:gap-2.5">
                    <span className="md:hidden text-[10px] font-mono font-bold text-brand-600 uppercase tracking-wider mb-1">
                      AgentBridge:
                    </span>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{row.agenticLayer}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
