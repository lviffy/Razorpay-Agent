'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative py-24 sm:py-32 px-4 sm:px-6 bg-[#090d16] text-white overflow-hidden flex flex-col items-center border-t border-white/10"
    >
      <div className="mx-auto max-w-[1240px] w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
        {/* Main Headline */}
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] [text-wrap:balance] max-w-3xl">
          Give your store{' '}
          <span className="text-brand-400">
            an agent.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal [text-wrap:pretty]">
          Let AI discover, negotiate and transact while Razorpay handles the money.
        </p>

        {/* Primary CTA Button */}
        <div className="pt-2">
          <Link href="/onboarding">
            <Button className="group bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full px-9 h-14 text-base gap-2 cursor-pointer shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-[0.99]">
              <span>Start AgentBridge</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Guarantees Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-300 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Razorpay Official Rails
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> x402 Protocol Compliant
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 100% Margin Protected
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Instant T+0 INR Settlement
          </span>
        </div>
      </div>
    </section>
  )
}
