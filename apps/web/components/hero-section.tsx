'use client'

import React, { useState } from 'react'
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
  Check,
  ChevronRight,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Scenario {
  id: string
  label: string
  pillTitle: string
  product: string
  category: string
  listPrice: number
  floorPrice: number
  customerQuery: string
  aiReasoning: string
  aiCounterOffer: string
  offeredPrice: number
  sweetener: string
  lockTimer: string
  settlementStatus: string
  upiApps: string[]
}

const scenarios: Scenario[] = [
  {
    id: 'bargain',
    label: 'Margin Floor',
    pillTitle: 'Margin Floor Guardrail',
    product: 'Nike Air Zoom Pegasus 40 (UK 9)',
    category: 'Footwear • In Stock: 14 units',
    listPrice: 4299,
    floorPrice: 3500,
    customerQuery: 'Hey! Can I get the Pegasus 40 in UK 9 for ₹3,400? Will pay instantly via UPI.',
    aiReasoning: 'Offer ₹3,400 is BELOW hard floor ₹3,500. Margin protection rule triggered: Counter at ₹3,699 with Free Express Shipping.',
    aiCounterOffer: 'I can’t do ₹3,400, but I can lock it right now for ₹3,699 with Free Express Shipping! 🚀 Deal?',
    offeredPrice: 3699,
    sweetener: 'Free Express Shipping (₹250 value)',
    lockTimer: '14:59 (1 Unit Reserved)',
    settlementStatus: 'Settled to HDFC Bank A/C in 11s via Razorpay Rails',
    upiApps: ['GPay', 'PhonePe', 'Paytm', 'CRED'],
  },
  {
    id: 'bundle',
    label: 'Smart Bundling',
    pillTitle: 'Dynamic Upsell Matrix',
    product: 'RunFast Hydro Vest + 2x Flasks',
    category: 'Apparel • Bundle SKU',
    listPrice: 3299,
    floorPrice: 2400,
    customerQuery: 'Does the hydro vest include the 500ml flasks or do I need to buy them separately?',
    aiReasoning: 'Cross-sell intent detected. Applying bundle rule: Vest + 2x Flasks within max 18% bundle discount cap.',
    aiCounterOffer: 'The flasks are usually ₹799 extra, but I can bundle the Pro Vest + 2x 500ml Flasks together for ₹2,599 today! 🔥',
    offeredPrice: 2599,
    sweetener: 'Bundled Dual Flasks (₹799 value)',
    lockTimer: '15:00 (Bundle Reserved)',
    settlementStatus: 'Settled to ICICI Bank A/C in 8s via Razorpay Rails',
    upiApps: ['PhonePe', 'GPay', 'CRED', 'BHIM'],
  },
  {
    id: 'inventory-lock',
    label: 'Atomic Stock Lock',
    pillTitle: '15m Concurrency Hold',
    product: 'Garmin Forerunner 265 Music',
    category: 'Electronics • Low Stock: 2 units',
    listPrice: 46990,
    floorPrice: 43500,
    customerQuery: 'Is the Black/Grey edition in stock? Need 1 unit for weekend marathon.',
    aiReasoning: 'Stock count = 2 units. Temporary 15-minute concurrency lock activated to prevent race conditions.',
    aiCounterOffer: 'Only 2 units remaining! I’ve reserved 1 unit for the next 15 minutes at ₹44,200. Here’s your instant checkout:',
    offeredPrice: 44200,
    sweetener: '15-Min Priority Hold Active',
    lockTimer: '14:42 (1 Unit Locked)',
    settlementStatus: 'Stock committed & settled in 14s via Razorpay Rails',
    upiApps: ['CRED', 'GPay', 'HDFC UPI', 'Netbanking'],
  },
]

