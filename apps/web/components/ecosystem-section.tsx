'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lock,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  colSpan: string
  tag: string
  highlights?: string[]
  accentBadge?: string
}

const features: FeatureItem[] = [
  {
    id: 'autonomous-negotiation',
    title: 'Autonomous AI WhatsApp Seller',
    description:
      'Understands natural language buyer intent, handles SKU variant queries, and conducts multi-turn price negotiations on WhatsApp in real time under 45ms.',
    icon: Bot,
    colSpan: 'lg:col-span-8',
    tag: 'CONVERSATIONAL AGENT',
    highlights: [
      'Natural Language Intent',
      'Dynamic Counter-Offers',
      'Size & Variant Recommendations',
      'Human Escalation Support',
    ],
    accentBadge: 'Gemini 2.5 Flash',
  },
  {
    id: 'margin-mandates',
    title: 'Deterministic Margin Mandates',
    description:
      'Mathematically guarantees you never sell below your cost floor. Define SKU-level minimum prices and maximum discount caps with zero hallucination.',
    icon: ShieldCheck,
    colSpan: 'lg:col-span-4',
    tag: 'MARGIN GUARDRAILS',
    highlights: ['100% Floor Compliance', 'Granular SKU Caps'],
  },
  {
    id: 'razorpay-rails',
    title: 'Instant 1-Tap Razorpay Checkout',
    description:
      'Issues authenticated Razorpay Payment Links (UPI, Cards, Netbanking) straight inside the WhatsApp chat with real-time settlement.',
    icon: CreditCard,
    colSpan: 'lg:col-span-4',
    tag: 'PAYMENT RAILS',
    highlights: ['rzp.io Payment Links', '1-Tap UPI Autopay'],
  },
  {
    id: 'catalog-spine',
    title: 'Unified Catalog & Shopify Sync',
    description:
      'Native structured catalog management with optional one-click Shopify sync for automatic inventory counts and price updates.',
    icon: ShoppingBag,
    colSpan: 'lg:col-span-4',
    tag: 'STOREFRONT SYNC',
    highlights: ['Multi-Variant Sync', 'Real-time Stock Counts'],
  },
  {
    id: 'atomic-locks',
    title: 'Atomic Inventory Concurrency',
    description:
      '15-minute temporary inventory holds lock stock during negotiations, completely eliminating double-selling and race conditions.',
    icon: Zap,
    colSpan: 'lg:col-span-4',
    tag: 'INVENTORY LOCK',
    highlights: ['15-min Auto-Release', 'Zero Race Conditions'],
  },
  {
    id: 'settlement-audit',
    title: 'Instant INR Settlements & Verifiable Audit Trails',
    description:
      'Money settles directly into Indian merchant bank accounts within seconds via Razorpay infrastructure, backed by cryptographic HMAC SHA-256 webhook verification.',
    icon: CheckCircle2,
    colSpan: 'lg:col-span-12',
    tag: 'SETTLEMENT & AUDIT',
    highlights: [
      '10-15s Bank Settlement',
      'HMAC SHA-256 Signatures',
      'Deterministic INR Rails',
      'Immutable Trace Logs',
    ],
    accentBadge: 'Razorpay Verified',
  },
]

export default function EcosystemSection() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    })
  }, [api])

  return (
    <section id="ecosystem" className="relative py-20 sm:py-28 bg-white text-surface-900 overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              The Architecture of Autonomous Commerce
            </h2>
          </div>

          <p className="text-sm sm:text-base text-surface-600 max-w-md leading-relaxed font-normal">
            From natural language WhatsApp conversations to deterministic price guardrails and Razorpay bank settlements.
          </p>
        </div>

        {/* Asymmetric Bento Grid (Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-5 sm:gap-6">
          {features.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className={cn(
                  item.colSpan,
                  'group relative overflow-hidden rounded-3xl bg-white border border-surface-200 hover:border-brand-300 p-6 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300'
                )}
              >
                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div>
                    {/* Header: Tag & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-[10.5px] font-mono tracking-wider font-bold text-surface-600 uppercase">
                          {item.tag}
                        </span>
                        {item.accentBadge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-mono font-bold text-brand-600">
                            {item.accentBadge}
                          </span>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 flex items-center justify-center transition-all duration-200 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-lg sm:text-xl font-bold text-surface-900 tracking-tight group-hover:text-brand-600 transition-colors duration-200 mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Highlights Pills */}
                  {item.highlights && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                      {item.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] font-medium text-surface-700 bg-surface-50 px-2.5 py-1 rounded-lg border border-surface-200/80"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Mobile/Tablet Carousel */}
        <div className="lg:hidden w-full relative">
          <Carousel setApi={setApi} opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4">
              {features.map((item) => {
                const Icon = item.icon
                return (
                  <CarouselItem key={item.id} className="pl-4 basis-[90%] sm:basis-[80%] flex">
                    <div className="group relative overflow-hidden rounded-3xl bg-white border border-surface-200 p-6 flex flex-col justify-between w-full h-full min-h-[300px] shadow-card">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-100 border border-surface-200 text-[10px] font-mono font-bold text-surface-600 uppercase">
                            {item.tag}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-display text-lg font-bold text-surface-900">
                            {item.title}
                          </h3>
                          <p className="text-xs text-surface-600 leading-relaxed mt-1.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {item.highlights && (
                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-surface-100">
                          {item.highlights.map((h) => (
                            <span
                              key={h}
                              className="text-[10.5px] font-medium text-surface-600 bg-surface-50 px-2 py-0.5 rounded-md border border-surface-200"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>

          {/* Carousel controls */}
          <div className="flex items-center justify-between mt-6 px-1">
            <div className="flex gap-1.5">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    current === i ? 'w-6 bg-brand-500' : 'w-2 bg-surface-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-8 h-8 rounded-full border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollNext()}
                disabled={!canScrollNext}
                className="w-8 h-8 rounded-full border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
