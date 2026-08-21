'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Quote } from 'lucide-react'

export default function PrecisionQuoteSection() {
  return (
    <section
      id="precision-quote"
      className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden text-surface-900"
    >
      <div className="max-w-[1240px] mx-auto apple-card-elevated rounded-[2rem] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 sm:gap-12 relative z-10">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-brand-500 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(25,90,220,0.3)]">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        <blockquote className="w-full space-y-3">
          <p className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-surface-900 tracking-tight leading-tight [text-wrap:balance]">
            &ldquo;Indian shoppers naturally converse and bargain in WhatsApp. With AgentBridge,
            your sales convert 3.4x faster while{' '}
            <span className="text-brand-600">
              every rupee of your profit margin remains mathematically protected.
            </span>
            &rdquo;
          </p>

          <div className="flex items-center gap-3 text-xs text-surface-500 pt-1">
            <span className="font-bold text-surface-900">
              AgentBridge Autonomous Commerce Thesis
            </span>
            <span>•</span>
            <span className="text-brand-600 font-semibold">Zero Margin Hallucinations</span>
          </div>
        </blockquote>
      </div>
    </section>
  )
}

