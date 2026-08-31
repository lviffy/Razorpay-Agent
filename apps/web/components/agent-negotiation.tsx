'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  RefreshCw,
  FileCode2,
  Layers,
  Check,
  ArrowRight,
  User,
  ShoppingBag,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogueItem {
  id: number
  speaker: 'user' | 'buyer' | 'seller'
  label: string
  avatarText: string
  avatarBg: string
  avatarColor: string
  content: string
  perk?: string
  price?: string
  statusBadge?: string
}

const dialogueSteps: DialogueItem[] = [
  {
    id: 1,
    speaker: 'user',
    label: 'Consumer (WhatsApp)',
    avatarText: 'U',
    avatarBg: 'bg-surface-800 text-white',
    avatarColor: 'text-surface-900',
    content: 'Find Nike Pegasus 40 (UK 9) under ₹4,000. Negotiate best deal and lock it.',
  },
  {
    id: 2,
    speaker: 'buyer',
    label: 'Buyer Agent',
    avatarText: 'BA',
    avatarBg: 'bg-brand-600 text-white',
    avatarColor: 'text-brand-600',
    content: 'Scanning verified catalogs in parallel: RunFast Sports (₹3,999) vs SpeedGear (₹4,199). Opening negotiation with Store A...',
    statusBadge: 'Parallel Discovery',
  },
  {
    id: 3,
    speaker: 'buyer',
    label: 'Buyer Agent → Seller Agent',
    avatarText: 'BA',
    avatarBg: 'bg-brand-600 text-white',
    avatarColor: 'text-brand-600',
    content: '“We have a verified buyer ready to transact at ₹3,700 for 1 unit of UK 9. Can you match?”',
    price: 'Opening Bid: ₹3,700',
  },
  {
    id: 4,
    speaker: 'seller',
    label: 'Seller Agent (RunFast Sports)',
    avatarText: 'SA',
    avatarBg: 'bg-[#0f172a] text-white',
    avatarColor: 'text-emerald-700',
    content: '“Hard margin floor is ₹3,600. Counter at ₹3,700 is below target markup. Best we can offer is ₹3,799 with Free Express Delivery.”',
    perk: 'Free Express Delivery (₹250 value)',
    price: 'Counter: ₹3,799',
  },
  {
    id: 5,
    speaker: 'buyer',
    label: 'Buyer Agent',
    avatarText: 'BA',
    avatarBg: 'bg-brand-600 text-white',
    avatarColor: 'text-brand-600',
    content: '“₹3,799 is within consumer spending mandate. Deal accepted. Requesting x402 payment challenge.”',
    statusBadge: 'Deal Accepted',
  },
]

const executionPipeline = [
  {
    id: 1,
    title: '1. Inventory Reserved',
    badge: '120s TTL Lock',
    desc: '1 unit of NK-PEG-40 locked in Redis + Postgres to prevent race conditions.',
    icon: Lock,
    accent: 'text-amber-600 bg-amber-50 border-amber-200/80',
  },
  {
    id: 2,
    title: '2. x402 V2 Challenge',
    badge: 'PAYMENT-REQUIRED',
    desc: 'Seller Agent issues x402 V2 challenge (network: zapai-inr, 3,799.00 INR).',
    icon: FileCode2,
    accent: 'text-brand-600 bg-brand-50 border-brand-200/80',
  },
  {
    id: 3,
    title: '3. Mandate Signed',
    badge: 'PAYMENT-SIGNATURE',
    desc: 'Buyer Agent verifies spending budget and signs PAYMENT-SIGNATURE.',
    icon: ShieldCheck,
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
  },
  {
    id: 4,
    title: '4. ZapAI Facilitator & Settle',
    badge: 'Zero-Trust Check',
    desc: 'Facilitator validates signature & nonce, then routes to Razorpay rail.',
    icon: Zap,
    accent: 'text-blue-600 bg-blue-50 border-blue-200/80',
  },
  {
    id: 5,
    title: '5. Webhook & Ledger Logged',
    badge: 'SHA-256 Chained',
    desc: 'Stock state committed to PAID. Event immutably hash-chained in Neon DB.',
    icon: CheckCircle2,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
  },
]