export default function HeroSection() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paid, setPaid] = useState<boolean>(false)

  // Reset payment state when scenario changes
  const handleScenarioChange = (s: Scenario) => {
    setActiveScenario(s)
    setPaid(false)
    setIsProcessing(false)
  }

  const handleSimulatePayment = () => {
    if (paid) {
      setPaid(false)
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setPaid(true)
    }, 1000)
  }

  return (
    <section
      id="architecture"
      className="relative min-h-[92vh] flex flex-col justify-center pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden"
    >
      {/* Ambient Lighting & Mesh Grids */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(25,90,220,0.12)_0%,rgba(56,141,250,0.04)_40%,transparent_75%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[30%] right-[-80px] w-[500px] h-[450px] bg-[radial-gradient(circle,rgba(0,82,255,0.06)_0%,transparent_65%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[-80px] w-[450px] h-[350px] bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] blur-2xl -z-10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Value Proposition & High-Contrast Typography (6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08]">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              <span className="text-xs font-mono font-bold text-surface-800 tracking-wide uppercase">
                Autonomous WhatsApp Commerce Middleware
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[3.85rem] font-extrabold tracking-tight text-surface-900 leading-[1.08] [text-wrap:balance]">
              Turn WhatsApp conversations into{' '}
              <span className="text-brand-600">
                instant Razorpay sales.
              </span>
            </h1>

            {/* Sub-copy (Simplified & Punchy) */}
            <p className="text-base sm:text-lg text-surface-700 leading-relaxed max-w-xl font-medium [text-wrap:pretty]">
              AI agents that negotiate, protect margins, and close sales — while you sleep.
            </p>

            {/* Primary Action Button (Single Green CTA) */}
            <div className="pt-1">
              <Link href="/onboarding">
                <Button className="group bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full px-8 h-13 text-sm sm:text-base gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <span>Start Autonomous Selling</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust Metrics Bar with Perfectly Aligned 2-Word Labels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-black/[0.08]">
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight tabular-nums">
                  3.4x
                </p>
                <p className="text-xs sm:text-[13px] text-surface-600 font-medium whitespace-nowrap">
                  Conversion Lift
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-tight tabular-nums">
                  &lt;45ms
                </p>
                <p className="text-xs sm:text-[13px] text-surface-600 font-medium whitespace-nowrap">
                  Response Time
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight tabular-nums">
                  100%
                </p>
                <p className="text-xs sm:text-[13px] text-surface-600 font-medium whitespace-nowrap">
                  Margin Guard
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
                  1-Tap
                </p>
                <p className="text-xs sm:text-[13px] text-surface-600 font-medium whitespace-nowrap">
                  UPI Checkout
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Craft Interactive WhatsApp Device Frame (6 cols) */}
          <div className="lg:col-span-6 flex flex-col w-full max-w-full">
            {/* Scenario Switcher Tabs */}
            <div className="w-full mb-3">
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/95 backdrop-blur-md rounded-full border border-black/[0.08]">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleScenarioChange(s)}
                    className={cn(
                      'py-1.5 sm:py-2 px-1.5 sm:px-2 text-center rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer truncate',
                      activeScenario.id === s.id
                        ? 'bg-brand-600 text-white font-bold shadow-xs'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Realistic High-Fidelity Phone Frame */}
            <div className="relative rounded-[1.75rem] sm:rounded-[2rem] bg-white border border-black/[0.1] overflow-hidden transition-all duration-300 shadow-md w-full">
              {/* WhatsApp App Top Header Bar */}
              <div className="bg-[#0b141a] text-white px-3.5 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#25D366] border-2 border-[#0b141a]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate">RunFast Sports</h3>
                      {/* WhatsApp Verified Green Badge */}
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#25D366] flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shrink-0" title="Official WhatsApp Verified Business">
                        ✓
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[#25D366] flex items-center gap-1 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] shrink-0" />
                      Official Business • Online
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-mono text-gray-400 block uppercase">Stock Lock</span>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {activeScenario.lockTimer}
                  </span>
                </div>
              </div>

              {/* Chat Canvas Body */}
              <div className="p-3 sm:p-5 space-y-3 bg-[#efeae2]/60 min-h-[380px] sm:min-h-[400px] flex flex-col justify-between dot-grid">
                <div className="space-y-3">
                  {/* Timestamp Pill */}
                  <div className="text-center">
                    <span className="text-[9.5px] sm:text-[10px] font-medium text-surface-500 bg-white/85 px-2.5 py-0.5 rounded-full">
                      Today • WhatsApp Encrypted
                    </span>
                  </div>

                  {/* Customer Message Bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-xs p-3.5 border border-black/[0.06] space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono font-bold text-surface-500 uppercase">
                          Buyer (+91 98765 43210)
                        </span>
                        <span className="text-[10px] text-surface-400">10:42 AM</span>
                      </div>
                      <p className="text-xs sm:text-sm text-surface-800 leading-relaxed font-normal">
                        {activeScenario.customerQuery}
                      </p>
                    </div>
                  </div>

                  {/* AI Reasoning Guardrail HUD Banner */}
                  <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200/90 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-brand-800 font-mono font-bold text-[10.5px] uppercase">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        AI Margin Guardrail Evaluated
                      </span>
                      <span className="text-emerald-700 font-bold">Floor ₹{activeScenario.floorPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-brand-950 text-[11px] leading-snug font-sans font-medium">
                      {activeScenario.aiReasoning}
                    </p>
                  </div>

                  {/* AI Seller Counter-Offer & Razorpay Checkout Card */}
                  <div className="flex justify-end">
                    <div className="max-w-[92%] bg-[#d9fdd3] rounded-2xl rounded-tr-xs p-3.5 border border-[#c4eec0] space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono font-bold text-[#008069] uppercase flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AgentBridge AI Seller
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-surface-500">
                          <span>10:42 AM</span>
                          <span className="text-[#53bdeb] font-bold">✓✓</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-surface-900 leading-relaxed font-medium">
                        {activeScenario.aiCounterOffer}
                      </p>

                      {/* Razorpay 1-Tap Checkout Card */}
                      <div className="p-3.5 rounded-xl bg-[#0c2340] text-white space-y-3 border border-blue-900/60">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#0052ff] flex items-center justify-center font-bold text-xs text-white">
                              R
                            </div>
                            <div>
                              <span className="font-bold text-xs text-white block">Razorpay Checkout</span>
                              <span className="text-[9.5px] text-blue-200/80 font-mono">rzp.io/i/plink_agentbridge</span>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            1-TAP UPI
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-300 text-[11px] font-medium truncate">{activeScenario.product}</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <p className="font-mono text-lg font-extrabold text-white">
                                ₹{activeScenario.offeredPrice.toLocaleString('en-IN')}
                              </p>
                              <span className="text-xs font-normal text-gray-400 line-through">
                                ₹{activeScenario.listPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono block truncate">
                              ✓ {activeScenario.sweetener}
                            </span>
                          </div>

                          <button
                            onClick={handleSimulatePayment}
                            disabled={isProcessing}
                            className={cn(
                              'px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0',
                              paid
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-[#0052ff] hover:bg-[#0045d8] text-white'
                            )}
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : paid ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
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

                        {/* UPI Supported Apps Bar */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-400">
                          <span>Supported Apps:</span>
                          <span className="text-blue-300 font-medium">
                            {activeScenario.upiApps.join(' • ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Webhook Settlement Telemetry Bar */}
                <div className="pt-2.5 border-t border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] sm:text-[11px] font-mono bg-white/90 p-2.5 rounded-xl border border-black/[0.06]">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {paid ? 'Webhook Verified (HMAC SHA-256)' : 'Webhook Listener Armed'}
                  </span>
                  <span className="text-surface-600 truncate">{activeScenario.settlementStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}