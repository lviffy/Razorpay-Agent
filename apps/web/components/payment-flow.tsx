'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Layers,
  Banknote,
  Store,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const flowSteps = [
  {
    step: '01',
    actor: 'Buyer Agent',
    badge: 'Signed Authorization',
    title: 'Buyer Agent Approves Offer',
    desc: 'Buyer agent verifies deal against pre-authorized spending mandate and issues cryptographic acceptance.',
    payload: '{ mandate_id: "mand_01", sku: "NK-PEG-40", amt: 379900, sig: "0x8f2a..." }',
    accent: 'text-brand-700 bg-brand-50 border-brand-200',
  },
  {
    step: '02',
    actor: 'Seller Agent',
    badge: '120s TTL Lock',
    title: 'x402 Payment Challenge',
    desc: 'Seller agent reserves unit via Redis atomic lock and returns HTTP 402 Payment Required header.',
    payload: 'HTTP/1.1 402 Payment Required\nx402-Challenge: 0x9f1a... | amount: 3799.00 INR',
    accent: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    step: '03',
    actor: 'ZapAI',
    badge: 'Protocol Adapter',
    title: 'Bridge Maps to Razorpay Order',
    desc: 'ZapAI intercepts x402 challenge and creates an idempotent order on Razorpay Orders API.',
    payload: 'POST /v1/orders { amount: 379900, currency: "INR", receipt: "x402_9f1a" }',
    accent: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    step: '04',
    actor: 'Razorpay Engine',
    badge: 'Instant Intent',
    title: '1-Tap UPI / Card Checkout',
    desc: 'Razorpay Optimizer routes payment through highest-success UPI rails (Google Pay, PhonePe, Paytm).',
    payload: 'rzp.io/i/plink_zapai_3799 | deep_link: upi://pay?pa=razorpay@icici',
    accent: 'text-brand-700 bg-brand-50 border-brand-200',
  },
  {
    step: '05',
    actor: 'Razorpay Webhook',
    badge: 'HMAC-SHA256',
    title: 'payment.captured Webhook',
    desc: 'Tamper-proof event verified with cryptographic secret before any database or state mutation.',
    payload: 'event: "payment.captured" | status: "captured" | hmac_signature: "a81f..."',
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    step: '06',
    actor: 'Shopify & Merchant',
    badge: 'T+0 INR Credit',
    title: 'Shopify Order & Instant INR',
    desc: 'Inventory committed to PAID, order created in Shopify, and merchant bank account credited.',
    payload: 'Shopify Order #ORD-1042 created | INR settled to HDFC Bank A/C in 11s',
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
]

export default function PaymentFlowSection() {
  const [activeStep, setActiveStep] = useState<number>(0)

  return (
    <section
      id="payment-flow"
      className="py-20 sm:py-28 bg-white text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              How x402 Meets Razorpay: <br />
              <span className="text-brand-600">Programmable Handshake to Real INR.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
              x402 solves the machine-readable HTTP payment challenge. Razorpay provides the real-world
              INR banking rails, UPI routing, and instant merchant settlement. Neither replaces the other.
            </p>
          </div>
        </div>

        {/* Dual Role Callout Cards: x402 vs Razorpay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-surface-50 border border-black/[0.06] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-mono font-bold text-xs">
                  402
                </div>
                <h3 className="font-bold text-sm sm:text-base text-surface-900">
                  x402 Protocol (Agent Layer)
                </h3>
              </div>
              <span className="text-[10.5px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                Agent Handshake
              </span>
            </div>
            <p className="text-xs sm:text-sm text-surface-600 leading-relaxed font-normal">
              Machine-readable HTTP 402 challenge/response protocol. Allows Buyer Agents to request items,
              receive cryptographically signed invoices, and verify bounded spending limits.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface-50 border border-black/[0.06] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <h3 className="font-bold text-sm sm:text-base text-surface-900">
                  Razorpay Rails (Settlement Layer)
                </h3>
              </div>
              <span className="text-[10.5px] font-mono text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
                INR Settlement
              </span>
            </div>
            <p className="text-xs sm:text-sm text-surface-600 leading-relaxed font-normal">
              Official Indian payment rails. Converts the agent handshake into high-success UPI intent links,
              cryptographic HMAC webhooks, and instant INR bank credits within 10–15s.
            </p>
          </div>
        </div>

        {/* 6-Stage End-to-End Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flowSteps.map((step, idx) => (
            <div
              key={step.step}
              onClick={() => setActiveStep(idx)}
              className={cn(
                'p-6 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs',
                activeStep === idx
                  ? 'bg-blue-50/40 border-brand-500/60 shadow-xs'
                  : 'bg-surface-50/70 border-black/[0.06] hover:bg-white hover:border-black/[0.12]'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-surface-400">
                    STAGE {step.step}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${step.accent}`}>
                    {step.badge}
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-surface-900">
                  {step.title}
                </h4>

                <p className="text-xs sm:text-[13px] text-surface-600 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              {/* Code Snippet */}
              <div className="p-3 rounded-xl bg-white border border-black/[0.08] font-mono text-[11px] text-surface-800 overflow-x-auto whitespace-pre-wrap">
                <code>{step.payload}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Settlement Guarantee Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-50 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-surface-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-surface-900">Zero Non-Fiat Tokens:</span>
            <span>All payments route in direct Indian Rupees (INR) with instant merchant bank deposit.</span>
          </div>
          <span className="text-emerald-700 font-bold shrink-0">100% RBI &amp; NPCI Compliant</span>
        </div>
      </div>
    </section>
  )
}
