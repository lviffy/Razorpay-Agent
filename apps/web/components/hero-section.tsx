'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  RefreshCw,
  ChevronRight,
  Store,
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Send,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth-context'

interface Scenario {
  id: string
  label: string
  buyerPrompt: string
  sellerAgentResponse: string
  agreedPrice: number
  listPrice: number
  floorPrice: number
  sweetener: string
  lockTimer: string
  razorpayOrderId: string
  shopifyOrder: string
  upiApps: string[]
}

const scenarios: Scenario[] = [
  {
    id: 'a2a-negotiate',
    label: 'Multi-Store Negotiation',
    buyerPrompt: 'Find Nike Pegasus 40 UK 9 under ₹4,000. Negotiate best deal and reserve.',
    sellerAgentResponse: 'I can’t do ₹3,700, but I’ve reserved 1 unit of Nike Pegasus 40 (UK 9) for ₹3,799 with Free Express Shipping. Deal?',
    agreedPrice: 3799,
    listPrice: 4299,
    floorPrice: 3600,
    sweetener: 'Free Express Delivery (₹250 value)',
    lockTimer: '118s (Unit Reserved)',
    razorpayOrderId: 'order_Rzp_9812401',
    shopifyOrder: 'ORD-1042',
    upiApps: ['Google Pay', 'PhonePe', 'Paytm', 'CRED'],
  },
  {
    id: 'margin-guard',
    label: 'Margin Floor Guardrail',
    buyerPrompt: 'Can you sell Garmin Forerunner 265 for ₹39,000? Ready to pay right now.',
    sellerAgentResponse: 'Offer ₹39,000 is below our hard floor. Best I can lock right now is ₹44,200 with 1-Year Extended Pro Warranty.',
    agreedPrice: 44200,
    listPrice: 46990,
    floorPrice: 43500,
    sweetener: '1-Year Pro Warranty (₹1,500 value)',
    lockTimer: '120s (Unit Reserved)',
    razorpayOrderId: 'order_Rzp_4412091',
    shopifyOrder: 'ORD-1043',
    upiApps: ['CRED', 'Google Pay', 'HDFC UPI', 'PhonePe'],
  },
  {
    id: 'stock-lock',
    label: '120s Inventory Lock',
    buyerPrompt: 'Reserve 1 unit RunFast Hydro Vest 5L before stock runs out.',
    sellerAgentResponse: 'Only 2 units left! I’ve locked 1 unit for 120 seconds at ₹2,599 with bundled Dual Flasks. Instant checkout below:',
    agreedPrice: 2599,
    listPrice: 3299,
    floorPrice: 2200,
    sweetener: 'Dual 500ml Flasks Included',
    lockTimer: '115s (1 Unit Locked)',
    razorpayOrderId: 'order_Rzp_7721849',
    shopifyOrder: 'ORD-1044',
    upiApps: ['PhonePe', 'Google Pay', 'Paytm', 'BHIM'],
  },
]

