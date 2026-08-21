'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Zap,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PromptPreset {
  id: string
  label: string
  offerPrice: number
  text: string
  intent: 'bargain_below' | 'bargain_above' | 'bundle'
}

const PRESET_QUERIES: PromptPreset[] = [
  {
    id: 'below-floor',
    label: 'Lowball Offer (Below Floor)',
    offerPrice: 3200,
    text: 'Hey! Will you take ₹3,200 for this right now? Can pay immediately via GPay.',
    intent: 'bargain_below',
  },
  {
    id: 'near-floor',
    label: 'Reasonable Bargain (Above Floor)',
    offerPrice: 3750,
    text: 'Can you do ₹3,750? Ready to checkout today.',
    intent: 'bargain_above',
  },
  {
    id: 'free-shipping',
    label: 'Sweetener Request',
    offerPrice: 3550,
    text: 'If I pay ₹3,550, can you include free express delivery to Mumbai?',
    intent: 'bargain_below',
  },
]

export default function MarginPlayground() {
  const [listPrice, setListPrice] = useState<number>(4499)
  const [floorPrice, setFloorPrice] = useState<number>(3600)
  const [selectedPreset, setSelectedPreset] = useState<PromptPreset>(PRESET_QUERIES[0])
  const [buyerOffer, setBuyerOffer] = useState<number>(3200)

  const handleSelectPreset = (preset: PromptPreset) => {
    setSelectedPreset(preset)
    setBuyerOffer(preset.offerPrice)
  }

  // Real-time AI computation logic
  const discountFromList = Math.round(((listPrice - buyerOffer) / listPrice) * 100)
  const isBelowFloor = buyerOffer < floorPrice
  const counterPrice = isBelowFloor ? Math.max(floorPrice, Math.round(floorPrice * 1.04)) : buyerOffer
  const profitPreserved = counterPrice - Math.round(floorPrice * 0.85) // Est. COGS 85% of floor

  return (
    <section id="margin-playground" className="py-20 sm:py-28 bg-white border-y border-black/[0.06] relative overflow-hidden">
      {/* Background Architectural Mesh */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(25,90,220,0.06)_0%,rgba(16,185,129,0.03)_50%,transparent_70%)] blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-[11px] font-mono font-bold text-brand-700 uppercase">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Margin Guardrail Simulator</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              Test How the AI Protects Your Margins in Real-Time
            </h2>
          </div>

          <p className="text-sm sm:text-base text-surface-600 max-w-md leading-relaxed font-normal">
            Adjust your SKU catalog pricing and floor limits below. See how AgentBridge
            mathematically evaluates buyer bargaining on WhatsApp without human intervention.
          </p>
        </div>

        {/* The 2-Column Interactive Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Merchant SKU Configuration Sliders (5 cols) */}
          <div className="lg:col-span-5 apple-card-elevated rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-surface-900">
                    Merchant Guardrail Rules
                  </h3>
                  <span className="text-[10.5px] font-mono text-surface-500">
                    SKU: NK-PEG-40 (Active)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                MANDATE ACTIVE
              </span>
            </div>

            {/* Slider 1: Retail List Price */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-surface-700">Retail List Price (MSRP)</span>
                <span className="text-surface-900 font-extrabold text-sm">
                  ₹{listPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="8000"
                step="100"
                value={listPrice}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setListPrice(val)
                  if (val <= floorPrice) setFloorPrice(val - 300)
                }}
                className="custom-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-surface-400">
                <span>₹2,000</span>
                <span>₹8,000</span>
              </div>
            </div>

            {/* Slider 2: Hard Floor Price */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Hard Margin Floor (Never Sell Below)
                </span>
                <span className="text-emerald-700 font-extrabold text-sm">
                  ₹{floorPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max={listPrice - 100}
                step="50"
                value={floorPrice}
                onChange={(e) => setFloorPrice(Number(e.target.value))}
                className="custom-slider custom-slider-emerald"
              />
              <div className="flex justify-between text-[10px] font-mono text-surface-400">
                <span>₹1,500</span>
                <span>Max: ₹{(listPrice - 100).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Presets for Buyer Queries */}
            <div className="space-y-2.5 pt-2 border-t border-black/[0.06]">
              <label className="text-xs font-mono font-bold text-surface-700 block uppercase">
                Simulate Buyer WhatsApp Inquiry
              </label>
              <div className="space-y-2">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer space-y-1',
                      selectedPreset.id === preset.id
                        ? 'bg-brand-50/90 border-brand-300 text-brand-900 shadow-2xs'
                        : 'bg-surface-50 border-black/[0.06] text-surface-700 hover:bg-white hover:border-black/[0.12]'
                    )}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span>{preset.label}</span>
                      <span className={preset.offerPrice < floorPrice ? 'text-amber-600' : 'text-emerald-600'}>
                        Offer: ₹{preset.offerPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-surface-600 line-clamp-1 italic font-sans">
                      &ldquo;{preset.text}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time AI Autonomous Decision & Razorpay Output (7 cols) */}
          <div className="lg:col-span-7 apple-card-dark rounded-[2rem] p-6 sm:p-8 text-white space-y-6 shadow-popover">
            {/* Header Telemetry */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-glow-blue">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    AgentBridge Autonomous Decision Engine
                  </h3>
                  <span className="text-[10.5px] font-mono text-blue-200">
                    Gemini 2.5 Flash • &lt;38ms Latency
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  'text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border',
                  isBelowFloor
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                )}
              >
                {isBelowFloor ? 'HARD FLOOR TRIGGERED' : 'WITHIN MANDATE BOUNDS'}
              </span>
            </div>

            {/* Live Visual Profit Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  Buyer Offer
                </span>
                <p className="font-mono text-base font-extrabold text-white">
                  ₹{buyerOffer.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] font-mono text-gray-400">
                  {discountFromList}% off list
                </span>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 block uppercase">
                  Floor Mandate
                </span>
                <p className="font-mono text-base font-extrabold text-emerald-400">
                  ₹{floorPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] font-mono text-emerald-300">
                  100% Protected
                </span>
              </div>

              <div className="p-3.5 bg-brand-500/10 border border-brand-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-blue-300 block uppercase">
                  AI Final Offer
                </span>
                <p className="font-mono text-base font-extrabold text-brand-300">
                  ₹{counterPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] font-mono text-emerald-400">
                  +₹{profitPreserved} Net Margin
                </span>
              </div>
            </div>

            {/* Generated WhatsApp Output Bubble */}
            <div className="p-4 rounded-2xl bg-[#0b141a] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-brand-300 font-semibold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Generated WhatsApp Response
                </span>
                <span className="text-emerald-400 font-bold">1 Unit Reserved (15m)</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-100 leading-relaxed font-sans">
                {isBelowFloor
                  ? `“I can’t do ₹${buyerOffer.toLocaleString('en-IN')}, but I’ve reserved 1 unit for you at ₹${counterPrice.toLocaleString('en-IN')} with Free Express Shipping! 🚀 Tap below to pay via UPI:”`
                  : `“Deal! I’ve locked the price at ₹${counterPrice.toLocaleString('en-IN')} for the next 15 minutes. Complete your 1-tap checkout here:”`}
              </p>

              {/* Signed Razorpay Link Payload */}
              <div className="p-3 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-blue-200">
                <div className="flex items-center gap-2 truncate">
                  <CreditCard className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="truncate">rzp.io/i/plink_guardrail_{counterPrice}</span>
                </div>
                <span className="bg-[#0052ff] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 self-start sm:self-auto">
                  ₹{counterPrice.toLocaleString('en-IN')} UPI
                </span>
              </div>
            </div>

            {/* CTA inside dark box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-400 font-mono">
                Zero human negotiation delay • Zero discount leakage
              </span>
              <Link href="/onboarding" className="shrink-0">
                <Button className="apple-button-primary rounded-full text-xs font-bold px-5 h-10 gap-1.5 cursor-pointer w-full sm:w-auto">
                  <span>Configure Your SKUs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
