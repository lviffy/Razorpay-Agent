'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Layers,
  Bot,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const pipelineStages = [
  {
    step: '01',
    id: 'catalog-ingest',
    title: 'Catalog & Margin Mandate Ingestion',
    subtitle: 'Unified Inventory & Deterministic Floor Rules',
    description:
      'Ingest your native product catalog or connect Shopify with one click. Define SKU-level floor prices (e.g. ₹3,500) and max discount ceilings that the AI mathematically enforces.',
    icon: Layers,
    badge: 'STAGE 01 — STORE CONFIGURATION',
    telemetry: {
      action: 'catalog.sync() & mandate.lock()',
      latency: '120ms Initial Sync',
      status: '18 SKUs Configured with Hard Floors',
    },
    codeSnippet: `// 1. Ingest Product & Hard Floor Price
const product = await catalog.upsert({
  sku: "NK-PEG-40",
  title: "Nike Air Zoom Pegasus 40 (UK 9)",
  price: 4299,
  minPrice: 3500, // Hard floor: never sell below
  maxDiscountPct: 15,
  stockCount: 18,
});`,
  },
  {
    step: '02',
    id: 'ai-negotiation',
    title: 'Autonomous Negotiation & Stock Lock',
    subtitle: 'Conversational Intent & 15-Minute Concurrency',
    description:
      'Gemini 2.5 Flash processes buyer inquiries in natural language, reasons over margin guardrails, makes structured counter-offers, and temporarily reserves stock for 15 minutes.',
    icon: Bot,
    badge: 'STAGE 02 — WHATSAPP REASONING',
    telemetry: {
      action: 'intent.evaluate() -> counterOffer.issue()',
      latency: '< 45ms Intent Recall',
      status: '1 Unit Reserved (Timer: 15m)',
    },
    codeSnippet: `// 2. Autonomous Margin Negotiation & Stock Hold
const { decision, counterPrice } = evaluateMandate({
  buyerOffer: 3400,
  skuFloor: product.minPrice, // 3500
});

if (decision === "COUNTER_OFFER") {
  await inventory.lockUnit(product.sku, { durationMinutes: 15 });
  return sendWhatsAppMessage(buyer, "I can do ₹3,699 with Free Express Shipping!");
}`,
  },
  {
    step: '03',
    id: 'razorpay-settlement',
    title: 'Instant 1-Tap Razorpay Settlement',
    subtitle: 'Payment Links & Webhook Order Fulfillment',
    description:
      'The AI issues an authenticated Razorpay Payment Link directly in the chat. HMAC SHA-256 verified webhooks instantly confirm payment, commit inventory, and settle INR directly to merchant bank accounts.',
    icon: CreditCard,
    badge: 'STAGE 03 — RAZORPAY SETTLEMENT',
    telemetry: {
      action: 'payment.captured -> order.fulfill()',
      latency: '< 10ms Webhook Verification',
      status: 'Settled to Merchant Bank in 12s',
    },
    codeSnippet: `// 3. Razorpay Payment Link & HMAC Webhook
const paymentLink = await razorpay.paymentLink.create({
  amount: 369900, // ₹3,699.00 in paise
  currency: "INR",
  description: "Order #AB-1092 • Pegasus 40 UK 9",
  customer: { contact: "+919876543210" },
});

// Webhook HMAC Verification & Auto-Fulfillment
verifyWebhookSignature(body, signature, webhookSecret);
await orders.fulfill({ orderId: "AB-1092", rzpPaymentId: "pay_Rzp982012" });`,
  },
]

export default function FlowSection() {
  const [activeStep, setActiveStep] = useState<number>(0)
  const current = pipelineStages[activeStep]
  const IconComponent = current.icon

  return (
    <section
      id="flow-intro"
      className="relative py-20 sm:py-28 overflow-hidden text-surface-900"
    >
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              How AgentBridge Executes Autonomous Sales
            </h2>
          </div>

          <p className="text-sm sm:text-base text-surface-600 max-w-md leading-relaxed font-normal">
            From initial product catalog ingestion to WhatsApp AI negotiation and automated Razorpay bank settlement.
          </p>
        </div>

        {/* 3 Step Interactive Selector Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {pipelineStages.map((stage, idx) => {
            const isSelected = idx === activeStep
            const StepIcon = stage.icon

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStep(idx)}
                className={cn(
                  'p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer space-y-2',
                  isSelected
                    ? 'apple-card-elevated border-brand-500/40 ring-2 ring-brand-500/10 shadow-card'
                    : 'apple-glass-subtle hover:bg-white/80 hover:border-black/[0.08]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'font-display text-xs font-bold font-mono px-2 py-0.5 rounded-full',
                      isSelected ? 'bg-brand-500 text-white shadow-2xs' : 'bg-black/[0.06] text-surface-700'
                    )}
                  >
                    STAGE {stage.step}
                  </span>
                  <StepIcon
                    className={cn('w-4 h-4', isSelected ? 'text-brand-600' : 'text-surface-400')}
                  />
                </div>
                <h3 className="font-display text-sm font-bold text-surface-900 line-clamp-1">
                  {stage.title}
                </h3>
              </button>
            )
          })}
        </div>

        {/* Detailed Stage Showcase Pane */}
        <div className="apple-card-elevated rounded-[2rem] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Description (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-brand-600 uppercase">
                    {current.badge}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                    {current.title}
                  </h3>
                  <p className="text-sm font-semibold text-surface-700">{current.subtitle}</p>
                </div>

                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  {current.description}
                </p>

                {/* Telemetry Highlights */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-[#fbfbfd] border border-black/[0.06] rounded-2xl space-y-0.5 shadow-2xs">
                    <span className="text-[10px] font-mono text-surface-500 uppercase font-bold">Latency</span>
                    <p className="text-xs font-bold font-mono text-brand-600">{current.telemetry.latency}</p>
                  </div>
                  <div className="p-3.5 bg-[#fbfbfd] border border-black/[0.06] rounded-2xl space-y-0.5 shadow-2xs">
                    <span className="text-[10px] font-mono text-surface-500 uppercase font-bold">Execution Status</span>
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Active
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <Link href="/onboarding">
                    <Button className="apple-button-primary font-bold rounded-full text-xs px-6 h-11 gap-2 cursor-pointer">
                      <span>Test Stage {current.step} in Live Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Code & Execution Pipeline Frame (6 cols) */}
          <div className="lg:col-span-6 bg-[#0c2340] border border-blue-950/60 rounded-[1.5rem] p-5 sm:p-6 shadow-popover text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-gray-400 ml-2">pipeline_execution.ts</span>
              </div>
              <span className="text-[10.5px] font-mono bg-brand-500/30 text-brand-200 px-2 py-0.5 rounded font-bold">
                STAGE {current.step}
              </span>
            </div>

            <pre className="text-xs font-mono text-blue-100 overflow-x-auto leading-relaxed py-2">
              <code>{current.codeSnippet}</code>
            </pre>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>{current.telemetry.action}</span>
              <span className="text-emerald-400 font-semibold">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

