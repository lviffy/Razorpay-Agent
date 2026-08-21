'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  Zap,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Clock,
  TrendingUp,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Scenario {
  id: string
  label: string
  product: string
  listPrice: number
  floorPrice: number
  customerQuery: string
  aiReasoning: string
  aiCounterOffer: string
  offeredPrice: number
  lockTimer: string
  settlementStatus: string
}

const scenarios: Scenario[] = [
  {
    id: 'bargain',
    label: 'Margin Negotiation',
    product: 'Nike Air Zoom Pegasus 40 (UK 9)',
    listPrice: 4299,
    floorPrice: 3500,
    customerQuery: 'Hey! Can I get the Pegasus 40 in UK 9 for ₹3,400? Will pay instantly via UPI.',
    aiReasoning: 'Offer ₹3,400 is BELOW floor ₹3,500. Proposing hard-floor counter-offer with free express shipping sweetener.',
    aiCounterOffer: 'I can’t do ₹3,400, but I can lock it right now for ₹3,699 with Free Express Shipping! 🚀 Deal?',
    offeredPrice: 3699,
    lockTimer: '14:59 (1 Unit Reserved)',
    settlementStatus: 'Settled to HDFC Bank A/C in 12s via Razorpay',
  },
  {
    id: 'bundle',
    label: 'Smart Bundling',
    product: 'RunFast Pro Vest + Soft Flasks',
    listPrice: 2899,
    floorPrice: 2200,
    customerQuery: 'Does the hydro vest include 500ml soft flasks or are they separate?',
    aiReasoning: 'Cross-sell intent detected. Applying bundle rule: Vest + 2x Flasks within max 15% bundle discount cap.',
    aiCounterOffer: 'They’re usually ₹799 extra, but I can bundle the Vest + 2x 500ml Flasks together for ₹2,499 today! 🔥',
    offeredPrice: 2499,
    lockTimer: '15:00 (Bundle Reserved)',
    settlementStatus: 'Settled to ICICI Bank A/C in 9s via Razorpay',
  },
  {
    id: 'inventory-lock',
    label: 'Atomic Stock Lock',
    product: 'Garmin Forerunner 265 Music',
    listPrice: 46990,
    floorPrice: 43500,
    customerQuery: 'Is the Black/Grey edition in stock? Need 1 unit for weekend marathon.',
    aiReasoning: 'Stock count = 2 units. Temporary 15-minute concurrency lock activated to prevent race conditions.',
    aiCounterOffer: 'Only 2 units remaining! I’ve reserved 1 unit for the next 15 minutes at ₹44,200. Here’s your instant checkout:',
    offeredPrice: 44200,
    lockTimer: '14:48 (1 Unit Locked)',
    settlementStatus: 'Stock committed & settled in 15s via Razorpay',
  },
]

