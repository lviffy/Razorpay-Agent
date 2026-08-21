'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
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
              Autonomous WhatsApp commerce middleware powered by Razorpay rails and margin guardrails.
            </p>
          </div>

          {/* Actions: GitHub + One CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors border border-white/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>

            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <span>Start Autonomous Selling</span>
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
              All Systems Operational
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Bangalore, India
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