export default function HeroSection() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paid, setPaid] = useState<boolean>(false)

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
    }, 800)
  }

  const { isAuthenticated } = useAuth()

  return (
    <section
      id="hero"
      className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 bg-[#fbfbfd] border-b border-black/[0.06] overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Column: Positioning & Copy */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight text-surface-900 leading-[1.08] [text-wrap:balance]">
                AI agents that{' '}
                <span className="text-brand-600">
                  negotiate and buy
                </span>{' '}
                on WhatsApp.
              </h1>

              <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-xl font-normal [text-wrap:pretty]">
                Buyer agents discover products, negotiate with seller agents within merchant-defined rules, and complete real INR payments through Razorpay.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button className="group bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-full px-8 h-12 text-sm sm:text-base gap-2 cursor-pointer shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <span>{isAuthenticated ? "Open Dashboard" : "Start Free"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <a
                href="#negotiation"
                className="inline-flex items-center gap-1.5 px-6 h-12 rounded-full bg-white border border-black/[0.12] text-surface-800 hover:text-surface-950 hover:bg-surface-50 text-sm font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span>See How Agents Negotiate</span>
                <ChevronRight className="w-4 h-4 text-surface-500" />
              </a>
            </div>

            {/* Four Architecture Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-black/[0.08]">
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                  Dual-AI
                </p>
                <p className="text-xs text-surface-600 font-medium">
                  Buyer ↔ Seller Agent
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-tight tabular-nums">
                  &lt;45ms
                </p>
                <p className="text-xs text-surface-600 font-medium">
                  Negotiation Latency
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight tabular-nums">
                  100%
                </p>
                <p className="text-xs text-surface-600 font-medium">
                  Margin Guardrail
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                  x402→INR
                </p>
                <p className="text-xs text-surface-600 font-medium">
                  Razorpay Rails
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity WhatsApp Phone Simulator */}
          <div className="lg:col-span-6 flex flex-col w-full max-w-full">
            {/* Scenario Segmented Switcher */}
            <div className="w-full mb-3">
              <div className="grid grid-cols-3 gap-1 p-1 bg-surface-100/90 rounded-2xl border border-black/[0.06]">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleScenarioChange(s)}
                    className={cn(
                      'py-2 px-2 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer truncate',
                      activeScenario.id === s.id
                        ? 'bg-white text-surface-950 font-bold shadow-xs'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-white/60'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Realistic WhatsApp Phone Frame */}
            <div className="relative rounded-[2rem] bg-white border border-black/[0.12] overflow-hidden shadow-md transition-all duration-300">
              {/* WhatsApp App Top Header Bar */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <ChevronLeft className="w-5 h-5 text-white/90 -ml-1 cursor-pointer" />
                  
                  {/* Store Avatar with Online Dot */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#128c7e] border border-white/20 flex items-center justify-center font-bold text-white text-xs">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#075e54]" />
                  </div>

                  {/* Merchant Name & Verified Badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate">RunFast Sports</h3>
                      <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] flex items-center justify-center text-[9px] text-white font-bold shrink-0" title="Official Verified WhatsApp Business">
                        ✓
                      </span>
                    </div>
                    <p className="text-[10.5px] text-emerald-100 flex items-center gap-1 font-medium truncate">
                      Official Business • Online
                    </p>
                  </div>
                </div>

                {/* Right Call & Overflow Icons */}
                <div className="flex items-center gap-3 text-white/90">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Chat Canvas (Realistic WhatsApp Wallpaper Background) */}
              <div className="p-3.5 sm:p-4 space-y-3 bg-[#efeae2]/80 min-h-[380px] sm:min-h-[400px] flex flex-col justify-between dot-grid">
                <div className="space-y-3">
                  {/* Encryption & Date Pill */}
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-surface-600 bg-white/90 px-3 py-1 rounded-full shadow-2xs inline-flex items-center gap-1 border border-black/[0.04]">
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      Messages are end-to-end encrypted
                    </span>
                  </div>

                  {/* 1. Incoming Buyer Message Bubble (Left / White) */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-xs p-3 border border-black/[0.06] shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-surface-500">
                          Buyer (+91 98765 43210)
                        </span>
                        <span className="text-[9.5px] text-surface-400 font-mono">10:42 AM</span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-surface-900 leading-relaxed font-normal">
                        {activeScenario.buyerPrompt}
                      </p>
                    </div>
                  </div>

                  {/* 2. System HUD: AI Margin Guardrail Evaluation Pill */}
                  <div className="px-3 py-2 rounded-xl bg-blue-50/90 border border-blue-200/90 text-[11px] space-y-0.5 shadow-2xs">
                    <div className="flex items-center justify-between text-brand-900 font-bold text-[10.5px]">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        AI Margin Guardrail Evaluated
                      </span>
                      <span className="text-emerald-700 font-bold font-mono">Floor ₹{activeScenario.floorPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-brand-950 text-[10.5px] leading-snug font-sans">
                      Offer analyzed against merchant floor. Counter-offer generated within 8% discount cap.
                    </p>
                  </div>

                  {/* 3. Outgoing Seller Agent Message Bubble (Right / WhatsApp Green) */}
                  <div className="flex justify-end">
                    <div className="max-w-[92%] bg-[#d9fdd3] rounded-2xl rounded-tr-xs p-3.5 border border-[#c4eec0] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-[#008069] flex items-center gap-1">
                          <Bot className="w-3 h-3" /> ZapAI Seller
                        </span>
                        <div className="flex items-center gap-1 text-[9.5px] text-surface-500 font-mono">
                          <span>10:42 AM</span>
                          <span className="text-[#53bdeb] font-bold">✓✓</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-[13px] text-surface-900 leading-relaxed font-medium">
                        {activeScenario.sellerAgentResponse}
                      </p>

                      {/* Razorpay 1-Tap Checkout Card Embedded inside WhatsApp */}
                      <div className="p-3.5 rounded-xl bg-white text-surface-900 space-y-3 border border-black/[0.08] shadow-2xs">
                        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#0052ff] flex items-center justify-center font-bold text-xs text-white">
                              R
                            </div>
                            <div>
                              <span className="font-bold text-xs text-surface-900 block">Razorpay Checkout</span>
                              <span className="text-[9.5px] text-surface-500 font-mono">rzp.io/i/plink_zapai</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            1-TAP UPI
                          </span>
                        </div>

                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 xs:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-surface-700 text-[11px] font-medium truncate">Nike Air Zoom Pegasus 40</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <p className="font-mono text-lg font-extrabold text-surface-900">
                                ₹{activeScenario.agreedPrice.toLocaleString('en-IN')}
                              </p>
                              <span className="text-xs font-normal text-surface-400 line-through">
                                ₹{activeScenario.listPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-mono font-medium block truncate">
                              {activeScenario.sweetener}
                            </span>
                          </div>

                          <button
                            onClick={handleSimulatePayment}
                            disabled={isProcessing}
                            className={cn(
                              'w-full xs:w-auto px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0 shadow-xs',
                              paid
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
                                <span>Paid ₹{activeScenario.agreedPrice.toLocaleString('en-IN')}</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Pay via UPI</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Supported Apps Bar */}
                        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[10px] font-mono text-surface-500">
                          <span>Supported UPI:</span>
                          <span className="text-brand-700 font-medium">
                            {activeScenario.upiApps.join(' • ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom WhatsApp Input Bar Mockup */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-full px-3.5 py-2 flex items-center gap-2 border border-black/[0.08] shadow-2xs">
                    <Smile className="w-4 h-4 text-surface-400" />
                    <span className="text-xs text-surface-400 flex-1 select-none">Type a message...</span>
                    <Paperclip className="w-4 h-4 text-surface-400 rotate-45" />
                    <Camera className="w-4 h-4 text-surface-400" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Bottom Webhook Settlement Telemetry Bar */}
              <div className="bg-[#f0f2f5] px-4 py-2.5 border-t border-black/[0.08] flex items-center justify-between text-[11px] font-mono text-surface-600">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {paid ? `Shopify Order #${activeScenario.shopifyOrder} Dispatched` : 'Webhook Ready (HMAC SHA-256)'}
                </span>
                <span className="text-surface-500 font-medium">T+0 Bank Settlement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}