export default function AgentNegotiationSection() {
  const [activeStep, setActiveStep] = useState<number>(5)
  const [selectedStore, setSelectedStore] = useState<'storeA' | 'storeB'>('storeA')
  const [isReplaying, setIsReplaying] = useState<boolean>(false)

  const handleReplay = () => {
    setIsReplaying(true)
    setActiveStep(1)
    let step = 1
    const interval = setInterval(() => {
      step += 1
      if (step <= 5) {
        setActiveStep(step)
      } else {
        clearInterval(interval)
        setIsReplaying(false)
      }
    }, 850)
  }

  return (
    <section
      id="negotiation"
      className="py-20 sm:py-28 bg-[#fbfbfd] text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              Autonomous Agent-to-Agent <br className="hidden sm:inline" />
              <span className="text-brand-600">Negotiation in Action.</span>
            </h2>
            <p className="text-base sm:text-lg text-surface-600 leading-relaxed font-normal [text-wrap:pretty]">
              Not a scripted chatbot. Watch how a Buyer Agent discovers products across stores,
              negotiates pricing directly with the Seller Agent, and executes an atomic settlement.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleReplay}
              disabled={isReplaying}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-surface-50 text-xs font-mono font-bold text-surface-800 transition-all cursor-pointer border border-black/[0.12] active:scale-95 shadow-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isReplaying && "animate-spin text-brand-600")} />
              <span>{isReplaying ? "Simulating Negotiation..." : "Replay Live Negotiation"}</span>
            </button>
          </div>
        </div>

        {/* Parallel Store Comparison Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Store A */}
          <div
            onClick={() => setSelectedStore('storeA')}
            className={cn(
              'p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 shadow-xs',
              selectedStore === 'storeA'
                ? 'bg-white border-brand-500/80 ring-2 ring-brand-500/10'
                : 'bg-white/80 border-black/[0.08] hover:border-black/[0.15]'
            )}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                A
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h4 className="font-bold text-sm text-surface-900 truncate">RunFast Sports (BLR)</h4>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    Winner
                  </span>
                </div>
                <p className="text-xs text-surface-500 font-mono mt-0.5 truncate">
                  Listed ₹3,999 • Floor ₹3,600 • In Stock: 14
                </p>
              </div>
            </div>

            <div className="text-left xs:text-right shrink-0 xs:pl-3 w-full xs:w-auto pt-1 xs:pt-0 border-t xs:border-t-0 border-black/[0.05]">
              <span className="text-sm font-mono font-bold text-emerald-700 block">Agreed: ₹3,799</span>
              <span className="text-[11px] text-surface-500 font-medium">+ Free Express Delivery</span>
            </div>
          </div>

          {/* Store B */}
          <div
            onClick={() => setSelectedStore('storeB')}
            className={cn(
              'p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 shadow-2xs',
              selectedStore === 'storeB'
                ? 'bg-white border-brand-500/80 ring-2 ring-brand-500/10'
                : 'bg-white/60 border-black/[0.06] hover:border-black/[0.12]'
            )}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-200 text-surface-600 flex items-center justify-center font-bold text-sm shrink-0">
                B
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h4 className="font-bold text-sm text-surface-700 truncate">SpeedGear (MUM)</h4>
                  <span className="text-[10px] font-mono text-surface-600 bg-surface-100 px-2 py-0.5 rounded">
                    Compared
                  </span>
                </div>
                <p className="text-xs text-surface-500 font-mono mt-0.5 truncate">
                  Listed ₹4,199 • Floor ₹3,900 • In Stock: 3
                </p>
              </div>
            </div>

            <div className="text-left xs:text-right shrink-0 xs:pl-3 w-full xs:w-auto pt-1 xs:pt-0 border-t xs:border-t-0 border-black/[0.05]">
              <span className="text-xs font-mono text-surface-500 block">Counter: ₹3,950</span>
              <span className="text-[11px] text-rose-600 font-medium">Outbid by Store A</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Clear Dialogue Stream (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] flex flex-col justify-between space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-600" />
                <h3 className="font-display font-bold text-sm text-surface-900">
                  Autonomous Negotiation Dialogue
                </h3>
              </div>
              <span className="text-xs text-emerald-700 font-mono font-medium flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live A2A Channel
              </span>
            </div>

            {/* Conversational Stream */}
            <div className="space-y-3.5 flex-1">
              {dialogueSteps.slice(0, activeStep).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'p-4 rounded-2xl border transition-all space-y-2',
                    item.speaker === 'user' && 'bg-surface-50/70 border-black/[0.06]',
                    item.speaker === 'buyer' && 'bg-blue-50/40 border-blue-200/70',
                    item.speaker === 'seller' && 'bg-emerald-50/40 border-emerald-200/70'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md ${item.avatarBg} flex items-center justify-center font-bold text-[9px]`}>
                        {item.avatarText}
                      </span>
                      <span className="font-bold text-xs text-surface-900 font-sans">
                        {item.label}
                      </span>
                    </div>

                    {item.price && (
                      <span className="text-[11px] font-mono font-bold text-surface-900 bg-white border border-black/[0.08] px-2 py-0.5 rounded-md">
                        {item.price}
                      </span>
                    )}

                    {item.statusBadge && (
                      <span className="text-[10px] font-mono text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md font-bold">
                        {item.statusBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13.5px] text-surface-800 font-normal leading-relaxed pl-7">
                    {item.content}
                  </p>

                  {item.perk && (
                    <div className="pl-7">
                      <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{item.perk}</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Bottom Status */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs font-mono text-surface-500">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> A2A Bounded Protocol
              </span>
              <span>Sub-45ms Latency</span>
            </div>
          </div>

          {/* Right Column: Execution State Machine (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] flex flex-col justify-between space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <h3 className="font-display font-bold text-sm text-surface-900">
                  Execution State Machine
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activeStep} / 5 Verified
              </span>
            </div>

            {/* 5-Step Pipeline */}
            <div className="space-y-2.5 flex-1">
              {executionPipeline.map((step) => {
                const IconComponent = step.icon
                const isStepActive = step.id <= activeStep

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3',
                      isStepActive
                        ? 'bg-surface-50/80 border-black/[0.08]'
                        : 'bg-white opacity-40 border-black/[0.04]'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${step.accent}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-surface-900 truncate">
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-mono text-surface-500 bg-white border border-black/[0.06] px-1.5 py-0.2 rounded shrink-0">
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors",
                      isStepActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-surface-100 text-surface-400"
                    )}>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Proof Bar */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs font-mono text-surface-500">
              <span className="text-emerald-700 font-semibold">T+0 Bank Settlement</span>
              <span>Shopify Dispatched</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
