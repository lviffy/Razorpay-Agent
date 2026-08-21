'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative py-24 sm:py-32 px-4 sm:px-6 bg-[#080c16] text-white overflow-hidden flex flex-col items-center border-t border-white/10"
    >
      {/* Ambient Radial Lights in Dark CTA */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(0,82,255,0.25)_0%,rgba(25,90,220,0.1)_40%,transparent_70%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 w-[500px] h-[400px] bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] blur-2xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1240px] w-full relative z-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
        {/* Top Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/25 border border-brand-400/40 text-xs font-mono font-bold text-brand-300 uppercase">
          <Zap className="w-3.5 h-3.5 text-brand-300" />
          <span>Production Ready • Razorpay Agentic Commerce</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] [text-wrap:balance] max-w-3xl">
          Activate autonomous WhatsApp selling for{' '}
          <span className="text-brand-400">
            your store today.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed font-normal">
          Launch your AI seller agent, define your margin floor mandates, and start collecting
          instant UPI payments directly on WhatsApp with Razorpay settlement rails.
        </p>

        {/* Singular Green CTA Button */}
        <div className="pt-2">
          <Link href="/onboarding">
            <Button className="group bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full px-9 h-14 text-base gap-2 cursor-pointer shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all hover:scale-[1.02] active:scale-[0.99]">
              <span>Start Autonomous Selling</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Guarantees Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-300 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Instant Razorpay Test Mode
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Official WhatsApp Cloud API
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Shopify Sync Ready
          </span>
        </div>
      </div>
    </section>
  )
}
