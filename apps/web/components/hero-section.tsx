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
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth-context'

interface Scenario {
  id: string
  label: string
  statusBadge: 'AUTONOMOUS' | 'HUMAN_APPROVAL' | 'FAILED'
  statusBadgeColor: string
  buyerPrompt: string
  sellerAgentResponse: string
  agreedPrice: number
  listPrice: number
  floorPrice: number
  sweetener: string
  lockTimer: string
  x402Header: string
  signatureHeader: string
  razorpayOrderId: string
  shopifyOrder: string
  railType: string
}

const scenarios: Scenario[] = [
  {
    id: 'a2a-autonomous',
    label: 'Autonomous x402 Flow',
    statusBadge: 'AUTONOMOUS',
    statusBadgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    buyerPrompt: 'Find Nike Pegasus 40 UK 9 under ₹4,000. Negotiate deal & settle autonomously.',
    sellerAgentResponse: 'Deal agreed at ₹3,799 with Free Express Shipping! Reserved 1 unit (120s lock). Issued x402 PAYMENT-REQUIRED.',
    agreedPrice: 3799,
    listPrice: 4299,
    floorPrice: 3600,
    sweetener: 'Free Express Delivery (₹250 value)',
    lockTimer: '118s (Redis TTL Lock)',
    x402Header: 'PAYMENT-REQUIRED: { network: "zapai-inr", amount: "379900", payTo: "merchant_runfast" }',
    signatureHeader: 'PAYMENT-SIGNATURE: { mandate: "mnd_881a", sig: "0x8f2a...", nonce: "n_98a7" }',
    razorpayOrderId: 'order_Rzp_9812401',
    shopifyOrder: 'ORD-1042',
    railType: 'ZapAI Facilitator → Autonomous Settlement Rail',
  },
  {
    id: 'human-fallback',
    label: 'Human Fallback Rail',
    statusBadge: 'HUMAN_APPROVAL',
    statusBadgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    buyerPrompt: 'Negotiate Garmin Forerunner 265 and trigger payment link for 1-tap review.',
    sellerAgentResponse: 'Best offer locked at ₹44,200 with 1-Yr Pro Warranty! Generated Razorpay Payment Link for human sign-off.',
    agreedPrice: 44200,
    listPrice: 46990,
    floorPrice: 43500,
    sweetener: '1-Year Pro Warranty (₹1,500 value)',
    lockTimer: '120s (Unit Reserved)',
    x402Header: 'PAYMENT-REQUIRED: { network: "zapai-inr", amount: "4420000", payTo: "merchant_speedgear" }',
    signatureHeader: 'HUMAN-FALLBACK: Razorpay Payment Link generated & sent to buyer on WhatsApp',
    razorpayOrderId: 'order_Rzp_4412091',
    shopifyOrder: 'ORD-1043',
    railType: 'x402 Facilitator → Razorpay Payment Link Fallback',
  },
  {
    id: 'budget-reject',
    label: 'Zero-Trust Budget Block',
    statusBadge: 'FAILED',
    statusBadgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    buyerPrompt: 'Buy Carbon Plate Racer for ₹4,800 (Mandate budget is capped at ₹4,000).',
    sellerAgentResponse: 'Server-side Zero-Trust policy evaluator rejected transaction: amount ₹4,800 exceeds mandate limit ₹4,000.',
    agreedPrice: 4800,
    listPrice: 5200,
    floorPrice: 4600,
    sweetener: 'Transaction Terminated Safely',
    lockTimer: 'Lock Auto-Released (0s)',
    x402Header: 'PAYMENT-REJECTED: EXCEEDS_SPENDING_LIMIT',
    signatureHeader: 'POLICY-CHECK: Deterministic server check failed (Zero-Trust)',
    razorpayOrderId: 'BLOCKED_BY_POLICY',
    shopifyOrder: 'CANCELLED',
    railType: 'Deterministic Policy Engine (Zero LLM Trust)',
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
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-brand-500/10 via-brand-200/20 to-transparent blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Top Announcement Tag */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-brand-200 shadow-sm backdrop-blur-md text-xs font-semibold text-brand-700 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>x402 V2 Protocol • ZapAI Facilitator • Razorpay INR Rails</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface-900 leading-[1.08]">
            AI Agents That <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 bg-clip-text text-transparent">
              Negotiate, Lock & Settle
            </span> <br />
            Autonomously in INR.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-surface-600 max-w-2xl font-normal leading-relaxed">
            ZapAI turns stores into AI-native endpoints. Buyer Agents negotiate with Seller Agents,
            lock stock via Redis atomic holds, sign x402 spending mandates, and settle through Razorpay.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"}>
              <Button
                size="lg"
                className="h-12 px-7 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Launch Store Agent
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#payment-flow">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 rounded-full bg-white hover:bg-surface-50 text-surface-800 border-surface-200 text-sm font-semibold"
              >
                Inspect Protocol Architecture
              </Button>
            </a>
          </div>
        </div>

        {/* Interactive Scenario Tabs */}
        <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border whitespace-nowrap shadow-sm',
                activeScenario.id === sc.id
                  ? 'bg-surface-900 text-white border-surface-900 shadow-md'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  sc.statusBadge === 'AUTONOMOUS'
                    ? 'bg-emerald-400'
                    : sc.statusBadge === 'HUMAN_APPROVAL'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                )}
              />
              {sc.label}
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold border',
                  sc.statusBadgeColor
                )}
              >
                {sc.statusBadge}
              </span>
            </button>
          ))}
        </div>

        {/* Live A2A Simulation Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-xl shadow-surface-200/50">
          {/* Left Column: WhatsApp / Inbound Surface */}
          <div className="lg:col-span-5 flex flex-col bg-surface-50 rounded-2xl border border-surface-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs">
                  WA
                </div>
                <div>
                  <div className="text-xs font-bold text-surface-900">WhatsApp Cloud API</div>
                  <div className="text-[11px] text-surface-500">+91 98765 43210 (Buyer Session)</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                Session Active
              </span>
            </div>

            {/* Chat Bubble Simulation */}
            <div className="space-y-3 text-xs flex-1">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-surface-200 shadow-sm text-surface-800 space-y-1">
                <span className="text-[10px] font-bold text-surface-400 block">CONSUMER INTENT</span>
                <p className="font-medium text-surface-900">{activeScenario.buyerPrompt}</p>
              </div>

              <div className="bg-brand-50/80 p-3.5 rounded-2xl rounded-tr-none border border-brand-200 shadow-sm text-brand-950 space-y-1.5 ml-4">
                <span className="text-[10px] font-bold text-brand-600 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> SELLER AGENT (RunFast Sports)
                </span>
                <p className="leading-relaxed">{activeScenario.sellerAgentResponse}</p>
              </div>
            </div>

            {/* Inventory Hold Alert */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-800">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{activeScenario.lockTimer}</span>
              </div>
              <span className="text-[11px] text-surface-500 font-mono">TTL = 120s</span>
            </div>
          </div>

          {/* Right Column: Machine Protocol Execution & x402 Inspector */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Header / Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <span className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                  x402 V2 Protocol & Facilitator
                </span>
              </div>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold border', activeScenario.statusBadgeColor)}>
                {activeScenario.statusBadge === 'AUTONOMOUS' && '🟢 AUTONOMOUS SETTLEMENT'}
                {activeScenario.statusBadge === 'HUMAN_APPROVAL' && '🟡 HUMAN APPROVAL FALLBACK'}
                {activeScenario.statusBadge === 'FAILED' && '🔴 TERMINATED (ZERO-TRUST)'}
              </span>
            </div>

            {/* Protocol Payload Inspector */}
            <div className="bg-surface-900 text-surface-100 rounded-2xl p-4 font-mono text-[11px] space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center text-surface-400 text-[10px] border-b border-surface-800 pb-1.5">
                <span>MACHINE-TO-MACHINE (M2M) HANDSHAKE</span>
                <span>SCHEME: zapai-inr</span>
              </div>
              <div className="space-y-1 text-emerald-400">
                <span className="text-surface-400 block text-[10px]">1. SELLER CHALLENGE:</span>
                <p className="break-all">{activeScenario.x402Header}</p>
              </div>
              <div className="space-y-1 text-cyan-300">
                <span className="text-surface-400 block text-[10px]">2. BUYER SIGNATURE / FALLBACK:</span>
                <p className="break-all">{activeScenario.signatureHeader}</p>
              </div>
              <div className="space-y-1 text-amber-300">
                <span className="text-surface-400 block text-[10px]">3. FINANCIAL SETTLEMENT RAIL:</span>
                <p>{activeScenario.railType}</p>
              </div>
            </div>

            {/* Financial Summary & Action Bar */}
            <div className="grid grid-cols-3 gap-3 bg-surface-50 p-3.5 rounded-2xl border border-surface-200 text-center">
              <div>
                <div className="text-[10px] text-surface-500 font-semibold uppercase">List Price</div>
                <div className="text-sm font-bold text-surface-400 line-through">₹{activeScenario.listPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-surface-500 font-semibold uppercase">Floor Limit</div>
                <div className="text-sm font-bold text-amber-700">₹{activeScenario.floorPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-brand-700 font-semibold uppercase">Settled Price</div>
                <div className="text-sm font-bold text-brand-600">₹{activeScenario.agreedPrice.toLocaleString()}</div>
              </div>
            </div>

            {/* Live Interactive Button */}
            <div className="pt-1 flex items-center gap-3">
              <Button
                onClick={handleSimulatePayment}
                disabled={isProcessing || activeScenario.statusBadge === 'FAILED'}
                className={cn(
                  'w-full h-11 rounded-xl font-bold text-xs transition-all shadow-md',
                  paid
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : activeScenario.statusBadge === 'HUMAN_APPROVAL'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : activeScenario.statusBadge === 'FAILED'
                    ? 'bg-surface-300 text-surface-500 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                )}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Mandate & Settling...
                  </span>
                ) : paid ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Settled via Razorpay (Order Paid & Committed)
                  </span>
                ) : activeScenario.statusBadge === 'HUMAN_APPROVAL' ? (
                  'Simulate 1-Tap Payment Link Fallback'
                ) : activeScenario.statusBadge === 'FAILED' ? (
                  'Transaction Blocked by Server Zero-Trust Engine'
                ) : (
                  'Execute Autonomous x402 Settlement'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}