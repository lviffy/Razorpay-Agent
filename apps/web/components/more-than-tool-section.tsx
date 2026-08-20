'use client'
import React, { ReactNode, forwardRef, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Store,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { cn } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

export const contentPillars = [
  {
    id: 'discovery',
    icon: Sparkles,
    badge: 'Discovery & Intent',
    title: 'Natural Language Search',
    description:
      'Instantly retrieves catalog products, sizes, and variant matches from natural text inquiries under 45ms.',
  },
  {
    id: 'negotiation',
    icon: ShieldCheck,
    badge: 'Margin Mandates',
    title: 'Deterministic Floor Rules',
    description:
      'Calculates counter-offers mathematically against your minimum margin floor and max discount percentage.',
  },
  {
    id: 'checkout',
    icon: CreditCard,
    badge: 'Razorpay Rails',
    title: 'Instant 1-Tap Checkout',
    description:
      'Generates authenticated Razorpay Payment Links with 15-minute stock holds and webhook fulfillment.',
  },
]

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div
    className="relative mx-auto size-24 sm:size-26 duration-200"
    style={{
      maskImage: 'radial-gradient(circle, black 40%, transparent 60%)',
      WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 60%)',
    }}
  >
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
    <div
      className="absolute inset-0 m-auto flex size-10 sm:size-11 items-center justify-center border-l border-t bg-white group-hover:bg-[#195adc] transition-colors duration-300"
      style={{ borderColor: '#e4e4e7' }}
    >
      {children}
    </div>
  </div>
)

interface PillarCardProps {
  icon: React.ElementType
  badge: string
  title: string
  description: string
  index: number
  animate?: boolean
}

function PillarCard({ icon: Icon, badge, title, description, index, animate = true }: PillarCardProps) {
  const cardContent = (
    <div className="group relative flex flex-col items-center text-center rounded-2xl bg-[#fafafa] border border-[#e4e4e7] hover:border-[#195adc]/30 hover:shadow-sm transition-all duration-300 overflow-hidden w-full h-full justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#195adc]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <div className="pb-2 pt-5 sm:pt-6 px-5 w-full flex flex-col items-center">
        <CardDecorator>
          <Icon
            className="size-5 text-[#09090b] group-hover:text-white transition-colors duration-300"
            aria-hidden
          />
        </CardDecorator>

        <span
          className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full border"
          style={{
            color: '#195adc',
            borderColor: '#195adc33',
            backgroundColor: '#195adc0d',
          }}
        >
          {badge}
        </span>

        <h3 className="mt-2 text-[#09090b] font-bold text-sm sm:text-base tracking-tight">
          {title}
        </h3>
      </div>

      <div className="px-5 pb-5 sm:pb-6">
        <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )

  if (!animate) {
    return cardContent
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, delay: 0.1 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full"
    >
      {cardContent}
    </motion.div>
  )
}

const BeamCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-10 flex size-9 sm:size-11 items-center justify-center rounded-full border border-[#e4e4e7] bg-white p-2 sm:p-2.5 shadow-xs text-[#09090b]',
        className
      )}
    >
      {children}
    </div>
  )
})
BeamCircle.displayName = 'BeamCircle'

function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 sm:mt-6"
    >
      <div
        className="relative flex h-[200px] sm:h-[220px] md:h-[240px] w-full items-center justify-center overflow-hidden p-2 sm:p-4"
        ref={containerRef}
      >
        <div className="flex size-full flex-col max-w-lg max-h-[140px] sm:max-h-[160px] items-stretch justify-between gap-3 sm:gap-4">
          <div className="flex flex-row items-center justify-between">
            <BeamCircle ref={div1Ref}>
              <Smartphone className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
            <BeamCircle ref={div5Ref}>
              <CreditCard className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <BeamCircle ref={div2Ref}>
              <Store className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
            <BeamCircle
              ref={div4Ref}
              className="size-11 sm:size-13 border-[#195adc]/30 bg-[#195adc] text-white font-bold text-base shadow-sm p-0 flex items-center justify-center"
            >
              A
            </BeamCircle>
            <BeamCircle ref={div6Ref}>
              <ShoppingBag className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <BeamCircle ref={div3Ref}>
              <ShieldCheck className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
            <BeamCircle ref={div7Ref}>
              <Lock className="size-4 sm:size-5 text-[#09090b]" />
            </BeamCircle>
          </div>
        </div>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div1Ref}
          toRef={div4Ref}
          curvature={-50}
          endYOffset={-8}
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div2Ref}
          toRef={div4Ref}
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div3Ref}
          toRef={div4Ref}
          curvature={50}
          endYOffset={8}
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div5Ref}
          toRef={div4Ref}
          curvature={-50}
          endYOffset={-8}
          reverse
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div6Ref}
          toRef={div4Ref}
          reverse
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div7Ref}
          toRef={div4Ref}
          curvature={50}
          endYOffset={8}
          reverse
          gradientStartColor="#195adc"
          gradientStopColor="#7aaaff"
        />
      </div>
    </motion.div>
  )
}

export function MoreThanToolContent() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#09090b] tracking-tight"
        >
          More than just a chatbot
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 text-sm sm:text-base text-[#52525b] leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]"
        >
          AgentBridge is an end-to-end transactional middleware connecting WhatsApp conversations,
          margin policies, stock reservation locks, and instant Razorpay payment rails.
        </motion.p>
      </div>

      <AnimatedBeamDemo />

      <div className="hidden md:grid grid-cols-3 gap-4 sm:gap-6 max-w-full mt-6 sm:mt-8">
        {contentPillars.map((item, index) => (
          <PillarCard
            key={item.id}
            icon={item.icon}
            badge={item.badge}
            title={item.title}
            description={item.description}
            index={index}
          />
        ))}
      </div>

      <div className="md:hidden w-full relative mt-6">
        <Carousel opts={{ align: 'start', loop: false }} className="w-full">
          <CarouselContent className="-ml-4">
            {contentPillars.map((item, index) => (
              <CarouselItem key={item.id} className="pl-4 basis-[82%] sm:basis-[75%] flex">
                <div className="w-full flex">
                  <PillarCard
                    icon={item.icon}
                    badge={item.badge}
                    title={item.title}
                    description={item.description}
                    index={index}
                    animate={false}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}

export default function MoreThanToolSection() {
  return (
    <section
      className="relative bg-[#fafafa] py-12 sm:py-20 overflow-hidden border-t border-[#e4e4e7]"
    >
      <MoreThanToolContent />
    </section>
  )
}