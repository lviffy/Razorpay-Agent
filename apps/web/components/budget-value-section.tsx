'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ShieldCheck, CreditCard, Lock, Zap, CheckCircle2, Terminal } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BorderBeam } from '@/components/ui/border-beam'
import { cn } from '@/lib/utils'

export default function BudgetValueSection() {
  type FeatureKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
  const [activeItem, setActiveItem] = useState<FeatureKey>('item-1')

  const cardDetails = {
    'item-1': {
      title: 'Deterministic Floor Price Mandates',
      tag: 'MARGIN GUARDRAIL',
      metric: '₹3,500 Hard Floor',
      submetric: 'Max 15% Discount Ceiling',
      status: 'Mandate Active & Evaluated in < 10ms',
      code: `if (buyerOffer < sku.floorPrice) {
  return makeCounterOffer(sku.floorPrice, { perk: "Free Express Shipping" });
}`,
    },
    'item-2': {
      title: 'Zero-Friction WhatsApp Checkout',
      tag: 'RAZORPAY 1-TAP UPI',
      metric: '1-Tap UPI Autopay',
      submetric: 'Instant rzp.io Generation',
      status: 'Payment Link Generated & Sent to Chat',
      code: `const link = await razorpay.paymentLink.create({
  amount: 369900,
  currency: "INR",
  description: "Nike Pegasus 40 UK 9",
});`,
    },
    'item-3': {
      title: 'Autonomous Inventory Locking',
      tag: 'CONCURRENCY CONTROL',
      metric: '15 Min Hold',
      submetric: 'Auto-Release Timer',
      status: '1 Unit Reserved for WhatsApp Shopper',
      code: `await inventory.lockUnit({
  sku: "NK-PEG-40",
  quantity: 1,
  durationMinutes: 15,
});`,
    },
    'item-4': {
      title: 'Instant Webhook Order Settlement',
      tag: 'HMAC SHA-256 GATEWAY',
      metric: '< 10ms Verification',
      submetric: 'Automated Fulfillment',
      status: 'Signature Validated & Captured',
      code: `verifyWebhookSignature(payload, signature, secret);
emit("order.fulfilled", { orderId: "AB-1092" });`,
    },
  }

  const current = cardDetails[activeItem]

  return (
    <section id="mandates-detail" className="py-20 sm:py-28 bg-[#fafbfc] border-t border-surface-200 text-surface-900 overflow-hidden">
      <div className="mx-auto max-w-[1240px] space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
            Smarter commerce, protected margins
          </h2>
          <p className="text-surface-600 leading-relaxed text-sm sm:text-base">
            With mathematical guardrails and automated checkout rails, merchants eliminate
            accidental discounts, prevent double-selling, and convert high-intent WhatsApp leads.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6">
            <Accordion
              type="single"
              value={activeItem}
              onValueChange={(value) => value && setActiveItem(value as FeatureKey)}
              className="w-full space-y-3"
            >
              <AccordionItem value="item-1" className="border border-surface-200 rounded-2xl bg-white px-5 shadow-xs overflow-hidden">
                <AccordionTrigger className="py-4.5 text-surface-900 hover:no-underline hover:text-brand-600 [&>svg]:text-surface-600">
                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-left font-display">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Deterministic Floor Price Mandates</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-surface-600 text-xs sm:text-sm leading-relaxed pb-4 pl-11">
                  Define minimum acceptable prices and max discount ceilings per SKU. The AI
                  mathematically guarantees no buyer offer breaches your floor, proposing structured
                  sweeteners instead.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-surface-200 rounded-2xl bg-white px-5 shadow-xs overflow-hidden">
                <AccordionTrigger className="py-4.5 text-surface-900 hover:no-underline hover:text-brand-600 [&>svg]:text-surface-600">
                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-left font-display">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span>Zero-Friction WhatsApp Checkout</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-surface-600 text-xs sm:text-sm leading-relaxed pb-4 pl-11">
                  Generates instant authenticated Razorpay Payment Links (UPI, Cards, Netbanking)
                  directly in WhatsApp so buyers can complete checkout in one tap without leaving chat.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-surface-200 rounded-2xl bg-white px-5 shadow-xs overflow-hidden">
                <AccordionTrigger className="py-4.5 text-surface-900 hover:no-underline hover:text-brand-600 [&>svg]:text-surface-600">
                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-left font-display">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span>Autonomous Inventory Locking</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-surface-600 text-xs sm:text-sm leading-relaxed pb-4 pl-11">
                  Temporarily reserves stock for 15 minutes when a payment link is issued. If checkout
                  is not completed, units automatically release back to available stock.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-surface-200 rounded-2xl bg-white px-5 shadow-xs overflow-hidden">
                <AccordionTrigger className="py-4.5 text-surface-900 hover:no-underline hover:text-brand-600 [&>svg]:text-surface-600">
                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-left font-display">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span>Instant Webhook Order Settlement</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-surface-600 text-xs sm:text-sm leading-relaxed pb-4 pl-11">
                  Real-time HMAC SHA-256 signature verification confirms payments instantly on the
                  backend, triggering automated order creation, inventory commits, and confirmation
                  messages.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Right Interactive Simulator with BorderBeam (6 cols) */}
          <div className="lg:col-span-6 relative flex flex-col justify-between overflow-hidden rounded-3xl border border-surface-200 bg-white p-6 sm:p-7 shadow-card min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                  <span className="px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-[10.5px] font-mono font-bold text-brand-700 uppercase">
                    {current.tag}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE GUARDRAIL
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-lg sm:text-xl text-surface-900 tracking-tight">
                    {current.title}
                  </h4>
                  <p className="text-xs text-surface-500 mt-1">{current.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#f8fafc] border border-surface-200 rounded-2xl space-y-0.5">
                    <span className="text-[10px] font-mono text-surface-500 font-bold uppercase">PRIMARY RULE</span>
                    <p className="text-base font-bold font-mono text-surface-900">{current.metric}</p>
                  </div>
                  <div className="p-3.5 bg-[#f8fafc] border border-surface-200 rounded-2xl space-y-0.5">
                    <span className="text-[10px] font-mono text-surface-500 font-bold uppercase">GUARDRAIL</span>
                    <p className="text-base font-bold font-mono text-brand-600">{current.submetric}</p>
                  </div>
                </div>

                <div className="p-4 bg-[#0c2340] rounded-2xl text-xs font-mono text-blue-200 overflow-x-auto shadow-xs space-y-1">
                  <div className="text-gray-400 flex items-center gap-1 text-[11px]">
                    <Terminal className="w-3 h-3 text-brand-400" />
                    <span>// Execution Trace</span>
                  </div>
                  <pre className="text-white pt-1 overflow-x-auto leading-relaxed">
                    <code>{current.code}</code>
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>

            <BorderBeam
              duration={6}
              size={240}
              colorFrom="transparent"
              colorTo="#195adc"
              className="from-transparent via-brand-500/80 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  )
}