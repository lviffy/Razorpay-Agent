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
  Fingerprint,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrimitiveItem {
  id: string
  number: string
  title: string
  category: string
  icon: React.ElementType
  legacy: {
    description: string
  }
  zapai: {
    headline: string
    description?: string
    capabilityTag: string
    flowType?: 'negotiate' | 'inventory' | 'x402' | 'audit' | 'catalog' | 'mandate'
  }
}

const PRIMITIVES: PrimitiveItem[] = [
  {
    id: 'catalog',
    number: '01',
    title: 'Structured Machine Catalogs',
    category: 'Machine Discovery',
    icon: Database,
    legacy: {
      description: 'Unstructured HTML, messy DOM selectors, and attributes buried in visual product pages.',
    },
    zapai: {
      headline: 'Machine-readable product data with variants, pricing, and live inventory.',
      capabilityTag: 'Postgres & Vector Schema • Synchronized Storefront Cache',
      flowType: 'catalog',
    },
  },
  {
    id: 'mandate',
    number: '02',
    title: 'Zero-Trust Spending Mandates',
    category: 'Authorization & Security',
    icon: ShieldCheck,
    legacy: {
      description: 'Full credit card credentials or unrestricted payment access handed over to AI agents.',
    },
    zapai: {
      headline: 'Cryptographically signed spending mandates with hard budget, merchant, and expiry constraints.',
      description: 'Single-use authorization prevents replay attacks.',
      capabilityTag: 'HMAC SHA-256 Nonce Replay Guard • Hard INR Budget Caps',
      flowType: 'mandate',
    },
  },
  {
    id: 'negotiation',
    number: '03',
    title: 'Agent-to-Agent Negotiation',
    category: 'Autonomous Bidding',
    icon: Layers,
    legacy: {
      description: 'Fixed prices with no machine negotiation surface. Shoppers walk away over minor price friction.',
    },
    zapai: {
      headline: 'Buyer and Seller Agents negotiate price within merchant-defined guardrails.',
      capabilityTag: 'Multi-turn Bidding Engine • Automated Margin Floor Protection',
      flowType: 'negotiate',
    },
  },
  {
    id: 'inventory',
    number: '04',
    title: 'Atomic Inventory Reservation',
    category: 'Concurrency Control',
    icon: Lock,
    legacy: {
      description: 'Inventory can disappear while an agent completes checkout, causing race-condition dropouts.',
    },
    zapai: {
      headline: 'Temporary atomic reservations prevent competing agents from claiming the same inventory.',
      capabilityTag: '120s Concurrency Lock • Auto-Release on Payment Expiry',
      flowType: 'inventory',
    },
  },
  {
    id: 'payments',
    number: '05',
    title: 'x402 Machine Payments',
    category: 'Settlement Protocol',
    icon: Zap,
    legacy: {
      description: 'Redirects, CAPTCHAs, OTPs, and multi-step human browser checkout friction.',
    },
    zapai: {
      headline: 'x402 V2 payment challenges with bounded authorization, Razorpay INR integration, and safe human fallback.',
      capabilityTag: 'x402 Machine Protocol • Razorpay 1-Tap UPI / AutoPay Handshake',
      flowType: 'x402',
    },
  },
  {
    id: 'audit',
    number: '06',
    title: 'Verifiable Transaction History',
    category: 'Trust & Cryptographic Audit',
    icon: Fingerprint,
    legacy: {
      description: 'Siloed email receipts and opaque, non-reproducible transaction histories.',
    },
    zapai: {
      headline: 'Hash-chained evidence linking authorization, negotiation, inventory, payment, and order creation.',
      capabilityTag: 'SHA-256 Linked Ledger • 100% Explainable Agent Money Actions',
      flowType: 'audit',
    },
  },
]

