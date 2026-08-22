'use client'

import React from 'react'
import {
  Smartphone,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Zap,
  Database,
  CheckCircle2,
} from 'lucide-react'

const CORE_INTEGRATIONS = [
  {
    name: 'WhatsApp Cloud API',
    category: 'Interaction Layer',
    role: 'Consumer Intent & Mandates',
    desc: 'Official Meta Cloud API intake for consumer requests, multi-turn bargaining, and 1-tap checkout delivery.',
    badge: 'Enterprise BSP',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    iconBg: 'bg-emerald-600 text-white',
    icon: Smartphone,
  },
  {
    name: 'Shopify',
    category: 'Merchant Layer',
    role: 'Catalog & Order Fulfillment',
    desc: 'Structured product schema, real-time variant inventory sync, and direct order fulfillment creation.',
    badge: 'Catalog Engine',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    iconBg: 'bg-[#95BF47] text-white',
    icon: ShoppingBag,
  },
  {
    name: 'Razorpay',
    category: 'Settlement Layer',
    role: 'INR Rails & Instant Payout',
    desc: 'Idempotent Orders API, 1-Tap UPI Optimizer, HMAC-SHA256 webhooks, and instant T+0 INR bank settlement.',
    badge: 'Official Rails',
    accent: 'border-brand-200 bg-brand-50 text-brand-800',
    iconBg: 'bg-[#0052ff] text-white',
    icon: CreditCard,
  },
  {
    name: 'Google Gemini 2.5',
    category: 'Intelligence Layer',
    role: 'Bounded Agent Reasoning',
    desc: 'Sub-45ms natural language comprehension, Hinglish negotiation, and strict margin guardrail tool calling.',
    badge: 'Sub-45ms LLM',
    accent: 'border-purple-200 bg-purple-50 text-purple-800',
    iconBg: 'bg-purple-600 text-white',
    icon: Sparkles,
  },
  {
    name: 'Redis',
    category: 'Concurrency Layer',
    role: '120s Atomic Stock Locks',
    desc: 'In-memory distributed mutex locks for atomic inventory reservations to prevent flash-sale double selling.',
    badge: 'Atomic Mutex',
    accent: 'border-rose-200 bg-rose-50 text-rose-800',
    iconBg: 'bg-rose-600 text-white',
    icon: Zap,
  },
  {
    name: 'PostgreSQL (Neon)',
    category: 'Ledger Layer',
    role: 'State Machine & Audit Trace',
    desc: 'ACID-compliant relational store for margin rules, 5-point transaction linkage, and immutable audit trails.',
    badge: 'State Machine',
    accent: 'border-blue-200 bg-blue-50 text-blue-800',
    iconBg: 'bg-slate-900 text-white',
    icon: Database,
  },
]

export default function IntegrationSection() {
  return (
    <section
      id="integrations"
      className="py-20 sm:py-28 overflow-hidden text-surface-900 bg-[#fbfbfd] border-b border-black/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
            Connected Across Six Core Technologies
          </h2>
          <p className="text-base text-surface-600 leading-relaxed font-normal">
            AgentBridge unifies messaging, inventory, intelligence, and banking rails into a cohesive
            agentic commerce pipeline.
          </p>
        </div>

        {/* 6-Core Technology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_INTEGRATIONS.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-3xl border border-black/[0.08] hover:border-brand-500/40 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.accent}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-surface-900">
                      {item.name}
                    </h3>
                    <span className="text-xs text-brand-600 font-mono font-medium block">
                      {item.role}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-surface-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-surface-500">
                  <span>{item.category}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
