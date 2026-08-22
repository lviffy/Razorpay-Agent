'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Bot, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/logo'

export default function Footer() {
  return (
    <footer className="relative bg-[#070b14] text-white border-t border-white/10 overflow-hidden py-12 sm:py-16">
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
          {/* Logo and Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo size="md" />
            <div className="hidden sm:block h-6 w-px bg-white/15" />
            <p className="text-xs text-slate-300 font-normal max-w-sm">
              The autonomous commerce layer between AI buyer agents and real merchants. Settled through Razorpay.
            </p>
          </div>

          {/* Actions: GitHub + One CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20"
            >
              <span>Start AgentBridge</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <p>© 2026 AgentBridge. Built for Razorpay Agentic Commerce.</p>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              A2A Protocol Live • Razorpay Rails Connected
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              x402 Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