export default function ComparisonSection() {
  return (
    <section
      id="why-agentic"
      className="py-12 sm:py-16 bg-[#fafbfc] text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold tracking-wide uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Agentic Commerce Primitives</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-surface-900 leading-[1.15] [text-wrap:balance]">
            Traditional Commerce Was Built for Humans.{' '}
            <span className="text-brand-600 block sm:inline">
              AI Agents Need New Commerce Primitives.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed font-normal max-w-2xl mx-auto [text-wrap:pretty]">
            Today&apos;s stores expose products, payments, and inventory through interfaces designed for people.
            ZapAI turns them into machine-native primitives that AI agents can discover, negotiate, reserve, and transact with.
          </p>
        </div>

        {/* Unified Primitives Matrix Container */}
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          {/* Table Header on Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-5 px-6 py-2.5 bg-surface-50/80 border-b border-black/[0.06] text-[10.5px] font-mono font-bold uppercase tracking-wider text-surface-500">
            <div className="col-span-4">Commerce Primitive</div>
            <div className="col-span-3 text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Legacy Web (Human Store)</span>
            </div>
            <div className="col-span-5 text-brand-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
              <span>ZapAI Primitive (Machine-Native)</span>
            </div>
          </div>

          {/* Primitive Rows */}
          <div className="divide-y divide-black/[0.05]">
            {PRIMITIVES.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="p-4 sm:py-4 sm:px-6 hover:bg-surface-50/40 transition-colors duration-150"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
                    {/* Column 1: Primitive Details */}
                    <div className="lg:col-span-4 space-y-1.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/90 flex items-center justify-center shrink-0 shadow-2xs text-brand-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200/60">
                              {item.number}
                            </span>
                            <span className="text-[10.5px] text-surface-500 font-mono">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="text-[14px] sm:text-[15px] font-bold text-surface-900 font-display mt-0.5 tracking-tight">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <div className="pl-[38px]">
                        <span className="text-[10px] font-mono text-surface-500 bg-surface-100/90 px-2 py-0.5 rounded-md border border-black/[0.04] inline-block">
                          {item.zapai.capabilityTag}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Legacy Web */}
                    <div className="lg:col-span-3 space-y-1">
                      <div className="lg:hidden flex items-center gap-1 text-rose-700 font-bold text-[10px] uppercase tracking-wider font-mono">
                        <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>Legacy Web</span>
                      </div>
                      <p className="text-xs text-surface-600 leading-snug font-normal">
                        {item.legacy.description}
                      </p>
                      <span className="text-[10px] text-rose-600/80 font-medium inline-flex items-center gap-1 pt-0.5">
                        ✕ Human-first friction
                      </span>
                    </div>

                    {/* Column 3: ZapAI Dominant Primitive */}
                    <div className="lg:col-span-5 p-3 rounded-xl bg-brand-50/70 border border-brand-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-brand-800 font-bold text-[10.5px] uppercase tracking-wider font-mono">
                          <CheckCircle2 className="w-3 h-3 text-brand-600 shrink-0" />
                          <span>ZapAI Primitive</span>
                        </div>
                        <span className="text-[9px] font-mono text-brand-700 bg-white/90 px-2 py-0.2 rounded-full border border-brand-200/80 font-semibold shadow-2xs">
                          ✓ Agent-Ready
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-[12.5px] text-surface-900 font-semibold leading-snug">
                          {item.zapai.headline}
                        </p>
                        {item.zapai.description && (
                          <p className="text-[11px] text-surface-600 leading-tight">
                            {item.zapai.description}
                          </p>
                        )}
                      </div>

                      {/* Micro-flow execution visualization */}
                      {item.zapai.flowType === 'negotiate' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[10px] font-mono space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="line-through text-surface-400 font-sans">₹3,999 (List Price)</span>
                            <span className="text-emerald-700 font-bold font-sans">₹3,799 + Free Delivery</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-surface-700 font-sans">
                            <span className="font-semibold text-brand-700 shrink-0">Buyer:</span>
                            <span className="text-surface-600 truncate">&ldquo;Can you do better on UK 9?&rdquo;</span>
                            <ArrowRight className="w-2.5 h-2.5 text-surface-400 shrink-0" />
                            <span className="font-semibold text-emerald-700 shrink-0">Counter Deal</span>
                          </div>
                        </div>
                      )}

                      {item.zapai.flowType === 'inventory' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[10px] font-mono flex items-center justify-between text-surface-700 shadow-2xs">
                          <span className="text-[9.5px] text-surface-500">4 Available</span>
                          <ArrowRight className="w-2.5 h-2.5 text-brand-500" />
                          <span className="text-[9.5px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200/50">
                            1 Locked (120s)
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-brand-500" />
                          <span className="text-[9.5px] text-emerald-700 font-semibold">Zero Race Drops</span>
                        </div>
                      )}

                      {item.zapai.flowType === 'x402' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[10px] font-mono flex items-center justify-between gap-1 text-surface-700 shadow-2xs">
                          <span className="text-surface-600 font-semibold text-[9.5px]">x402 Challenge</span>
                          <span className="text-surface-400">→</span>
                          <span className="text-brand-700 font-bold text-[9.5px]">ZapAI Facilitator</span>
                          <span className="text-surface-400">→</span>
                          <span className="text-emerald-700 font-bold text-[9.5px]">Razorpay INR</span>
                        </div>
                      )}

                      {item.zapai.flowType === 'audit' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[9.5px] font-mono flex items-center justify-between gap-1 text-surface-600 overflow-x-auto shadow-2xs">
                          <span className="px-1 py-0.2 rounded bg-surface-100 text-surface-700 font-semibold">Mandate</span>
                          <span>→</span>
                          <span className="px-1 py-0.2 rounded bg-surface-100 text-surface-700 font-semibold">Deal</span>
                          <span>→</span>
                          <span className="px-1 py-0.2 rounded bg-surface-100 text-surface-700 font-semibold">Lock</span>
                          <span>→</span>
                          <span className="px-1 py-0.2 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200/50">Razorpay</span>
                          <span>→</span>
                          <span className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/50">Order</span>
                        </div>
                      )}

                      {item.zapai.flowType === 'catalog' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[10px] font-mono flex items-center justify-between text-surface-700 shadow-2xs">
                          <span className="text-surface-500 font-sans text-[9.5px]">Shopify Webhook</span>
                          <span className="text-brand-600">⇄</span>
                          <span className="font-semibold text-brand-800 font-mono text-[9.5px]">Agent Schema JSON</span>
                          <span className="text-brand-600">⇄</span>
                          <span className="text-emerald-700 font-semibold font-sans text-[9.5px]">Instant LLM Search</span>
                        </div>
                      )}

                      {item.zapai.flowType === 'mandate' && (
                        <div className="p-2 rounded-lg bg-white/95 border border-brand-200/70 text-[10px] font-mono flex items-center justify-between text-surface-700 shadow-2xs">
                          <span className="text-surface-500 text-[9.5px]">Max ₹5,000 Cap</span>
                          <span className="text-surface-400">•</span>
                          <span className="text-brand-700 font-semibold text-[9.5px]">Merchant Whitelist</span>
                          <span className="text-surface-400">•</span>
                          <span className="text-emerald-700 font-semibold text-[9.5px]">Single-Use Nonce</span>
                        </div>
                      )}
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
