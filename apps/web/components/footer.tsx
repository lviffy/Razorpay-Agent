'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Logo from '@/components/logo'
import { useAuth } from '@/lib/context/auth-context'

export default function Footer() {
  const { isAuthenticated } = useAuth()

  return (
    <footer className="relative bg-white text-surface-900 border-t border-black/[0.06] overflow-hidden py-12 sm:py-16">
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-black/[0.06]">
          {/* Logo and Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo size="md" />
            <div className="hidden sm:block h-6 w-px bg-black/[0.08]" />
            <p className="text-xs text-surface-500 font-normal max-w-sm [text-wrap:pretty]">
              The autonomous commerce layer between AI buyer agents and real merchants. Settled through Razorpay.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>{isAuthenticated ? "Dashboard" : "Sign Up"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500 font-mono">
          <p>© 2026 ZapAI. Built for Razorpay Agentic Commerce.</p>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="flex items-center gap-2 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              A2A Protocol Live • Razorpay Rails Connected
            </span>
            <span className="text-surface-300 hidden sm:inline">•</span>
            <span className="text-surface-600 hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              x402 Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
