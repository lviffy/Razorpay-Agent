'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react'

export default function PrecisionQuoteSection() {
  return (
    <section
      id="precision-quote"
      className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-surface-900 bg-white border-y border-black/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto apple-card-elevated rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 sm:gap-10 relative z-10 bg-gradient-to-br from-white via-surface-50/60 to-blue-50/30 border border-black/[0.08]">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
          </div>
        </div>

        <blockquote className="w-full space-y-3">
          <p className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-surface-900 tracking-tight leading-snug [text-wrap:balance]">
            &ldquo;Indian shoppers naturally converse and bargain in WhatsApp. With AgentBridge,
            your sales convert 3.4x faster while{' '}
            <span className="text-brand-600">
              every rupee of your profit margin remains mathematically protected.
            </span>
            &rdquo;
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-surface-600 pt-1">
            <span className="font-bold text-surface-900 font-sans">
              AgentBridge Autonomous Commerce Thesis
            </span>
            <span>•</span>
            <span className="text-brand-700 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero Margin Hallucinations
            </span>
            <span>•</span>
            <span className="text-surface-500 font-mono">Razorpay Official Rails</span>
          </div>
        </blockquote>
      </div>
    </section>
  )
}
