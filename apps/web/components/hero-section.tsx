'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  Zap,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VerticalPillar {
  id: string
  title: string
  subtitle: string
  description: string
  badge: string
  primaryMetric: { value: string; label: string }
  secondaryMetric: { value: string; label: string }
  capabilities: string[]
  accentColor: string
}

const verticalPillars: VerticalPillar[] = [
  {
    id: 'ai-seller',
    title: 'AI WhatsApp Seller Agent',
    subtitle: 'Conversational Intent & Context Engine',
    badge: 'AI SELLER',
    description:
      'Engages shoppers directly on WhatsApp where Indian commerce happens. Recognizes natural language queries, multi-product intent, and variant requests in real time.',
    primaryMetric: { value: '< 45ms', label: 'Intent Recall' },
    secondaryMetric: { value: '24 / 7', label: 'Autonomous Selling' },
    capabilities: [
      'WhatsApp Cloud API Direct Integration',
      'Context-Aware Semantic Search',
      'Multi-Variant & Size Recommendations',
      'Automated Human Escalation Triggers',
    ],
    accentColor: '#195adc',
  },
  {
    id: 'mandates',
    title: 'Deterministic Margin Mandates',
    subtitle: 'Mathematical Guardrails Engine',
    badge: 'MARGIN GUARDRAILS',
    description:
      'Never lose money on autonomous discounts. Define granular SKU-level floor prices and discount ceilings that the AI mathematically enforces before counter-offering.',
    primaryMetric: { value: '100%', label: 'Mandate Compliance' },
    secondaryMetric: { value: '₹3,500', label: 'Hard Floor Rule' },
    capabilities: [
      'Granular SKU Price Floor Limits',
      'Max Discount % Ceilings (e.g. 12%)',
      'Multi-Item Bundle Logic',
      'Dynamic Counter-Offer Negotiation',
    ],
    accentColor: '#195adc',
  },
  {
    id: 'razorpay-rails',
    title: 'Instant Razorpay Rails',
    subtitle: 'Payment Links & Webhook Settlement',
    badge: 'RAZORPAY CHECKOUT',
    description:
      'Generates authenticated Razorpay Payment Links (UPI, Cards, Netbanking) straight inside the conversation. Webhooks automatically fulfill orders and release inventory.',
    primaryMetric: { value: '1-Tap', label: 'UPI Checkout' },
    secondaryMetric: { value: '15 min', label: 'Auto Stock Lock' },
    capabilities: [
      'Dynamic rzp.io Payment Links',
      '15-Minute Temporary Stock Holds',
      'HMAC SHA-256 Webhook Verification',
      'Automated Order Lifecycle & Sync',
    ],
    accentColor: '#195adc',
  },
]

export default function HeroSection() {
  const [activeVertical, setActiveVertical] = useState<string>('ai-seller')
  const currentPillar =
    verticalPillars.find((p) => p.id === activeVertical) || verticalPillars[0]

  return (
    <section
      id="architecture"
      className="relative min-h-[92vh] flex flex-col justify-center pt-28 sm:pt-32 pb-16 sm:pb-24 bg-white text-[#09090b] overflow-hidden"
    >
      {/* 50px Precision Structural Grid Background */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:50px_50px] opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 z-10 w-full space-y-12">
        {/* Top Hero Header */}
        <div className="max-w-4xl space-y-4">

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#09090b] leading-[1.08] [text-wrap:balance]"
          >
            Turn WhatsApp conversations into{' '}
            <span className="text-[#195adc]">instant Razorpay sales.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#52525b] max-w-2xl leading-relaxed [text-wrap:pretty]"
          >
            An autonomous AI seller agent that handles natural language queries, negotiates within
            your strict margin mandates, temporarily locks live stock, and issues instant UPI
            checkout links.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Link href="/onboarding">
              <Button className="bg-[#195adc] hover:bg-[#378ffa] text-white font-bold rounded-full px-6 h-12 text-xs sm:text-sm gap-2 shadow-xs">
                <span>Start Conversational Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="rounded-full text-xs sm:text-sm font-bold px-6 h-12 border-[#e4e4e7] bg-white hover:bg-[#f8fafc]"
              >
                Open Merchant Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Vertical Switcher Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Segment Selector Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {verticalPillars.map((pillar) => {
              const isSelected = pillar.id === activeVertical
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveVertical(pillar.id)}
                  className={cn(
                    'text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-1.5',
                    isSelected
                      ? 'bg-[#f8fafc] border-[#195adc] shadow-xs ring-1 ring-[#195adc]/20'
                      : 'bg-white border-[#e4e4e7] hover:border-[#195adc]/40 hover:bg-[#fafafa]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52525b]">
                      {pillar.badge}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#195adc]" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#09090b]">{pillar.title}</h3>
                  <p className="text-xs text-[#52525b] line-clamp-2">{pillar.subtitle}</p>
                </button>
              )
            })}
          </div>

          {/* Dynamic Details Column (8 cols) */}
          <div className="lg:col-span-8 bg-[#f8fafc] border border-[#e4e4e7] rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-8 shadow-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPillar.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#195adc] uppercase">
                      {currentPillar.badge}
                    </span>
                    <span className="text-[#e4e4e7]">•</span>
                    <span className="text-xs font-medium text-[#52525b]">
                      {currentPillar.subtitle}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#09090b] tracking-tight">
                    {currentPillar.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed max-w-xl">
                    {currentPillar.description}
                  </p>
                </div>

                {/* Metrics Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 bg-white border border-[#e4e4e7] rounded-xl space-y-0.5">
                    <span className="text-[10px] font-mono text-[#52525b] font-bold">
                      {currentPillar.primaryMetric.label.toUpperCase()}
                    </span>
                    <p className="text-xl font-bold font-mono text-[#09090b]">
                      {currentPillar.primaryMetric.value}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-[#e4e4e7] rounded-xl space-y-0.5">
                    <span className="text-[10px] font-mono text-[#52525b] font-bold">
                      {currentPillar.secondaryMetric.label.toUpperCase()}
                    </span>
                    <p className="text-xl font-bold font-mono text-[#195adc]">
                      {currentPillar.secondaryMetric.value}
                    </p>
                  </div>

                  <div className="col-span-2 p-3.5 bg-white border border-[#e4e4e7] rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-[#52525b] font-bold">
                      ENGINE VERIFICATION
                    </span>
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Active &amp; Ready for Deployment
                    </p>
                  </div>
                </div>

                {/* Capabilities Checklist */}
                <div className="pt-2">
                  <p className="text-xs font-mono font-bold text-[#52525b] uppercase mb-3">
                    Key Platform Capabilities:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentPillar.capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-[#09090b] font-medium"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#195adc]" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#52525b]">
              <span>Powered by official WhatsApp Cloud API &amp; Razorpay Rails</span>
              <span className="font-mono text-[11px] text-[#09090b] font-bold">
                API Latency: 32ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}