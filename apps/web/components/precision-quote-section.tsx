'use client'

import React from 'react'
import { ShieldCheck, CheckCircle2, Lock, Zap } from 'lucide-react'

export default function PrecisionQuoteSection() {
  return (
    <section
      id="precision-statement"
      className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-surface-900 bg-white border-y border-black/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto apple-card-elevated rounded-[2.5rem] p-7 sm:p-12 flex flex-col md:flex-row items-center gap-7 sm:gap-10 relative z-10 bg-gradient-to-br from-white via-surface-50/60 to-blue-50/30 border border-black/[0.08] shadow-xs">
        <div className="shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>

        <div className="w-full space-y-4">
          <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-surface-900 tracking-tight leading-snug [text-wrap:balance]">
            Shoppers bargain on WhatsApp. ZapAI turns conversational friction into closed sales — while{' '}
            <span className="text-brand-600">
              every rupee of your profit margin remains mathematically protected.
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-surface-700 pt-1 font-medium">
            <span className="text-surface-900 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Zero Margin Hallucinations
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 120s Atomic Stock Locks
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-600 shrink-0" /> Official Razorpay Settlement Rails
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
