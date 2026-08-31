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
  KeyRound,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const flowSteps = [
  {
    step: '01',
    actor: 'Spending Mandate',
    badge: 'Zero-Trust Token',
    title: 'User Issues Cryptographic Mandate',
    desc: 'The buyer authorizes bounded purchasing power with budget limit, expiration timestamp, merchant allowlist, and a single-use nonce.',
    payload: '{\n  "mandateId": "mnd_8821",\n  "spendingLimit": 400000,\n  "currency": "INR",\n  "merchantAllowlist": ["runfast", "speedgear"],\n  "signature": "0x7a8f..."\n}',
    accent: 'text-brand-700 bg-brand-50 border-brand-200',
  },
  {
    step: '02',
    actor: 'A2A Engine',
    badge: 'Redis Atomic Hold',
    title: 'A2A Negotiation & Inventory Lock',
    desc: 'Buyer Agent negotiates ₹3,999 down to ₹3,799. Upon deal acceptance, inventory is atomically locked for 120 seconds in Redis.',
    payload: 'OFFER (₹3,999) ──► COUNTER (₹3,799 + free shipping) ──► ACCEPT\nPostgres State: RESERVED | Redis Key: lock:inventory:runfast:SKU-001 (TTL 120s)',
    accent: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    step: '03',
    actor: 'Seller Store',
    badge: 'x402 V2 Header',
    title: 'HTTP 402 PAYMENT-REQUIRED Challenge',
    desc: 'Seller Agent returns machine-readable x402 V2 challenge over HTTP specifying the zapai-inr scheme and order resource.',
    payload: 'HTTP/1.1 402 Payment Required\nPAYMENT-REQUIRED: {\n  "scheme": "exact",\n  "network": "zapai-inr",\n  "amount": "379900",\n  "payTo": "merchant_runfast"\n}',
    accent: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  {
    step: '04',
    actor: 'Buyer Agent',
    badge: 'Signed Authorization',
    title: 'Buyer Evaluates & Signs PAYMENT-SIGNATURE',
    desc: 'Buyer Agent validates challenge against mandate constraints (₹3,799 <= ₹4,000 budget), signs the payload, and sends PAYMENT-SIGNATURE.',
    payload: 'PAYMENT-SIGNATURE: {\n  "paymentId": "zap_pay_89123",\n  "mandateId": "mnd_8821",\n  "amount": "379900",\n  "nonce": "n_98a7",\n  "signature": "0x3e1d..."\n}',
    accent: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    step: '05',
    actor: 'ZapAI Facilitator',
    badge: 'Server-Side Policy',
    title: 'Zero-Trust Facilitator Verification & Settle',
    desc: 'ZapAI Facilitator checks: Valid Signature ∧ Not Expired ∧ Nonce Unused ∧ Amount <= Limit. Invokes configured Razorpay settlement adapter.',
    payload: 'POST /x402/verify ──► Status: 200 OK (Verified)\nPOST /x402/settle ──► Autonomous Settlement Rail (or Payment Link Fallback)',
    accent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  {
    step: '06',
    actor: 'Razorpay & Audit',
    badge: 'SHA-256 Hash Chain',
    title: 'Authoritative Webhook & Immutable Ledger',
    desc: 'Razorpay webhooks verify payment capture with HMAC-SHA256, deduct inventory to PAID, and append event to the cryptographic ledger.',
    payload: 'Razorpay Webhook: payment.captured (HMAC Verified)\nInventory: PAID | HashChain: H_n = SHA256(H_{n-1} + payload)',
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
              <span className="text-brand-600">The Autonomous Protocol & Fallback Rails.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
              x402 V2 handles the machine-readable HTTP challenge and cryptographic authorization.
              ZapAI Facilitator and Razorpay handle settlement and instant INR bank transfer, with an explicit human approval fallback.
            </p>
          </div>
        </div>

        {/* Dual Role Callout Cards: x402 vs Razorpay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-2">
            <div className="flex items-center gap-2 text-brand-700 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" /> 1. The Autonomous Protocol Rail (x402 V2)
            </div>
            <p className="text-xs text-surface-700 leading-relaxed">
              M2M HTTP handshake (`PAYMENT-REQUIRED` and `PAYMENT-SIGNATURE`) with `zapai-inr` scheme.
              Server-side Zero-Trust policy engine verifies spending bounds, nonces, and allowlists without human intervention.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-600" /> 2. The Controlled Human Fallback Rail
            </div>
            <p className="text-xs text-surface-700 leading-relaxed">
              When unattended settlement rails are restricted, ZapAI generates a Razorpay Standard Payment Link
              requiring explicit 1-tap user approval on WhatsApp. We never falsely label human checkout as autonomous.
            </p>
          </div>
        </div>

        {/* 6 Step Interactive Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step Selector List */}
          <div className="lg:col-span-5 space-y-2.5">
            {flowSteps.map((s, idx) => (
              <div
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none',
                  activeStep === idx
                    ? 'bg-surface-50 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                    : 'bg-white border-surface-200 hover:border-surface-300'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0',
                    activeStep === idx
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-600'
                  )}
                >
                  {s.step}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-surface-900">{s.title}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        s.accent
                      )}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-500 line-clamp-2">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Step Deep Inspector */}
          <div className="lg:col-span-7 bg-surface-900 rounded-3xl p-6 text-surface-100 flex flex-col justify-between space-y-6 shadow-xl font-mono">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-surface-300">
                    Step {flowSteps[activeStep].step} Payload Inspector
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-800 text-brand-300 font-semibold">
                  Actor: {flowSteps[activeStep].actor}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white font-sans">
                  {flowSteps[activeStep].title}
                </div>
                <p className="text-xs text-surface-400 font-sans leading-relaxed">
                  {flowSteps[activeStep].desc}
                </p>
              </div>
            </div>

            {/* Code / JSON block */}
            <div className="bg-black/50 rounded-2xl p-4 border border-surface-800 overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
              <pre className="whitespace-pre-wrap">{flowSteps[activeStep].payload}</pre>
            </div>

            {/* Navigation Dots */}
            <div className="flex items-center justify-between pt-2 border-t border-surface-800 text-xs text-surface-400 font-sans">
              <span>Step {activeStep + 1} of 6</span>
              <div className="flex items-center gap-1.5">
                {flowSteps.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      'w-2 h-2 rounded-full cursor-pointer transition-all',
                      activeStep === i ? 'w-6 bg-brand-500' : 'bg-surface-700 hover:bg-surface-600'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