export default function HeroSection() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0])
  const [paid, setPaid] = useState<boolean>(false)

  // Reset payment state when scenario changes
  const handleScenarioChange = (s: Scenario) => {
    setActiveScenario(s)
    setPaid(false)
  }

  return (
    <section
      id="architecture"
      className="relative min-h-[92vh] flex flex-col justify-center pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden"
    >
      {/* Apple Subtle Ambient Lighting Cones */}
      <div
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(25,90,220,0.08)_0%,rgba(120,170,255,0.03)_45%,transparent_75%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(0,82,255,0.035)_0%,transparent_70%)] blur-2xl -z-10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Authoritative Copy & Conversion Actions (6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[3.9rem] font-extrabold tracking-tight text-surface-900 leading-[1.06] [text-wrap:balance]">
              Turn WhatsApp conversations into{' '}
              <span className="text-brand-600">
                instant Razorpay sales.
              </span>
            </h1>

            {/* Sub-copy */}
            <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-xl [text-wrap:pretty]">
              Deploy autonomous AI seller agents that understand buyer queries, negotiate strictly
              within your SKU floor mandates, lock live inventory, and issue instant 1-tap UPI
              checkout links.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link href="/onboarding">
                <Button className="group apple-button-primary font-bold rounded-full px-7 h-12 text-sm gap-2 cursor-pointer">
                  <span>Start Conversational Onboarding</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="apple-button-secondary rounded-full text-sm font-bold px-6 h-12 cursor-pointer"
                >
                  Open Merchant Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-black/[0.08]">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight tabular-nums">3.4x</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">Conversion Lift</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-tight tabular-nums">&lt;45ms</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">Intent Recall</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight tabular-nums">100%</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">Floor Protected</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight tabular-nums">1-Tap</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">UPI Settlement</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live WhatsApp Simulation Card (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            {/* Scenario Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/[0.05] mb-3.5 self-start shadow-2xs">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleScenarioChange(s)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer',
                    activeScenario.id === s.id
                      ? 'bg-white text-brand-600 shadow-2xs border border-black/[0.06]'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-white/60'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* High-Fidelity Phone/Chat Frame with Apple Hardware Feel */}
            <div className="relative rounded-[2rem] apple-card-elevated overflow-hidden transition-all duration-300">
              {/* WhatsApp App Header Bar */}
              <div className="bg-[#0c2340] text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c2340]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">RunFast Sports</h3>
                      <span className="px-1.5 py-0.2 rounded bg-brand-500/30 text-[9px] font-mono text-brand-200 font-semibold uppercase">
                        AI SELLER
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Official WhatsApp Cloud API • Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">Atomic Lock</span>
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {activeScenario.lockTimer}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="p-4 sm:p-5 space-y-3.5 bg-[#f4f6f8]/70 min-h-[380px] flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Customer Message Bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-xs p-3.5 border border-surface-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono font-bold text-surface-400 uppercase">
                          Shopper (WhatsApp)
                        </span>
                        <span className="text-[10px] text-surface-400">10:42 AM</span>
                      </div>
                      <p className="text-xs sm:text-sm text-surface-800 leading-relaxed font-normal">
                        {activeScenario.customerQuery}
                      </p>
                    </div>
                  </div>

                  {/* AI Reasoning Guardrail Banner */}
                  <div className="p-2.5 rounded-xl bg-[#eff6ff] border border-blue-200/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-brand-700 font-mono font-bold text-[10px] uppercase">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        Margin Mandate Guardrail Evaluated
                      </span>
                      <span className="text-emerald-700">Floor ₹{activeScenario.floorPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-brand-900/80 text-[11px] leading-snug font-sans">
                      {activeScenario.aiReasoning}
                    </p>
                  </div>

                  {/* AI Seller Counter-Offer & Razorpay Checkout Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[90%] bg-white rounded-2xl rounded-tr-xs p-3.5 border border-brand-200/80 shadow-subtle space-y-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono font-bold text-brand-600 uppercase flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AgentBridge AI
                        </span>
                        <span className="text-[10px] text-surface-400">10:42 AM</span>
                      </div>

                      <p className="text-xs sm:text-sm text-surface-900 leading-relaxed">
                        {activeScenario.aiCounterOffer}
                      </p>

                      {/* Razorpay 1-Tap Payment Link Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#0c2340] to-[#123663] text-white space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-brand-500 flex items-center justify-center font-bold text-[10px]">
                              R
                            </div>
                            <span className="font-bold text-xs text-white">Razorpay Checkout</span>
                          </div>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                            1-TAP UPI
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="text-gray-300 text-[11px]">{activeScenario.product}</p>
                            <p className="font-mono text-base font-extrabold text-white">
                              ₹{activeScenario.offeredPrice.toLocaleString('en-IN')}{' '}
                              <span className="text-xs font-normal text-gray-400 line-through">
                                ₹{activeScenario.listPrice.toLocaleString('en-IN')}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => setPaid(!paid)}
                            className={cn(
                              'px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1 shadow-xs',
                              paid
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-brand-500 hover:bg-brand-400 text-white active:scale-95'
                            )}
                          >
                            {paid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Paid ₹{activeScenario.offeredPrice.toLocaleString('en-IN')}</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Pay via UPI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Webhook Settlement Telemetry Bar */}
                <div className="pt-2 border-t border-surface-200 flex items-center justify-between text-[11px] font-mono text-surface-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {paid ? 'Webhook Verified (HMAC SHA-256)' : 'Ready for 1-Tap Settlement'}
                  </span>
                  <span className="text-surface-600">{activeScenario.settlementStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}