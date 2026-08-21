'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Zap,
  Lock,
  RefreshCw,
  CheckCircle2,
  Sliders,
  CreditCard,
  MessageSquare,
  Bot,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MarginPlayground() {
  const [listPrice, setListPrice] = useState<number>(4499)
  const [floorPrice, setFloorPrice] = useState<number>(3600)
  const [buyerOffer, setBuyerOffer] = useState<number>(3200)
  const [isSimulatingPayment, setIsSimulatingPayment] = useState<boolean>(false)
  const [hasPaid, setHasPaid] = useState<boolean>(false)

  // Real-time calculation logic
  const discountFromList = Math.max(0, Math.round(((listPrice - buyerOffer) / listPrice) * 100))
  const isBelowFloor = buyerOffer < floorPrice
  // When below floor, AI counters at floor + small safety buffer (₹199) with sweetener
  const counterPrice = isBelowFloor ? Math.min(listPrice, floorPrice + 199) : buyerOffer
  const estimatedCost = Math.round(floorPrice * 0.8) // 80% COGS base
  const netMarginSaved = Math.max(0, counterPrice - estimatedCost)

  const handleQuickOffer = (offer: number) => {
    setBuyerOffer(offer)
    setHasPaid(false)
  }

  const handleSimulatePayment = () => {
    if (hasPaid) {
      setHasPaid(false)
      return
    }
    setIsSimulatingPayment(true)
    setTimeout(() => {
      setIsSimulatingPayment(false)
      setHasPaid(true)
    }, 800)
  }

  return (
    <section
      id="margin-playground"
      className="py-20 sm:py-28 bg-white border-y border-black/[0.06] relative overflow-hidden"
    >
      {/* Background Architectural Glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03)_0%,transparent_70%)] blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12 relative z-10">
        {/* Clean Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 border border-black/[0.06] text-xs font-mono font-medium text-surface-800">
              <Sliders className="w-3.5 h-3.5 text-surface-600" />
              <span>Interactive Margin Simulator</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              Test How the AI Protects Your Margins
            </h2>
          </div>

          <p className="text-sm sm:text-base text-surface-600 max-w-md leading-relaxed font-normal">
            Adjust the sliders below to see how AgentBridge applies deterministic margin floors,
            counters lowball offers, and generates instant Razorpay payment links.
          </p>
        </div>

        {/* 2-Column Balanced Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: SKU Configuration (5 cols) */}
          <div className="lg:col-span-5 bg-surface-50 rounded-3xl p-6 sm:p-7 border border-black/[0.08] flex flex-col justify-between h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 min-h-[52px]">
              <div>
                <h3 className="font-display font-bold text-sm text-surface-900">
                  SKU Margin Rules
                </h3>
                <span className="text-xs text-surface-500 font-mono">
                  Nike Air Zoom Pegasus 40
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                Live Rule Active
              </span>
            </div>

            {/* Sliders Body */}
            <div className="space-y-5 flex-1 flex flex-col justify-around py-1">
              {/* Slider 1: Retail Price */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-700">
                    Retail MSRP
                  </span>
                  <span className="text-sm font-mono font-bold text-surface-900">
                    ₹{listPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="8000"
                  step="50"
                  value={listPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setListPrice(val)
                    if (val <= floorPrice) setFloorPrice(val - 200)
                  }}
                  className="w-full accent-surface-900 cursor-pointer h-1.5 bg-black/[0.08] rounded-lg"
                />
              </div>

              {/* Slider 2: Margin Floor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-surface-500" />
                    Hard Profit Floor
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-700">
                    ₹{floorPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max={Math.max(1600, listPrice - 100)}
                  step="50"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-black/[0.08] rounded-lg"
                />
              </div>

              {/* Slider 3: Buyer Offer */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-700">
                    Buyer Offer
                  </span>
                  <span className="text-sm font-mono font-bold text-surface-900">
                    ₹{buyerOffer.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max={listPrice}
                  step="50"
                  value={buyerOffer}
                  onChange={(e) => {
                    setBuyerOffer(Number(e.target.value))
                    setHasPaid(false)
                  }}
                  className="w-full accent-surface-900 cursor-pointer h-1.5 bg-black/[0.08] rounded-lg"
                />

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickOffer(Math.max(1500, floorPrice - 400))}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer text-center truncate',
                      buyerOffer < floorPrice
                        ? 'bg-surface-900 text-white border-surface-900 shadow-xs'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    Lowball ₹{(Math.max(1500, floorPrice - 400)).toLocaleString('en-IN')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickOffer(floorPrice)}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer text-center truncate',
                      buyerOffer === floorPrice
                        ? 'bg-surface-900 text-white border-surface-900 shadow-xs'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    Floor ₹{floorPrice.toLocaleString('en-IN')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickOffer(Math.min(listPrice, floorPrice + 350))}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer text-center truncate',
                      buyerOffer > floorPrice
                        ? 'bg-surface-900 text-white border-surface-900 shadow-xs'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    Above ₹{(Math.min(listPrice, floorPrice + 350)).toLocaleString('en-IN')}
                  </button>
                </div>
              </div>
            </div>

            {/* Left Footer */}
            <div className="border-t border-black/[0.06] pt-3 flex items-center justify-between text-xs font-mono text-surface-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                Live Rule Engine Connected
              </span>
              <span>Guardrails Armed</span>
            </div>
          </div>

          {/* Right Column: AI Decision Output (7 cols) */}
          <div className="lg:col-span-7 bg-[#090d16] text-white rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col justify-between h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 min-h-[52px]">
              <div>
                <h3 className="font-display font-bold text-sm text-white">
                  Decision Engine Output
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Deterministic Guardrail • &lt;38ms Latency
                </span>
              </div>

              <span
                className={cn(
                  'text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border self-start sm:self-auto',
                  isBelowFloor
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                )}
              >
                {isBelowFloor ? 'Floor Protected — Counter Generated' : 'Within Mandate — Auto-Approved'}
              </span>
            </div>

            {/* Metrics & Output Body */}
            <div className="space-y-4 flex-1 flex flex-col justify-around py-1">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Buyer Requested
                  </span>
                  <p className="font-mono text-base sm:text-lg font-bold text-white">
                    ₹{buyerOffer.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10.5px] font-mono text-slate-400">
                    {discountFromList}% off MSRP
                  </span>
                </div>

                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Floor Mandate
                  </span>
                  <p className="font-mono text-base sm:text-lg font-bold text-slate-200">
                    ₹{floorPrice.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10.5px] font-mono text-emerald-400 font-medium">
                    100% Floor Safe
                  </span>
                </div>

                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Final Offer
                  </span>
                  <p className="font-mono text-base sm:text-lg font-bold text-emerald-400">
                    ₹{counterPrice.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10.5px] font-mono text-slate-300">
                    +₹{netMarginSaved.toLocaleString('en-IN')} Net Margin
                  </span>
                </div>
              </div>

              {/* Simulated Response Box */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    WhatsApp Buyer Response
                  </span>
                  <span className="text-slate-300">15m Stock Reserved</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-normal">
                  {isBelowFloor ? (
                    <>
                      &ldquo;I can&apos;t do ₹{buyerOffer.toLocaleString('en-IN')}, but I can lock it right now for{' '}
                      <span className="text-white font-bold">₹{counterPrice.toLocaleString('en-IN')}</span> with Free
                      Express Shipping! Deal?&rdquo;
                    </>
                  ) : (
                    <>
                      &ldquo;Deal! I&apos;ve reserved 1 unit at{' '}
                      <span className="text-white font-bold">₹{counterPrice.toLocaleString('en-IN')}</span> for the
                      next 15 minutes. Tap below to complete instant checkout:&rdquo;
                    </>
                  )}
                </p>

                {/* 1-Tap Razorpay UPI Bar */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="text-white font-semibold block">Razorpay 1-Tap UPI</span>
                    <span className="text-[10.5px] font-mono text-slate-400 truncate block">
                      rzp.io/i/plink_pegasus40_₹{counterPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isSimulatingPayment}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0',
                      hasPaid
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-950 shadow-xs'
                    )}
                  >
                    {isSimulatingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : hasPaid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Paid ₹{counterPrice.toLocaleString('en-IN')} via UPI</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Pay ₹{counterPrice.toLocaleString('en-IN')} via UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Footer */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                Zero Hallucinations
              </span>
              <span>Hard Mathematical Floor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
