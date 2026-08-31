'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, ShieldCheck, Bot, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth-context'

const proofChips = [
  { icon: Bot,         label: 'Buyer Agent',      sub: 'Negotiating now',   pos: 'top-[14%] left-[6%]',     delay: '0s'   },
  { icon: Zap,         label: 'x402 Payment',     sub: 'Settled in <45ms',  pos: 'top-[18%] right-[7%]',    delay: '0.7s' },
  { icon: ShieldCheck, label: 'Margin Guardrail', sub: '100% enforced',     pos: 'bottom-[18%] left-[5%]',  delay: '1.3s' },
  { icon: Lock,        label: 'Inventory Lock',   sub: '120s TTL active',   pos: 'bottom-[14%] right-[6%]', delay: '2s'   },
]

export default function CTASection() {
  const { isAuthenticated } = useAuth()

  return (
    <section
      id="cta"
      className="relative py-28 sm:py-40 px-4 sm:px-6 bg-[#fbfbfd] text-surface-900 overflow-hidden flex flex-col items-center border-t border-black/[0.06]"
    >
      {/* Grid background */}
      <GridPattern
        width={32}
        height={32}
        x={-1}
        y={-1}
        strokeDasharray="4 2"
        className={cn(
          'absolute inset-0 fill-transparent stroke-black/[0.065]',
          '[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]'
        )}
      />

      {/* Brand radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[420px] w-[420px] rounded-full bg-brand-500/[0.07] blur-3xl" />
      </div>

      {/* Floating proof chips */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {proofChips.map(({ icon: Icon, label, sub, pos, delay }, i) => (
          <div
            key={i}
            style={{ animationDelay: delay }}
            className={`absolute ${pos} flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-sm animate-subtle-float`}
          >
            <div className="w-7 h-7 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-surface-900 leading-none">{label}</p>
              <p className="text-[10px] text-surface-500 font-medium mt-0.5 font-mono">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1240px] w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
        <div className="relative flex flex-col items-center gap-6">

          <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight text-surface-900 leading-[1.08] [text-wrap:balance] max-w-3xl">
            Give your store{' '}
            <span className="text-brand-600">an agent.</span>
          </h2>

          <p className="text-base sm:text-lg text-surface-600 max-w-xl leading-relaxed font-normal [text-wrap:pretty]">
            Let AI discover, negotiate and transact while Razorpay handles the money.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-1">
          <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
            <Button className="group bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-full px-10 h-14 text-base gap-2 cursor-pointer transition-colors duration-150 shadow-md shadow-brand-600/20">
              <span>{isAuthenticated ? 'Open Dashboard' : 'Start Free'}</span>
              <ArrowRight className="w-5 h-5 opacity-85 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all duration-150" />
            </Button>
          </Link>
        </div>

        {/* Guarantees strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-surface-500 font-medium">
          {[
            'Razorpay Official Rails',
            'x402 Protocol Compliant',
            '100% Margin Protected',
            'Instant T+0 INR Settlement',
          ].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
