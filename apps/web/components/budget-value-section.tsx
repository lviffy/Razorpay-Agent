'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ShieldCheck, CreditCard, Lock, Zap, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BorderBeam } from '@/components/ui/border-beam'

export default function BudgetValueSection() {
  type FeatureKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
  const [activeItem, setActiveItem] = useState<FeatureKey>('item-1')

  const cardDetails = {
    'item-1': {
      title: 'Deterministic Floor Price Mandates',
      tag: 'MARGIN GUARDRAIL',
      metric: '₹3,500 Hard Floor',
      submetric: 'Max 12% Discount Ceiling',
      status: 'Mandate Active & Enforced',
      code: 'if (offer < sku.minPrice) return makeCounterOffer(sku.minPrice, "Free Shipping")',
    },
    'item-2': {
      title: 'Zero-Friction WhatsApp Checkout',
      tag: 'RAZORPAY UPI RAILS',
      metric: '1-Tap UPI Link',
      submetric: 'Instant rzp.io Generation',
      status: 'Payment Link Created',
      code: 'razorpay.paymentLink.create({ amount: 379900, currency: "INR", description: "Pegasus 40" })',
    },
    'item-3': {
      title: 'Autonomous Inventory Locking',
      tag: 'CONCURRENCY CONTROL',
      metric: '15 Min Hold',
      submetric: 'Auto-Release Timer',
      status: '1 Unit Reserved for #9876',
      code: 'inventory.lock({ sku: "NK-PEG-40", quantity: 1, durationSeconds: 900 })',
    },
    'item-4': {
      title: 'Instant Webhook Order Settlement',
      tag: 'HMAC SHA-256 GATEWAY',
      metric: '< 10ms Verification',
      submetric: 'Automated Fulfillment',
      status: 'Signature Validated & Captured',
      code: 'verifyWebhookSignature(payload, signature, secret) -> emit("order.fulfilled")',
    },
  }

  const current = cardDetails[activeItem]

  return (
    <section id="mandates-detail" className="py-12 md:py-20 lg:py-28 bg-[#fafafa]">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20">
        <div className="relative z-10 mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#09090b] tracking-tight">
            Smarter commerce, protected margins
          </h2>
          <p className="text-[#52525b] leading-relaxed text-sm sm:text-base">
            With mathematical guardrails and automated checkout rails, merchants eliminate
            accidental discounts, prevent double-selling, and convert high-intent WhatsApp leads.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-16 items-start">
          <Accordion
            type="single"
            value={activeItem}
            onValueChange={(value) => value && setActiveItem(value as FeatureKey)}
            className="w-full"
          >
            <AccordionItem value="item-1" className="!border-b !border-[#e4e4e7]">
              <AccordionTrigger className="py-5 text-[#09090b] hover:no-underline hover:text-[#195adc] [&>svg]:text-[#09090b]">
                <div className="flex items-center gap-2 text-base font-bold text-left">
                  <ShieldCheck className="size-4.5 shrink-0 text-[#195adc]" />
                  Deterministic Floor Price Mandates
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-[#52525b] text-xs sm:text-sm leading-relaxed pb-5">
                Define minimum acceptable prices and max discount ceilings per SKU. The AI
                mathematically guarantees no buyer offer breaches your floor, proposing structured
                sweeteners instead.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="!border-b !border-[#e4e4e7]">
              <AccordionTrigger className="py-5 text-[#09090b] hover:no-underline hover:text-[#195adc] [&>svg]:text-[#09090b]">
                <div className="flex items-center gap-2 text-base font-bold text-left">
                  <CreditCard className="size-4.5 shrink-0 text-[#195adc]" />
                  Zero-Friction WhatsApp Checkout
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-[#52525b] text-xs sm:text-sm leading-relaxed pb-5">
                Generates instant authenticated Razorpay Payment Links (UPI, Cards, Netbanking)
                directly in WhatsApp so buyers can complete checkout in one tap without leaving chat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="!border-b !border-[#e4e4e7]">
              <AccordionTrigger className="py-5 text-[#09090b] hover:no-underline hover:text-[#195adc] [&>svg]:text-[#09090b]">
                <div className="flex items-center gap-2 text-base font-bold text-left">
                  <Lock className="size-4.5 shrink-0 text-[#195adc]" />
                  Autonomous Inventory Locking
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-[#52525b] text-xs sm:text-sm leading-relaxed pb-5">
                Temporarily reserves stock for 15 minutes when a payment link is issued. If checkout
                is not completed, units automatically release back to available stock.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="!border-b !border-[#e4e4e7]">
              <AccordionTrigger className="py-5 text-[#09090b] hover:no-underline hover:text-[#195adc] [&>svg]:text-[#09090b]">
                <div className="flex items-center gap-2 text-base font-bold text-left">
                  <Zap className="size-4.5 shrink-0 text-[#195adc]" />
                  Instant Webhook Order Settlement
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-[#52525b] text-xs sm:text-sm leading-relaxed pb-5">
                Real-time HMAC SHA-256 signature verification confirms payments instantly on the
                backend, triggering automated order creation, inventory commits, and confirmation
                messages.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Right Interactive Card with BorderBeam */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#e4e4e7] bg-white p-6 shadow-sm min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
                  <span className="px-2.5 py-1 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[10.5px] font-mono font-bold text-[#195adc] uppercase">
                    {current.tag}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    LIVE
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-[#09090b] tracking-tight">{current.title}</h4>
                  <p className="text-xs text-[#52525b] mt-1">{current.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#f8fafc] border border-[#e4e4e7] rounded-xl space-y-0.5">
                    <span className="text-[10px] font-mono text-[#52525b] font-bold">PRIMARY RULE</span>
                    <p className="text-base font-bold font-mono text-[#09090b]">{current.metric}</p>
                  </div>
                  <div className="p-3 bg-[#f8fafc] border border-[#e4e4e7] rounded-xl space-y-0.5">
                    <span className="text-[10px] font-mono text-[#52525b] font-bold">GUARDRAIL</span>
                    <p className="text-base font-bold font-mono text-[#195adc]">{current.submetric}</p>
                  </div>
                </div>

                <div className="p-3 bg-[#0C2340] rounded-xl text-[11px] font-mono text-blue-200 overflow-x-auto">
                  <span className="text-gray-400">// Execution Pipeline</span>
                  <p className="text-white pt-1">{current.code}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <BorderBeam
              duration={6}
              size={200}
              colorFrom="transparent"
              colorTo="#195adc"
              className="from-transparent via-[#195adc]/80 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  )
}