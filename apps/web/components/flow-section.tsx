'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Layers,
  Bot,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Clock,
  Database,
  Code,
  Terminal,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function FlowSection() {
  const [activeCodeTab, setActiveCodeTab] = useState<'guardrail' | 'lock' | 'webhook'>('guardrail')

  return (
    <section
      id="flow-intro"
      className="relative py-20 sm:py-28 overflow-hidden bg-[#080c16] text-white border-y border-white/10"
    >
      {/* Ambient Radial Mesh on Dark Section */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(0,82,255,0.2)_0%,rgba(25,90,220,0.08)_45%,transparent_75%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] blur-2xl -z-10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-[11px] font-mono font-bold text-brand-300 uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Full-Stack Agentic Commerce Architecture</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
              How AgentBridge Executes Autonomous Sales
            </h2>
          </div>

          <p className="text-sm sm:text-base text-gray-300 max-w-md leading-relaxed font-normal">
            A high-performance pipeline connecting WhatsApp Cloud API messaging, Gemini 2.5
            intent reasoning, deterministic margin guardrails, and Razorpay bank settlements.
          </p>
        </div>

        {/* 4-Card Architecture Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Bento 1: Conversational AI Engine (7 cols) */}
          <div className="lg:col-span-7 apple-card-dark rounded-[2rem] p-6 sm:p-8 space-y-5 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
                  STAGE 01 — INTENT RECALL
                </span>
                <span className="text-[10px] font-mono bg-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-500/30 font-bold">
                  &lt;45ms LATENCY
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Multi-Turn WhatsApp Intent &amp; Catalog Discovery
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Processes buyer inquiries in natural English, Hindi, and Hinglish. Discovers catalog
                SKUs, answers sizing questions, recommends cross-sell bundles, and detects purchase
                readiness without scripted trees.
              </p>
            </div>

            {/* Visual Chat Stream Preview */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-gray-300 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-white/10 pb-1.5">
                <span>Buyer (+91 98765 43210): &ldquo;Do you have UK 9 in Pegasus 40?&rdquo;</span>
                <span className="text-emerald-400">INTENT: PRODUCT_SEARCH</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-blue-300">
                <span>AgentBridge: &ldquo;Yes! 14 units available in UK 9 at ₹4,299.&rdquo;</span>
                <span className="text-brand-300 font-bold">100% RECALL</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Deterministic Margin Floor (5 cols) */}
          <div className="lg:col-span-5 apple-card-dark rounded-[2rem] p-6 sm:p-8 space-y-4 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  STAGE 02 — MARGIN MANDATE
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  ZERO HALLUCINATIONS
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Deterministic Floor Rules
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                The LLM never sets prices independently. Every discount is validated by a
                hard-coded mathematical boundary check before any counter-offer is emitted.
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300">Hard SKU Floor: ₹3,500</span>
              <span className="text-white font-bold">Max Discount: 18%</span>
            </div>
          </div>

          {/* Bento 3: 15-Minute Concurrency Lock (5 cols) */}
          <div className="lg:col-span-5 apple-card-dark rounded-[2rem] p-6 sm:p-8 space-y-4 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  STAGE 03 — CONCURRENCY HOLD
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 15m AUTO-RELEASE
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Atomic Inventory Reservation
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                When a payment link is issued, stock is atomically reserved for 15 minutes. If
                unpaid, units auto-return to live catalog without race conditions or double-selling.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300">Status: 1 Unit Locked</span>
              <span className="text-white font-bold">Timer: 14:48 Remaining</span>
            </div>
          </div>

          {/* Bento 4: Interactive Code & Webhook Pipeline (7 cols) */}
          <div className="lg:col-span-7 apple-card-dark rounded-[2rem] p-6 sm:p-8 space-y-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-gray-400 ml-2">
                  agentbridge_pipeline.ts
                </span>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg self-start sm:self-auto">
                <button
                  onClick={() => setActiveCodeTab('guardrail')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer',
                    activeCodeTab === 'guardrail'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Mandate
                </button>
                <button
                  onClick={() => setActiveCodeTab('lock')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer',
                    activeCodeTab === 'lock'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Lock
                </button>
                <button
                  onClick={() => setActiveCodeTab('webhook')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer',
                    activeCodeTab === 'webhook'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Webhook
                </button>
              </div>
            </div>

            <div className="font-mono text-xs leading-relaxed py-1 min-h-[140px] overflow-x-auto">
              {activeCodeTab === 'guardrail' && (
                <div className="space-y-1">
                  <p className="text-gray-500">// 1. Enforce Deterministic Margin Floor</p>
                  <p><span className="text-purple-400">const</span> <span className="text-blue-300">evalDecision</span> = <span className="text-yellow-300">evaluateMandate</span>({'{'}</p>
                  <p className="pl-4"><span className="text-sky-300">buyerOffer</span>: <span className="text-emerald-400">3400</span>,</p>
                  <p className="pl-4"><span className="text-sky-300">skuFloor</span>: <span className="text-blue-200">product.minPrice</span>, <span className="text-gray-500">// ₹3,500</span></p>
                  <p className="pl-4"><span className="text-sky-300">allowSweeteners</span>: <span className="text-amber-400">true</span>,</p>
                  <p>{'});'}</p>
                  <p><span className="text-purple-400">if</span> (evalDecision.<span className="text-sky-300">isBelowFloor</span>) {'{'}</p>
                  <p className="pl-4"><span className="text-purple-400">return</span> <span className="text-yellow-300">generateCounterOffer</span>({'{'}</p>
                  <p className="pl-8"><span className="text-sky-300">price</span>: <span className="text-blue-200">product.minPrice</span> + <span className="text-emerald-400">199</span>, <span className="text-gray-500">// ₹3,699</span></p>
                  <p className="pl-8"><span className="text-sky-300">sweetener</span>: <span className="text-emerald-300">&quot;FREE_EXPRESS_SHIPPING&quot;</span>,</p>
                  <p className="pl-4">{'}'});</p>
                  <p>{'}'}</p>
                </div>
              )}

              {activeCodeTab === 'lock' && (
                <div className="space-y-1">
                  <p className="text-gray-500">// 2. Concurrency Stock Lock (15 Minutes)</p>
                  <p><span className="text-purple-400">const</span> <span className="text-blue-300">lockResult</span> = <span className="text-purple-400">await</span> inventory.<span className="text-yellow-300">lockUnit</span>({'{'}</p>
                  <p className="pl-4"><span className="text-sky-300">sku</span>: <span className="text-emerald-300">&quot;NK-PEG-40&quot;</span>,</p>
                  <p className="pl-4"><span className="text-sky-300">buyerId</span>: <span className="text-emerald-300">&quot;+919876543210&quot;</span>,</p>
                  <p className="pl-4"><span className="text-sky-300">durationMinutes</span>: <span className="text-emerald-400">15</span>,</p>
                  <p>{'});'}</p>
                  <p className="text-gray-500 pt-1">// Auto-releases if webhook not received in 15m</p>
                  <p><span className="text-yellow-300">scheduleAutoRelease</span>(lockResult.<span className="text-sky-300">lockId</span>, <span className="text-emerald-400">15 * 60</span>);</p>
                </div>
              )}

              {activeCodeTab === 'webhook' && (
                <div className="space-y-1">
                  <p className="text-gray-500">// 3. HMAC SHA-256 Webhook Verification</p>
                  <p><span className="text-purple-400">const</span> <span className="text-blue-300">isValid</span> = <span className="text-yellow-300">verifyRazorpaySignature</span>(</p>
                  <p className="pl-4">rawBody, headers[<span className="text-emerald-300">&quot;x-razorpay-signature&quot;</span>], process.env.<span className="text-sky-300">RAZORPAY_WEBHOOK_SECRET</span></p>
                  <p>);</p>
                  <p><span className="text-purple-400">if</span> (isValid &amp;&amp; event === <span className="text-emerald-300">&quot;payment.captured&quot;</span>) {'{'}</p>
                  <p className="pl-4"><span className="text-purple-400">await</span> orders.<span className="text-yellow-300">fulfillAndCommitStock</span>({'{'}</p>
                  <p className="pl-8"><span className="text-sky-300">orderId</span>: payload.<span className="text-sky-300">order_id</span>,</p>
                  <p className="pl-8"><span className="text-sky-300">paymentId</span>: payload.<span className="text-sky-300">id</span>,</p>
                  <p className="pl-4">{'}'});</p>
                  <p>{'}'}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] font-mono text-gray-400">
              <span>Razorpay API v2.9 Compatible</span>
              <span className="text-emerald-400 font-semibold">HMAC SHA-256 Verified</span>
            </div>
          </div>
        </div>

        {/* Action Link */}
        <div className="text-center pt-2">
          <Link href="/onboarding">
            <Button className="apple-button-primary font-bold rounded-full text-xs px-7 h-11 gap-2 cursor-pointer">
              <span>Deploy Your Autonomous Agent Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

