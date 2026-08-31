'use client'

import React from 'react'
import {
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  Layers,
  Zap,
  ShieldCheck,
} from 'lucide-react'

const PRIMITIVES = [
  {
    primitive: '1. Structured Machine Catalogs',
    humanStore: 'Unstructured HTML, messy DOM selectors, buried attributes in image graphics.',
    agenticLayer: 'Machine-readable JSON schema with real-time variants, tags, and stock counts.',
    icon: Database,
  },
  {
    primitive: '2. Zero-Trust Spending Mandates',
    humanStore: 'Full credit card credentials or unrestricted bank account access handed over.',
    agenticLayer: 'Cryptographically signed tokens with hard budget caps, category constraints, and single-use nonces.',
    icon: ShieldCheck,
  },
  {
    primitive: '3. Autonomous A2A Negotiation',
    humanStore: 'Static fixed prices. Shoppers walk away over ₹150 price friction.',
    agenticLayer: 'Dynamic A2A multi-turn counter-bidding bounded by merchant margin floors.',
    icon: Layers,
  },
  {
    primitive: '4. Atomic Inventory Reservation',
    humanStore: 'No reservation primitive. Items sell out while the agent parses checkout.',
    agenticLayer: '120s Redis concurrency hold (SET NX EX 120) with automatic catalog release if unpaid.',
    icon: Lock,
  },
  {
    primitive: '5. x402 V2 Protocol & Honest Fallback',
    humanStore: '5-step manual browser flow (OTP, redirects, CAPTCHA, manual app switches).',
    agenticLayer: 'x402 V2 challenge & response with ZapAI Facilitator, settling via Razorpay + Human Link Fallback.',
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
            ZapAI gives every online storefront the machine-readable primitives required for autonomous commerce.
          </p>
        </div>

        {/* 5 Primitives Matrix */}
        <div className="space-y-4">
          {PRIMITIVES.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 sm:p-6 rounded-3xl bg-surface-50 border border-surface-200 hover:border-surface-300 transition-all"
              >
                {/* Primitive Title */}
                <div className="lg:col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-surface-200 flex items-center justify-center shrink-0 shadow-sm text-brand-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-900 font-sans">{item.primitive}</h3>
                    <span className="text-[11px] text-surface-500 font-mono">Autonomous Commerce Layer</span>
                  </div>
                </div>

                {/* Legacy Web vs ZapAI */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Legacy Store */}
                  <div className="p-3.5 rounded-2xl bg-white border border-rose-100 flex items-start gap-2.5 text-xs text-surface-600">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-700 block text-[11px] uppercase tracking-wider">
                        Legacy Web:
                      </span>
                      {item.humanStore}
                    </div>
                  </div>

                  {/* ZapAI Layer */}
                  <div className="p-3.5 rounded-2xl bg-brand-50/50 border border-brand-200 flex items-start gap-2.5 text-xs text-surface-800">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-brand-700 block text-[11px] uppercase tracking-wider">
                        ZapAI Primitive:
                      </span>
                      {item.agenticLayer}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
