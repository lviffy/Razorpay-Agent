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
  Bot,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MarginPlayground() {
  const [listPrice, setListPrice] = useState<number>(4299)
  const [floorPrice, setFloorPrice] = useState<number>(3600)
  const [maxDiscountPct, setMaxDiscountPct] = useState<number>(8)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(3000)
  const [lockDuration, setLockDuration] = useState<number>(120)
  const [buyerOffer, setBuyerOffer] = useState<number>(3400)
  const [isSimulatingPayment, setIsSimulatingPayment] = useState<boolean>(false)
  const [hasPaid, setHasPaid] = useState<boolean>(false)

  // Real-time calculation logic
  const maxAllowedDiscount = Math.round(listPrice * (maxDiscountPct / 100))
  const discountCappedPrice = listPrice - maxAllowedDiscount
  const effectiveFloor = Math.max(floorPrice, discountCappedPrice)

  const isBelowFloor = buyerOffer < effectiveFloor
  const counterPrice = isBelowFloor ? effectiveFloor : buyerOffer
  const includesFreeShipping = counterPrice >= freeShippingThreshold

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
      id="margin-protection"
      className="py-20 sm:py-28 bg-white text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              Let agents negotiate. <br className="hidden sm:inline" />
              <span className="text-brand-600">Never let them break your margins.</span>
            </h2>
            <p className="text-base sm:text-lg text-surface-600 leading-relaxed font-normal [text-wrap:pretty]">
              Merchants configure hard boundaries. The Seller Agent is mathematically bounded to never
              breach your profit floor or discount caps — guaranteed zero hallucinations.
            </p>
          </div>
        </div>

        {/* 2-Column Workstation Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Merchant Guardrail Mandates (5 cols) */}
          <div className="lg:col-span-5 bg-surface-50/80 rounded-3xl p-6 sm:p-7 border border-black/[0.08] flex flex-col justify-between h-full space-y-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-surface-900">
                  Merchant Guardrail Mandates
                </h3>
                <span className="text-xs text-surface-500 font-mono">
                  SKU: Nike Pegasus 40 UK 9
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                Rules Enforced
              </span>
            </div>

            {/* Slider Controls Body */}
            <div className="space-y-4 flex-1">
              {/* Slider 1: Floor Price */}
              <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Hard Profit Floor Price
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    ₹{floorPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="2500"
                  max="4000"
                  step="50"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-black/[0.06] rounded-lg"
                />
                <div className="flex justify-between text-[11px] font-mono text-surface-500">
                  <span>MSRP: ₹{listPrice.toLocaleString('en-IN')}</span>
                  <span>Minimum Floor: ₹{floorPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Slider 2: Max Discount Cap */}
              <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                    Max Discount Cap
                  </span>
                  <span className="font-mono text-sm font-bold text-brand-700">{maxDiscountPct}%</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={maxDiscountPct}
                  onChange={(e) => setMaxDiscountPct(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-2 bg-black/[0.06] rounded-lg"
                />
                <span className="text-[11px] font-mono text-surface-500 block">
                  Max allowed discount: ₹{maxAllowedDiscount} (Floor Capped: ₹{discountCappedPrice})
                </span>
              </div>

              {/* Fixed Thresholds Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-black/[0.06] space-y-0.5 shadow-2xs">
                  <span className="text-[10px] font-mono text-surface-500 uppercase block font-semibold">
                    Free Shipping
                  </span>
                  <p className="font-mono text-xs font-bold text-surface-900">
                    Above ₹{freeShippingThreshold.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-black/[0.06] space-y-0.5 shadow-2xs">
                  <span className="text-[10px] font-mono text-surface-500 uppercase block font-semibold">
                    Lock Duration
                  </span>
                  <p className="font-mono text-xs font-bold text-amber-700">
                    {lockDuration}s Auto-Release
                  </p>
                </div>
              </div>

              {/* Interactive Buyer Offer Simulator */}
              <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900">Simulate Buyer Offer</span>
                  <span className="font-mono font-extrabold text-surface-900 text-sm">
                    ₹{buyerOffer.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="2500"
                  max={listPrice}
                  step="50"
                  value={buyerOffer}
                  onChange={(e) => {
                    setBuyerOffer(Number(e.target.value))
                    setHasPaid(false)
                  }}
                  className="w-full accent-brand-600 cursor-pointer h-2 bg-black/[0.1] rounded-lg"
                />

                {/* Quick Offer Preset Buttons */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickOffer(floorPrice - 200)}
                    className={cn(
                      'py-1.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-mono font-bold border transition-all cursor-pointer text-center truncate shadow-2xs',
                      buyerOffer < effectiveFloor
                        ? 'bg-surface-900 text-white border-surface-900'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    <span className="hidden xs:inline">Lowball </span>₹{(floorPrice - 200).toLocaleString('en-IN')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickOffer(effectiveFloor)}
                    className={cn(
                      'py-1.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-mono font-bold border transition-all cursor-pointer text-center truncate shadow-2xs',
                      buyerOffer === effectiveFloor
                        ? 'bg-surface-900 text-white border-surface-900'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    <span className="hidden xs:inline">Floor </span>₹{effectiveFloor.toLocaleString('en-IN')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickOffer(listPrice - 100)}
                    className={cn(
                      'py-1.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-mono font-bold border transition-all cursor-pointer text-center truncate shadow-2xs',
                      buyerOffer > effectiveFloor
                        ? 'bg-surface-900 text-white border-surface-900'
                        : 'bg-white border-black/[0.08] text-surface-700 hover:bg-surface-100'
                    )}
                  >
                    <span className="hidden xs:inline">Full </span>₹{(listPrice - 100).toLocaleString('en-IN')}
                  </button>
                </div>
              </div>
            </div>

            {/* Left Card Footer */}
            <div className="border-t border-black/[0.06] pt-3 flex items-center justify-between text-xs font-mono text-surface-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Check className="w-3.5 h-3.5" />
                Deterministic Guardrails Active
              </span>
              <span>Zero Price Leaks</span>
            </div>
          </div>

          {/* Right Column: Live Decision Engine Output (7 cols) */}
          <div className="lg:col-span-7 bg-surface-50/90 text-surface-900 rounded-3xl p-6 sm:p-7 border border-black/[0.08] flex flex-col justify-between h-full space-y-6 shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-surface-900">
                  Seller Agent Decision Trace
                </h3>
                <span className="text-xs text-surface-500 font-mono">
                  Deterministic Math Engine • &lt;35ms Latency
                </span>
              </div>

              <span
                className={cn(
                  'text-[11px] font-mono font-bold px-3 py-1 rounded-full border self-start sm:self-auto shadow-2xs',
                  isBelowFloor
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                )}
              >
                {isBelowFloor ? 'Floor Protected — Sweetener Counter' : 'Within Mandate — Auto-Approved'}
              </span>
            </div>

            {/* 3 Prominent Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white border border-black/[0.06] rounded-2xl space-y-1 shadow-2xs">
                <span className="text-[10.5px] font-mono text-surface-500 block uppercase font-semibold">
                  Buyer Bid
                </span>
                <p className="font-mono text-xl font-bold text-surface-900">
                  ₹{buyerOffer.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] font-mono text-surface-500">
                  {Math.round(((listPrice - buyerOffer) / listPrice) * 100)}% off MSRP
                </span>
              </div>

              <div className="p-4 bg-white border border-black/[0.06] rounded-2xl space-y-1 shadow-2xs">
                <span className="text-[10.5px] font-mono text-surface-500 block uppercase font-semibold">
                  Effective Floor
                </span>
                <p className="font-mono text-xl font-bold text-surface-800">
                  ₹{effectiveFloor.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  100% Floor Safe
                </span>
              </div>

              <div className="p-4 bg-white border border-black/[0.06] rounded-2xl space-y-1 shadow-2xs">
                <span className="text-[10.5px] font-mono text-surface-500 block uppercase font-semibold">
                  Agent Offer
                </span>
                <p className="font-mono text-xl font-bold text-emerald-700">
                  ₹{counterPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] font-mono text-surface-600 font-medium">
                  {includesFreeShipping ? '+ Free Express Delivery' : 'Standard Delivery'}
                </span>
              </div>
            </div>

            {/* Simulated Agent Response Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-surface-500 border-b border-black/[0.06] pb-2.5">
                <span className="flex items-center gap-1.5 text-surface-800 font-bold">
                  <Bot className="w-3.5 h-3.5 text-brand-600" />
                  Seller Agent Bounded Reply
                </span>
                <span className="text-amber-700 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> 120s Stock Reserved
                </span>
              </div>

              <p className="text-xs sm:text-sm text-surface-700 leading-relaxed font-sans font-normal">
                {isBelowFloor ? (
                  <>
                    &ldquo;I cannot do ₹{buyerOffer.toLocaleString('en-IN')} as it violates our merchant margin mandate. However, I can lock 1 unit for you at{' '}
                    <span className="text-surface-900 font-bold">₹{counterPrice.toLocaleString('en-IN')}</span> with Free
                    Express Shipping! Deal?&rdquo;
                  </>
                ) : (
                  <>
                    &ldquo;Offer of ₹{buyerOffer.toLocaleString('en-IN')} is within merchant discount bounds. I have reserved 1 unit at{' '}
                    <span className="text-surface-900 font-bold">₹{counterPrice.toLocaleString('en-IN')}</span> for the next 120 seconds. Complete instant Razorpay checkout below:&rdquo;
                  </>
                )}
              </p>

              {/* 1-Tap Razorpay Checkout Bar */}
              <div className="p-3.5 rounded-xl bg-surface-50 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-surface-900 font-bold block text-sm">Razorpay 1-Tap UPI</span>
                  <span className="text-[11px] font-mono text-surface-500 truncate block mt-0.5">
                    rzp.io/i/plink_pegasus40_₹{counterPrice}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isSimulatingPayment}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0 shadow-xs',
                    hasPaid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#0052ff] hover:bg-[#0045d8] text-white'
                  )}
                >
                  {isSimulatingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Webhook...</span>
                    </>
                  ) : hasPaid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settled ₹{counterPrice.toLocaleString('en-IN')} via UPI</span>
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

            {/* Right Card Footer */}
            <div className="border-t border-black/[0.06] pt-3 flex items-center justify-between text-xs font-mono text-surface-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Zero Hallucinations
              </span>
              <span>Guardrails Verified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
