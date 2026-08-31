'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Store,
  Bot,
  KeyRound,
  FileCheck,
  Copy,
  Check,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowStep {
  step: string
  stage: string
  actor: string
  actorIcon: React.ElementType
  badge: string
  railType: 'autonomous' | 'fallback' | 'shared'
  method: string
  endpoint: string
  title: string
  desc: string
  payload: string
  payloadType: 'json' | 'http' | 'trace'
  statusSummary: string
  verificationTag: string
  accent: {
    badge: string
    activeBg: string
    activeBorder: string
    dot: string
    actorBadge: string
  }
}

const flowSteps: FlowStep[] = [
  {
    step: '01',
    stage: 'STAGE 01 · AUTHORIZATION ANCHOR',
    actor: 'Consumer (WhatsApp Ingress)',
    actorIcon: KeyRound,
    badge: 'Zero-Trust Token',
    railType: 'shared',
    method: 'ECDSA secp256k1',
    endpoint: 'MANDATE_SIGN(consumer_wallet)',
    title: 'User Issues Cryptographic Mandate',
    desc: 'The buyer authorizes bounded purchasing power with budget limit, expiration timestamp, merchant allowlist, and a single-use nonce.',
    payload: `{\n  "mandateId": "mnd_8821901a9b",\n  "consumer": "+91 98765 43210",\n  "spendingLimitPaise": 400000,\n  "currency": "INR",\n  "expiresAt": 1756732800,\n  "merchantAllowlist": [\n    "runfast_sports",\n    "speedgear_in"\n  ],\n  "nonce": "nonce_7f8a19bc20",\n  "signature": "0x7a8f192b3c4d5e6f08192a3b4c5d6e7f8091a2b3c4d5e6f7..."\n}`,
    payloadType: 'json',
    statusSummary: 'ECDSA Signature Generated · Budget Capped at ₹4,000.00',
    verificationTag: 'Zero-Trust Mandate Verified',
    accent: {
      badge: 'text-brand-700 bg-brand-50 border-brand-200',
      activeBg: 'bg-brand-50',
      activeBorder: 'border-brand-500',
      dot: 'bg-brand-600',
      actorBadge: 'bg-brand-100 text-brand-800 border-brand-200',
    },
  },
  {
    step: '02',
    stage: 'STAGE 02 · A2A DISCOVERY & LOCK',
    actor: 'Buyer Agent ⇄ Seller Agent',
    actorIcon: Bot,
    badge: 'Redis Atomic Hold',
    railType: 'autonomous',
    method: 'A2A DIALOGUE',
    endpoint: 'INVENTORY_RESERVE',
    title: 'A2A Negotiation & Inventory Lock',
    desc: 'Buyer Agent negotiates ₹3,999 down to ₹3,799. Upon deal acceptance, inventory is atomically locked for 120 seconds in Redis.',
    payload: `--> BUYER_AGENT  : OFFER ₹3,700.00 for SKU-NK-PEG40 (Budget: ₹4,000.00)\n<-- SELLER_AGENT : COUNTER ₹3,799.00 + Free Express Delivery (Margin Floor: ₹3,600)\n--> BUYER_AGENT  : ACCEPT ₹3,799.00 (Within user mandate)\n\n[REDIS]   SET lock:inventory:runfast:SKU-NK-PEG40 "hold_a2a_891" NX EX 120\n[POSTGRES] UPDATE inventory SET status = 'RESERVED' WHERE sku = 'SKU-NK-PEG40'`,
    payloadType: 'trace',
    statusSummary: 'Redis Lock Acquired · 120s TTL · Race Condition Eliminated',
    verificationTag: 'Atomic Lock Confirmed',
    accent: {
      badge: 'text-amber-700 bg-amber-50 border-amber-200',
      activeBg: 'bg-amber-50',
      activeBorder: 'border-amber-500',
      dot: 'bg-amber-600',
      actorBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  },
  {
    step: '03',
    stage: 'STAGE 03 · HTTP CHALLENGE',
    actor: 'Seller Store (RunFast)',
    actorIcon: Store,
    badge: 'x402 V2 Header',
    railType: 'autonomous',
    method: 'HTTP 402',
    endpoint: 'GET /catalog/runfast/orders/rf_891230',
    title: 'HTTP 402 PAYMENT-REQUIRED Challenge',
    desc: 'Seller Agent returns machine-readable x402 V2 challenge over HTTP specifying the zapai-inr scheme and order resource.',
    payload: `HTTP/1.1 402 Payment Required\nContent-Type: application/json\nPAYMENT-REQUIRED: {\n  "version": "2.0",\n  "scheme": "exact",\n  "network": "zapai-inr",\n  "amountPaise": 379900,\n  "currency": "INR",\n  "payTo": "merchant_runfast_0192",\n  "resource": "order_rf_891230",\n  "facilitator": "https://facilitator.zapai.io/x402"\n}`,
    payloadType: 'http',
    statusSummary: 'Standard RFC-compliant HTTP 402 Challenge Issued',
    verificationTag: 'x402 V2 Scheme Formatted',
    accent: {
      badge: 'text-purple-700 bg-purple-50 border-purple-200',
      activeBg: 'bg-purple-50',
      activeBorder: 'border-purple-500',
      dot: 'bg-purple-600',
      actorBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  },
  {
    step: '04',
    stage: 'STAGE 04 · CRYPTO SIGNATURE',
    actor: 'Buyer Agent',
    actorIcon: ShieldCheck,
    badge: 'Signed Authorization',
    railType: 'autonomous',
    method: 'POST',
    endpoint: 'https://runfast-sports.com/x402/fulfill',
    title: 'Buyer Evaluates & Signs PAYMENT-SIGNATURE',
    desc: 'Buyer Agent validates challenge against mandate constraints (₹3,799 <= ₹4,000 budget), signs the payload, and sends PAYMENT-SIGNATURE.',
    payload: `POST /x402/fulfill HTTP/1.1\nHost: runfast-sports.com\nPAYMENT-SIGNATURE: {\n  "version": "2.0",\n  "paymentId": "zap_pay_89123",\n  "mandateId": "mnd_8821901a9b",\n  "amountPaise": 379900,\n  "nonce": "nonce_7f8a19bc20",\n  "timestamp": 1756732815,\n  "signature": "0x3e1d98a72b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d..."\n}`,
    payloadType: 'http',
    statusSummary: 'Mandate Constraints Satisfied · Signature Dispatched',
    verificationTag: 'Cryptographic Auth Valid',
    accent: {
      badge: 'text-blue-700 bg-blue-50 border-blue-200',
      activeBg: 'bg-brand-50',
      activeBorder: 'border-blue-500',
      dot: 'bg-blue-600',
      actorBadge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  },
  {
    step: '05',
    stage: 'STAGE 05 · SETTLEMENT ROUTE',
    actor: 'ZapAI Facilitator ⇄ Razorpay',
    actorIcon: Zap,
    badge: 'Server-Side Policy',
    railType: 'shared',
    method: 'POST',
    endpoint: 'https://facilitator.zapai.io/x402/settle',
    title: 'Zero-Trust Facilitator Verification & Settle',
    desc: 'ZapAI Facilitator checks: Valid Signature ∧ Not Expired ∧ Nonce Unused ∧ Amount <= Limit. Invokes configured Razorpay settlement adapter.',
    payload: `POST /x402/verify ──► Status: 200 OK\nChecks: Valid Sig (✓) ∧ Fresh Nonce (✓) ∧ Amount <= Limit (₹3,799 <= ₹4,000) (✓)\n\n[AUTONOMOUS RAIL]\n  └─► Razorpay Virtual Account / AutoPay Transfer: ₹3,799.00 -> Merchant Settlement (PAID)\n\n[FALLBACK RAIL (When Unattended Rails Restricted)]\n  └─► Razorpay Payment Link Generated -> Dispatched to Consumer WhatsApp (1-Tap Approve)`,
    payloadType: 'trace',
    statusSummary: 'Zero-Trust Invariants Verified · Settlement Adapter Triggered',
    verificationTag: 'Dual Settlement Ready',
    accent: {
      badge: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      activeBg: 'bg-indigo-50',
      activeBorder: 'border-indigo-500',
      dot: 'bg-indigo-600',
      actorBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
  },
  {
    step: '06',
    stage: 'STAGE 06 · AUDIT & LEDGER',
    actor: 'Razorpay & Cryptographic Ledger',
    actorIcon: FileCheck,
    badge: 'SHA-256 Hash Chain',
    railType: 'shared',
    method: 'WEBHOOK',
    endpoint: 'POST /api/webhooks/razorpay (HMAC-SHA256)',
    title: 'Authoritative Webhook & Immutable Ledger',
    desc: 'Razorpay webhooks verify payment capture with HMAC-SHA256, deduct inventory to PAID, and append event to the cryptographic ledger.',
    payload: `{\n  "event": "payment.captured",\n  "paymentId": "pay_Oq8192Jasd812",\n  "amountPaise": 379900,\n  "status": "captured",\n  "hmacVerification": "HMAC_SHA256_VALID",\n  "inventoryTransition": "RESERVED -> PAID (Deducted)",\n  "ledgerHash": {\n    "prevHash": "b19a8f23c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7",\n    "currHash": "c20b9e34d5f6a7b8192a3b4c5d6e7f8091a2b3c4d5e6f708"\n  }\n}`,
    payloadType: 'json',
    statusSummary: 'HMAC Authenticated · Event Sealed into Cryptographic Ledger',
    verificationTag: 'Ledger Sealed & Finalized',
    accent: {
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeBg: 'bg-emerald-50',
      activeBorder: 'border-emerald-500',
      dot: 'bg-emerald-600',
      actorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  },
]

function SyntaxHighlightedPayload({ payload, type }: { payload: string; type: FlowStep['payloadType'] }) {
  const lines = payload.split('\n')

  return (
    <div className="font-mono text-xs sm:text-[12px] leading-relaxed select-text space-y-0.5">
      {lines.map((line, idx) => {
        let formattedLine: React.ReactNode = line

        if (type === 'json') {
          const keyMatch = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(.*)$/)
          if (keyMatch) {
            const [, indent, key, colon, value] = keyMatch
            let valElement: React.ReactNode = value
            if (value.startsWith('"')) {
              valElement = <span className="text-emerald-300 font-medium">{value}</span>
            } else if (/^\d+/.test(value)) {
              valElement = <span className="text-amber-300 font-bold">{value}</span>
            } else if (value.includes('[') || value.includes('{')) {
              valElement = <span className="text-slate-300">{value}</span>
            }

            formattedLine = (
              <>
                {indent}
                <span className="text-sky-300">{key}</span>
                <span className="text-slate-500">{colon}</span>
                {valElement}
              </>
            )
          } else if (line.trim().startsWith('"')) {
            formattedLine = <span className="text-emerald-300">{line}</span>
          } else {
            formattedLine = <span className="text-slate-400">{line}</span>
          }
        } else if (type === 'http') {
          if (line.startsWith('HTTP/1.1 402')) {
            formattedLine = (
              <>
                <span className="text-slate-400">HTTP/1.1 </span>
                <span className="text-amber-400 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  402 Payment Required
                </span>
              </>
            )
          } else if (line.startsWith('POST')) {
            formattedLine = (
              <>
                <span className="text-brand-400 font-bold">POST </span>
                <span className="text-slate-200">{line.slice(5)}</span>
              </>
            )
          } else if (line.startsWith('Host:') || line.startsWith('Content-Type:')) {
            const [hdr, ...rest] = line.split(':')
            formattedLine = (
              <>
                <span className="text-purple-400 font-medium">{hdr}:</span>
                <span className="text-slate-300">{rest.join(':')}</span>
              </>
            )
          } else if (line.startsWith('PAYMENT-REQUIRED:') || line.startsWith('PAYMENT-SIGNATURE:')) {
            const [hdr, ...rest] = line.split(':')
            formattedLine = (
              <>
                <span className="text-brand-300 font-bold">{hdr}:</span>
                <span className="text-slate-300">{rest.join(':')}</span>
              </>
            )
          } else {
            const keyMatch = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(.*)$/)
            if (keyMatch) {
              const [, indent, key, colon, value] = keyMatch
              formattedLine = (
                <>
                  {indent}
                  <span className="text-sky-300">{key}</span>
                  <span className="text-slate-500">{colon}</span>
                  <span className={value.startsWith('"') ? 'text-emerald-300' : 'text-amber-300'}>
                    {value}
                  </span>
                </>
              )
            } else {
              formattedLine = <span className="text-slate-400">{line}</span>
            }
          }
        } else if (type === 'trace') {
          if (line.startsWith('--> BUYER_AGENT')) {
            formattedLine = (
              <>
                <span className="text-brand-400 font-bold">──► BUYER_AGENT :</span>
                <span className="text-slate-200">{line.replace('--> BUYER_AGENT  :', '')}</span>
              </>
            )
          } else if (line.startsWith('<-- SELLER_AGENT')) {
            formattedLine = (
              <>
                <span className="text-amber-400 font-bold">◄── SELLER_AGENT :</span>
                <span className="text-slate-200">{line.replace('<-- SELLER_AGENT :', '')}</span>
              </>
            )
          } else if (line.startsWith('[REDIS]')) {
            formattedLine = (
              <>
                <span className="text-rose-400 font-bold bg-rose-950 px-1 rounded border border-rose-800 mr-2">
                  REDIS
                </span>
                <span className="text-slate-300">{line.replace('[REDIS]   ', '')}</span>
              </>
            )
          } else if (line.startsWith('[POSTGRES]')) {
            formattedLine = (
              <>
                <span className="text-sky-400 font-bold bg-sky-950 px-1 rounded border border-sky-800 mr-2">
                  POSTGRES
                </span>
                <span className="text-slate-300">{line.replace('[POSTGRES] ', '')}</span>
              </>
            )
          } else if (line.includes('[AUTONOMOUS RAIL]')) {
            formattedLine = (
              <span className="text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                {line}
              </span>
            )
          } else if (line.includes('[FALLBACK RAIL')) {
            formattedLine = (
              <span className="text-amber-400 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                {line}
              </span>
            )
          } else {
            formattedLine = <span className="text-slate-300">{line}</span>
          }
        }

        return (
          <div key={idx} className="flex items-start">
            <span className="text-slate-600 select-none w-6 shrink-0 text-right pr-3 text-[11px]">
              {idx + 1}
            </span>
            <div className="flex-1 overflow-x-auto whitespace-pre">{formattedLine}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function PaymentFlowSection() {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(flowSteps[activeStep].payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeStep])

  const nextStep = useCallback(() => {
    setActiveStep((prev) => (prev < flowSteps.length - 1 ? prev + 1 : 0))
  }, [])

  const prevStep = useCallback(() => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : flowSteps.length - 1))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight') {
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        prevStep()
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        setActiveStep(parseInt(e.key, 10) - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextStep, prevStep])

  const currentStepData = flowSteps[activeStep]
  const ActorIcon = currentStepData.actorIcon

  const progressPercent = (activeStep / (flowSteps.length - 1)) * 100

  return (
    <section
      id="payment-flow"
      className="py-20 sm:py-28 bg-white text-surface-900 border-b border-surface-200 relative"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
              Machine-to-Machine Protocol Architecture
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              How x402 Meets Razorpay: <br className="hidden sm:inline" />
              <span className="text-brand-600">The Autonomous Protocol &amp; Fallback Rails.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal [text-wrap:pretty]">
              x402 V2 handles the machine-readable HTTP challenge and cryptographic authorization.
              ZapAI Facilitator and Razorpay handle settlement and instant INR bank transfer, with an explicit human approval fallback.
            </p>
          </div>
        </div>

        {/* Dual Role Callout Cards: x402 vs Razorpay - Solid Non-Transparent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Autonomous Protocol Rail */}
          <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 shadow-xs relative group hover:border-brand-300 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    1. The Autonomous Protocol Rail
                  </div>
                  <div className="text-[11px] font-medium text-surface-600">
                    x402 V2 Machine Handshake &amp; Settlement
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                Zero Human In Loop
              </span>
            </div>
            <p className="text-xs text-surface-700 leading-relaxed">
              M2M HTTP handshake (<code className="px-1 py-0.5 rounded bg-white border border-brand-200 font-mono text-[11px] text-surface-800">PAYMENT-REQUIRED</code> and <code className="px-1 py-0.5 rounded bg-white border border-brand-200 font-mono text-[11px] text-surface-800">PAYMENT-SIGNATURE</code>) with <code className="px-1 py-0.5 rounded bg-white border border-brand-200 font-mono text-[11px] text-surface-800">zapai-inr</code> scheme. Server-side Zero-Trust policy engine verifies spending bounds, nonces, and allowlists without human intervention.
            </p>
          </div>

          {/* Controlled Human Fallback Rail */}
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs relative group hover:border-amber-300 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    2. The Controlled Human Fallback Rail
                  </div>
                  <div className="text-[11px] font-medium text-surface-600">
                    Guarded WhatsApp 1-Tap Authorization
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                1-Tap Human Guard
              </span>
            </div>
            <p className="text-xs text-surface-700 leading-relaxed">
              When unattended settlement rails are restricted or mandate thresholds require stepped-up verification, ZapAI generates a Razorpay Standard Payment Link requiring explicit 1-tap user approval on WhatsApp. We never falsely label human checkout as autonomous.
            </p>
          </div>
        </div>

        {/* 6-Step Interactive Pipeline & Protocol Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Connected Protocol Stepper Timeline */}
          <div className="lg:col-span-5 relative flex flex-col justify-between" role="tablist" aria-label="Protocol Flow Steps">
            {/* Background Rail Line */}
            <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-surface-200 -z-0" />
            
            {/* Active Progress Fill Line */}
            <motion.div
              className="absolute left-[23px] top-6 w-[2px] bg-brand-500 origin-top -z-0"
              initial={false}
              animate={{ height: `${progressPercent}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />

            <div className="space-y-3 relative z-10">
              {flowSteps.map((s, idx) => {
                const isSelected = activeStep === idx
                const StepIcon = s.actorIcon

                return (
                  <div
                    key={s.step}
                    role="tab"
                    id={`step-tab-${s.step}`}
                    aria-selected={isSelected}
                    aria-controls={`step-panel-${s.step}`}
                    tabIndex={0}
                    onClick={() => setActiveStep(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActiveStep(idx)
                      }
                    }}
                    className={cn(
                      'p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 select-none relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      isSelected
                        ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-white border-surface-200 hover:border-surface-300 hover:bg-surface-50 shadow-2xs'
                    )}
                  >
                    {/* Step Node Circle */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all duration-200 z-10',
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm ring-4 ring-brand-100 scale-105'
                          : idx < activeStep
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-surface-100 text-surface-600 group-hover:bg-surface-200'
                      )}
                    >
                      {s.step}
                    </div>

                    {/* Step Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-surface-500 uppercase tracking-wider truncate">
                          <StepIcon className="w-3.5 h-3.5 shrink-0 text-surface-400" />
                          <span>{s.stage}</span>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0',
                            s.accent.badge
                          )}
                        >
                          {s.badge}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-surface-900 leading-snug">
                        {s.title}
                      </div>

                      <p className="text-[11px] sm:text-xs text-surface-500 leading-relaxed line-clamp-2">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: High-Fidelity Protocol Payload Debugger with Fixed Height */}
          <div
            className="lg:col-span-7 bg-[#0b0f19] rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col justify-between h-full min-h-[540px] font-mono relative overflow-hidden"
            role="tabpanel"
            id={`step-panel-${currentStepData.step}`}
            aria-labelledby={`step-tab-${currentStepData.step}`}
          >
            {/* Top Bar: Terminal Header & Controls */}
            <div className="space-y-3 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold tracking-wide">
                    <Terminal className="w-3.5 h-3.5 text-brand-400" />
                    <span>x402 Protocol Inspector</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-sans font-medium text-slate-300 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 cursor-pointer"
                    title="Copy payload (Ctrl+C)"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Payload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Endpoint & Actor Details Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800 uppercase tracking-wider">
                    {currentStepData.method}
                  </span>
                  <span className="text-xs text-slate-300 font-mono truncate max-w-[280px] sm:max-w-[380px]">
                    {currentStepData.endpoint}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  <ActorIcon className="w-3 h-3 text-brand-400" />
                  <span className="font-sans font-medium">{currentStepData.actor}</span>
                </div>
              </div>
            </div>

            {/* Code / Protocol Payload Body with STRICT FIXED HEIGHT (Never Jumps or Resizes) */}
            <div className="relative bg-[#060911] rounded-2xl p-4 sm:p-5 border border-slate-800 h-[280px] overflow-y-auto overflow-x-auto my-3 flex flex-col justify-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepData.step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  <SyntaxHighlightedPayload
                    payload={currentStepData.payload}
                    type={currentStepData.payloadType}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Contextual Status Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-300 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                  {currentStepData.statusSummary}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto shrink-0">
                {currentStepData.verificationTag}
              </span>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-sans shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevStep}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 cursor-pointer"
                  aria-label="Previous step (ArrowLeft)"
                  title="Previous step (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextStep}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 cursor-pointer"
                  aria-label="Next step (ArrowRight)"
                  title="Next step (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  Step {activeStep + 1} of {flowSteps.length}
                </span>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1.5">
                {flowSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    aria-label={`Jump to step ${i + 1}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none cursor-pointer',
                      activeStep === i
                        ? 'w-6 bg-brand-500 shadow-xs'
                        : 'w-1.5 bg-slate-700 hover:bg-slate-600'
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



