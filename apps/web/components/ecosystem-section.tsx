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
  ArrowRight
} from 'lucide-react'
import { DitherCardBackground } from './ui/dither-card-background'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel'

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  colSpan: string
  tag: string
  highlights?: string[]
  ditherVariant: 'top-right' | 'bottom-right' | 'center-scale' | 'left-bleed' | 'watermark-wide' | 'bottom-left' | 'watermark-left'
}

const features: FeatureItem[] = [
  {
    id: 'autonomous-negotiation',
    title: 'Autonomous AI WhatsApp Seller',
    description: 'Understands natural language buyer intent, handles product queries, and conducts multi-turn price negotiations on WhatsApp in real time.',
    icon: Bot,
    colSpan: 'lg:col-span-8',
    tag: 'CONVERSATIONAL AGENT',
    highlights: ['Natural Language Intent', 'Dynamic Counter-Offers', 'Size & Variant Recommendations', 'Human Escalation Support'],
    ditherVariant: 'watermark-wide',
  },
  {
    id: 'margin-mandates',
    title: 'Deterministic Margin Mandates',
    description: 'Mathematically guarantees you never sell below your cost floor. Define SKU-level minimum prices and maximum discount caps.',
    icon: ShieldCheck,
    colSpan: 'lg:col-span-4',
    tag: 'MARGIN GUARDRAILS',
    ditherVariant: 'top-right',
  },
  {
    id: 'razorpay-rails',
    title: 'Instant 1-Tap Razorpay Checkout',
    description: 'Issues authenticated Razorpay Payment Links (UPI, Cards, Netbanking) straight inside the conversation with real-time settlement.',
    icon: CreditCard,
    colSpan: 'lg:col-span-4',
    tag: 'PAYMENT RAILS',
    ditherVariant: 'left-bleed',
  },
  {
    id: 'catalog-spine',
    title: 'Unified Catalog & Shopify Sync',
    description: 'Native structured catalog management with optional one-click Shopify sync for automatic inventory counts and price updates.',
    icon: ShoppingBag,
    colSpan: 'lg:col-span-4',
    tag: 'STOREFRONT SYNC',
    ditherVariant: 'bottom-right',
  },
  {
    id: 'atomic-locks',
    title: 'Atomic Inventory Concurrency',
    description: '15-minute temporary inventory holds lock stock during negotiations, eliminating double-selling and race conditions.',
    icon: Zap,
    colSpan: 'lg:col-span-4',
    tag: 'INVENTORY LOCK',
    ditherVariant: 'bottom-left',
  },
  {
    id: 'settlement-audit',
    title: 'Instant INR Settlements & Verifiable Audit Trails',
    description: 'Money settles directly into Indian merchant bank accounts within seconds via Razorpay infrastructure, backed by cryptographic HMAC SHA-256 webhook verification.',
    icon: CheckCircle2,
    colSpan: 'lg:col-span-12',
    tag: 'SETTLEMENT & AUDIT',
    highlights: ['10-15s Bank Settlement', 'HMAC SHA-256 Signatures', 'Deterministic INR Rails', 'Immutable Trace Logs'],
    ditherVariant: 'watermark-left',
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
    <section id="ecosystem" className="relative py-20 sm:py-28 bg-white text-[#09090b] overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.4rem] font-bold tracking-tight text-[#09090b] leading-tight [text-wrap:balance]"
            >
              The Architecture of Autonomous Commerce
            </motion.h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl space-y-1.5 text-sm sm:text-base text-[#52525b] leading-relaxed font-normal lg:text-right"
          >
            <p>
              From natural language WhatsApp conversations to deterministic price guardrails and Razorpay bank settlements.
            </p>
          </motion.div>
        </div>

        {/* Asymmetric Bento Grid (Desktop only) */}
        <div className="hidden lg:grid grid-cols-12 gap-5 sm:gap-6">
          {features.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`${item.colSpan} group relative overflow-hidden rounded-2xl bg-white hover:bg-[#fafafa] border border-[#e4e4e7] hover:border-[#195adc]/40 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between cursor-pointer`}
              >
                {/* Dither Background with EONVERSE Logomark (Logo shown ONLY on the last card) */}
                <DitherCardBackground variant={item.ditherVariant} showLogo={item.id === 'financial-physical-layer'} />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    {/* Card Header: Tag & Icon Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-md bg-white/90 backdrop-blur-sm border border-[#e4e4e7] text-[11px] font-mono tracking-wider font-semibold text-[#52525b] uppercase shadow-2xs">
                        {item.tag}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#eff6ff] border border-[#dbeafe] text-[#195adc] group-hover:bg-[#195adc] group-hover:text-white group-hover:border-[#195adc] flex items-center justify-center transition-all duration-300 shrink-0">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#09090b] tracking-tight group-hover:text-[#195adc] transition-colors duration-200">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Highlights Pills (if applicable) */}
                  {item.highlights && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.highlights.map((h) => (
                        <span 
                          key={h} 
                          className="text-[11px] font-medium text-[#52525b] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#e4e4e7] shadow-2xs group-hover:border-[#d4d4d8] transition-colors"
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

        {/* Mobile/Tablet Carousel (Mobile preview) */}
        <div className="lg:hidden w-full relative">
          <Carousel setApi={setApi} opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4">
              {features.map((item) => {
                const Icon = item.icon
                return (
                  <CarouselItem key={item.id} className="pl-4 basis-[88%] sm:basis-[80%] md:basis-[48%] flex">
                    <div
                      className="group relative overflow-hidden rounded-2xl bg-white hover:bg-[#fafafa] border border-[#e4e4e7] hover:border-[#195adc]/40 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between cursor-pointer w-full h-full min-h-[320px]"
                    >
                      {/* Dither Background with EONVERSE Logomark (Logo shown ONLY on the last card) */}
                      <DitherCardBackground variant={item.ditherVariant} showLogo={item.id === 'financial-physical-layer'} />

                      <div className="relative z-10 flex flex-col justify-between h-full w-full">
                        <div>
                          {/* Card Header: Tag & Icon Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 rounded-md bg-white/90 backdrop-blur-sm border border-[#e4e4e7] text-[11px] font-mono tracking-wider font-semibold text-[#52525b] uppercase shadow-2xs">
                              {item.tag}
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] border border-[#dbeafe] text-[#195adc] group-hover:bg-[#195adc] group-hover:text-white group-hover:border-[#195adc] flex items-center justify-center transition-all duration-300 shrink-0">
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                          </div>

                          {/* Title */}
                          <div className="mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-[#09090b] tracking-tight group-hover:text-[#195adc] transition-colors duration-200">
                              {item.title}
                            </h3>
                          </div>

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Highlights Pills (if applicable) */}
                        {item.highlights && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.highlights.map((h) => (
                              <span 
                                key={h} 
                                className="text-[11px] font-medium text-[#52525b] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#e4e4e7] shadow-2xs group-hover:border-[#d4d4d8] transition-colors"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>

          {/* Carousel controls */}
          <div className="flex items-center justify-between mt-6 px-1">
            {/* Dots */}
            <div className="flex gap-2">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={current === i ? 'true' : 'false'}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    current === i 
                      ? 'w-6 bg-[#195adc]' 
                      : 'w-2.5 bg-[#e4e4e7] hover:bg-[#d4d4d8]'
                  }`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-9 h-9 rounded-full border-[#e4e4e7] text-[#09090b] hover:bg-[#f4f4f5] disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollNext()}
                disabled={!canScrollNext}
                className="w-9 h-9 rounded-full border-[#e4e4e7] text-[#09090b] hover:bg-[#f4f4f5] disabled:opacity-40 flex items-center justify-center cursor-pointer"
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



