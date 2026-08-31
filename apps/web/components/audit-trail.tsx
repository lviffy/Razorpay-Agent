'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Fingerprint,
  Link as LinkIcon,
  Copy,
  Check,
  Hash,
  AlertTriangle,
  RefreshCw,
  Download,
  Terminal,
  Zap,
  KeyRound,
  FileCheck2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AuditNode {
  id: string
  stepNumber: number
  label: string
  identifier: string
  timestamp: string
  actor: string
  eventType: string
  prevHash: string
  currHash: string
  tamperedCurrHash?: string
  canonicalPayload: Record<string, unknown>
  details: {
    [key: string]: string
  }
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

const pristineAuditNodes: AuditNode[] = [
  {
    id: 'intent',
    stepNumber: 1,
    label: '1. WhatsApp Inbound Intent',
    identifier: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgWM0I...',
    timestamp: '18:30:00.102 IST',
    actor: 'USER / WHATSAPP_INGRESS',
    eventType: 'INTENT_RECEIVED',
    prevHash: GENESIS_HASH,
    currHash: 'a81f9b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
    canonicalPayload: {
      from: '+919876543210',
      messageId: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgWM0I',
      prompt: 'Find running shoes under ₹4,000 UK 9',
      requestedBudgetPaise: 400000,
    },
    details: {
      'Sender': '+91 98765 43210 (Verified)',
      'Prompt': 'Find running shoes under ₹4,000 UK 9',
      'Mandate Limit': '₹4,000 (paise: 400000)',
      'Ingress Status': 'HMAC Webhook Verified',
    },
  },
  {
    id: 'mandate',
    stepNumber: 2,
    label: '2. Zero-Trust Mandate Creation',
    identifier: 'mnd_8821901a9b',
    timestamp: '18:30:00.640 IST',
    actor: 'BUYER_AGENT / MANDATE_SIGNER',
    eventType: 'MANDATE_CREATED',
    prevHash: 'a81f9b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
    currHash: 'b19a8f23c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f',
    canonicalPayload: {
      currency: 'INR',
      expiresAt: '2026-08-31T18:40:00.000Z',
      mandateId: 'mnd_8821901a9b',
      merchantAllowlist: ['runfast', 'speedgear'],
      nonce: 'n_98a7fbc3',
      spendingLimitPaise: 400000,
    },
    details: {
      'Mandate ID': 'mnd_8821901a9b',
      'Spending Bound': '₹4,000.00 Max',
      'Cryptographic Nonce': 'n_98a7fbc3 (Single-use challenge)',
      'Allowlist Check': 'Merchant [runfast] pre-authorized',
    },
  },
  {
    id: 'negotiation',
    stepNumber: 3,
    label: '3. A2A Deal Negotiation',
    identifier: 'conv_a2a_89218042a901',
    timestamp: '18:30:01.450 IST',
    actor: 'A2A_ENGINE (BUYER ↔ SELLER)',
    eventType: 'DEAL_ACCEPTED',
    prevHash: 'b19a8f23c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f',
    currHash: 'c20b9e34d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80',
    canonicalPayload: {
      buyerAgent: 'agent_buyer_101',
      counterPricePaise: 379900,
      offerPricePaise: 399900,
      sellerAgent: 'seller_runfast_bengaluru',
      settledPricePaise: 379900,
      skuId: 'SKU-SHOE-001',
    },
    details: {
      'Buyer Agent': 'agent_buyer_101',
      'Seller Agent': 'seller_runfast_bengaluru',
      'Turns': 'OFFER (₹3,999) ──► COUNTER (₹3,799) ──► ACCEPT',
      'Settled Amount': '₹3,799 (Agreed within budget)',
    },
  },
  {
    id: 'lock',
    stepNumber: 4,
    label: '4. Atomic Inventory Reservation',
    identifier: 'res_77a9812bf0912',
    timestamp: '18:30:01.820 IST',
    actor: 'SELLER_AGENT / REDIS_ENGINE',
    eventType: 'INVENTORY_RESERVED',
    prevHash: 'c20b9e34d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80',
    currHash: 'd31ca045e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091',
    canonicalPayload: {
      lockKey: 'lock:inventory:runfast:SKU-SHOE-001',
      quantity: 1,
      reservationId: 'res_77a9812bf0912',
      skuId: 'SKU-SHOE-001',
      ttlSeconds: 120,
    },
    details: {
      'Redis Lock Key': 'lock:inventory:runfast:SKU-SHOE-001',
      'TTL Window': '120 seconds (Auto-release if unpaid)',
      'Postgres State': 'RESERVED (FOR UPDATE serialized)',
      'Concurrency Defense': 'SET NX EX 120 (Zero double-selling)',
    },
  },
  {
    id: 'x402-req',
    stepNumber: 5,
    label: '5. x402 V2 Payment Challenge',
    identifier: 'x402_req_40291a82',
    timestamp: '18:30:02.010 IST',
    actor: 'SELLER_STORE / HTTP_402',
    eventType: 'PAYMENT_REQUIRED',
    prevHash: 'd31ca045e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091',
    currHash: 'e42db156f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2',
    canonicalPayload: {
      amountPaise: 379900,
      asset: 'INR',
      network: 'zapai-inr',
      payTo: 'merchant_runfast',
      resource: 'order/ORD-1042',
      scheme: 'exact',
    },
    details: {
      'HTTP Status': '402 Payment Required',
      'Payment Scheme': 'exact / zapai-inr',
      'Challenge Amount': '₹3,799.00 (379900 paise)',
      'Payee Resource': 'merchant_runfast / order/ORD-1042',
    },
  },
  {
    id: 'x402-auth',
    stepNumber: 6,
    label: '6. x402 V2 Mandate Authorization',
    identifier: 'zap_pay_89123c8901',
    timestamp: '18:30:02.110 IST',
    actor: 'BUYER_AGENT / ZAPAI_FACILITATOR',
    eventType: 'PAYMENT_AUTHORIZED',
    prevHash: 'e42db156f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2',
    currHash: 'f53ec26708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3',
    canonicalPayload: {
      amount: '379900',
      currency: 'INR',
      mandateId: 'mnd_8821901a9b',
      nonce: 'n_98a7fbc3',
      paymentId: 'zap_pay_89123c8901',
      resource: 'order/ORD-1042',
    },
    details: {
      'Scheme / Network': 'exact / zapai-inr',
      'Facilitator': 'ZapAI Facilitator (/x402/verify)',
      'Zero-Trust Checks': 'Signature OK ∧ Nonce Fresh ∧ Amount <= Limit',
      'Nonce': 'n_98a7fbc3 (Single-use consumed)',
    },
  },
  {
    id: 'razorpay',
    stepNumber: 7,
    label: '7. Razorpay Payment Capture',
    identifier: 'pay_Rzp_9812401820',
    timestamp: '18:30:02.940 IST',
    actor: 'RAZORPAY_ADAPTER / WEBHOOK',
    eventType: 'PAYMENT_CAPTURED',
    prevHash: 'f53ec26708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3',
    currHash: '064fd378192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4',
    canonicalPayload: {
      amountPaise: 379900,
      currency: 'INR',
      orderId: 'order_Rzp_9812401',
      paymentId: 'pay_Rzp_9812401820',
      status: 'captured',
    },
    details: {
      'Razorpay Order': 'order_Rzp_9812401',
      'Webhook Event': 'payment.captured (Raw-byte HMAC-SHA256)',
      'Deduplication': 'x-razorpay-event-id recorded',
      'Capture Status': 'Authoritative Payment Capture Confirmed',
    },
  },
  {
    id: 'order',
    stepNumber: 8,
    label: '8. Store Order & Inventory Commit',
    identifier: 'ORD-1042',
    timestamp: '18:30:03.150 IST',
    actor: 'ORDER_SERVICE / POSTGRES_LEDGER',
    eventType: 'ORDER_CREATED',
    prevHash: '064fd378192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4',
    currHash: '1750e4892a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5',
    canonicalPayload: {
      inventoryState: 'PAID',
      orderId: 'ORD-1042',
      paymentId: 'pay_Rzp_9812401820',
      totalPaise: 379900,
    },
    details: {
      'Inventory State': 'PAID (Deducted from Stock)',
      'Order Status': 'COMMITTED (ORD-1042)',
      'Signed Checkpoint': 'Anchored: zapai-root-anchor-v1',
      'WhatsApp Receipt': 'Delivered to Customer with 5 Audit IDs',
    },
  },
]

export default function AuditTrailSection() {
  const [isTampered, setIsTampered] = useState<boolean>(false)
  const [tamperedPrice, setTamperedPrice] = useState<string>('2500')
  const [selectedNodeId, setSelectedNodeId] = useState<string>('intent')
  const [copied, setCopied] = useState<boolean>(false)
  const [verifyTimeMs, setVerifyTimeMs] = useState<number | null>(0.32)
  const [showRawJson, setShowRawJson] = useState<boolean>(false)

  // Construct active nodes based on tampering state
  const nodes = useMemo<AuditNode[]>(() => {
    if (!isTampered) return pristineAuditNodes

    return pristineAuditNodes.map((node, idx) => {
      if (idx < 2) {
        // Blocks 1 and 2 are untouched
        return node
      }
      if (idx === 2) {
        // Block 3 is maliciously altered in its payload
        return {
          ...node,
          canonicalPayload: {
            ...node.canonicalPayload,
            settledPricePaise: parseInt(tamperedPrice, 10) * 100,
            tampered: true,
          },
          details: {
            ...node.details,
            'Settled Amount': `₹${tamperedPrice} (TAMPERED - Payload Altered!)`,
          },
          // New hash diverged due to modified canonical payload
          currHash: '8e41bf9012a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
        }
      }
      // Downstream blocks 4..8 have broken previousHash linkage
      return {
        ...node,
        // Their prevHash was expecting old H_n-1, creating broken link
        tamperedCurrHash: 'broken_chain_invalid_link_' + node.id,
      }
    })
  }, [isTampered, tamperedPrice])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0]

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const handleVerify = () => {
    const t0 = performance.now()
    // Simulate real WebCrypto SHA-256 validation sweep
    setTimeout(() => {
      const t1 = performance.now()
      setVerifyTimeMs(Math.max(0.15, +(t1 - t0).toFixed(2)))
    }, 40)
  }

  const handleDownloadReceipt = () => {
    const receipt = {
      version: '1.0',
      chainId: 'chain_wa_tx_9812401',
      transactionId: 'x402_tx_881290a12',
      genesisHash: GENESIS_HASH,
      events: nodes.map((n) => ({
        sequenceId: n.stepNumber,
        eventId: n.identifier,
        eventType: n.eventType,
        actor: n.actor,
        previousHash: n.prevHash,
        currentHash: n.currHash,
        timestamp: n.timestamp,
        canonicalPayload: n.canonicalPayload,
      })),
      finalHash: nodes[nodes.length - 1].currHash,
      checkpoint: {
        sequenceId: nodes.length,
        lastEventId: nodes[nodes.length - 1].identifier,
        chainHeadHash: nodes[nodes.length - 1].currHash,
        totalEvents: nodes.length,
        timestamp: new Date().toISOString(),
        keyId: 'zapai-root-anchor-v1',
        signature: '3f8a9b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
        algorithm: 'Ed25519 / HMAC-SHA256',
      },
      verifiedAt: new Date().toISOString(),
      offlineVerificationSnippet: "node -e 'const c=require(\"crypto\"); /* Canonicalize & hash entries */'",
    }

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zapai-audit-receipt-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section
      id="audit-trail"
      className="py-20 sm:py-28 bg-[#fbfbfd] text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-10"
      >
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tamper-Evident SHA-256 Cryptographic Chain with Signed Checkpoints</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              Every Agent Action Leaves a Trail. <br className="hidden sm:inline" />
              <span className="text-brand-600">Cryptographically Hash-Chained.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal [text-wrap:pretty]">
              Every inbound prompt, mandate creation, negotiation turn, inventory hold, x402 challenge/signature,
              and Razorpay payment capture is chained with RFC 8785 canonical JSON hashing and signed checkpoints.
            </p>
            <div className="font-mono text-xs bg-surface-100/80 p-2.5 rounded-xl border border-surface-200 text-surface-700 space-y-1">
              <div className="text-brand-700 font-semibold">
                H_n = SHA256(H_prev : eventType : actor : payloadHash : timestamp)
              </div>
              <div className="text-surface-500 text-[11px]">
                payloadHash = SHA256(canonicalize_rfc8785(payload)) · Checkpoint signed via Ed25519
              </div>
            </div>
          </div>

          {/* Verification & Tamper Simulation Control Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-3 rounded-2xl border border-surface-200 shrink-0">
            <button
              onClick={() => {
                setIsTampered(false)
                handleVerify()
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer',
                !isTampered
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Integrity</span>
            </button>

            <button
              onClick={() => {
                setIsTampered(true)
                setSelectedNodeId('negotiation')
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer',
                isTampered
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-surface-100 hover:bg-rose-50 hover:text-rose-700 text-surface-700'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Tampering</span>
            </button>

            <button
              onClick={handleDownloadReceipt}
              className="px-3 py-2 rounded-xl text-xs font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer border border-surface-200"
              title="Download Signed Cryptographic Audit Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Receipt (.json)</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={cn(
            'p-4 rounded-2xl border transition-colors duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4',
            !isTampered
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-300 text-rose-950 animate-subtle-pulse'
          )}
        >
          <div className="flex items-center gap-3">
            {!isTampered ? (
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                {!isTampered
                  ? '✓ 8/8 Blocks Cryptographically Intact · Checkpoint Signature Valid'
                  : '❌ Tamper Detected at Block #3 (DEAL_ACCEPTED) — Cryptographic Chain Severed!'}
                <span className="text-[10px] font-mono font-normal opacity-80 px-2 py-0.5 rounded-full bg-black/5">
                  Verified in {verifyTimeMs}ms
                </span>
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                {!isTampered
                  ? 'Deterministic canonical JSON hashing verified. All previousHash pointers and signed anchor match the ledger head.'
                  : 'Adversary altered Block #3 payload (₹3,799 → ₹2,500). Downstream blocks #4 through #8 failed H_prev validation.'}
              </div>
            </div>
          </div>

          {isTampered && (
            <button
              onClick={() => setIsTampered(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-rose-700 border border-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors duration-150 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Untampered Ledger</span>
            </button>
          )}
        </div>

        {/* Animated Horizontal Cryptographic Pipeline Flow */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-surface-800 uppercase tracking-wider">
              <Zap className={cn('w-4 h-4', isTampered ? 'text-rose-600' : 'text-brand-600 animate-subtle-pulse')} />
              <span>Cryptographic Hash Link Pipeline (H_{'{n-1}'} ──► H_{'{n}'})</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-surface-500">
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', isTampered ? 'bg-rose-500 animate-subtle-pulse' : 'bg-emerald-500 animate-subtle-pulse')} />
                {isTampered ? 'Chain Severed at #3' : 'Live Linear Chaining Active'}
              </span>
            </div>
          </div>

          {/* Horizontal Scrollable Flow Graph with Animated SVG Connectors */}
          <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
            <div className="flex items-center min-w-[980px] justify-between relative px-2">
              {nodes.map((node, idx) => {
                const isBroken = isTampered && idx >= 2
                const isOriginOfTamper = isTampered && idx === 2
                const isSelected = selectedNodeId === node.id

                return (
                  <React.Fragment key={node.id}>
                    {/* Node Card */}
                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={cn(
                        'flex flex-col items-center text-center p-3 rounded-2xl border transition-colors duration-150 cursor-pointer select-none w-[105px] shrink-0 group relative',
                        isSelected
                          ? isBroken
                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30'
                            : 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20'
                          : isBroken
                            ? 'bg-rose-50/30 border-rose-200 hover:bg-rose-50 hover:border-rose-300'
                            : 'bg-surface-50/60 border-surface-200 hover:bg-white hover:border-surface-300'
                      )}
                    >
                      {/* Step Badge */}
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold mb-1.5 transition-colors duration-150',
                          isOriginOfTamper
                            ? 'bg-rose-600 text-white animate-subtle-pulse'
                            : isBroken
                              ? 'bg-rose-100 text-rose-700'
                              : isSelected
                                ? 'bg-brand-600 text-white'
                                : 'bg-surface-200 text-surface-700 group-hover:bg-brand-100 group-hover:text-brand-800'
                        )}
                      >
                        {node.stepNumber}
                      </div>

                      {/* Title & Type */}
                      <div className="text-[11px] font-bold text-surface-900 leading-tight truncate w-full">
                        {node.label.replace(/^\d+\.\s*/, '')}
                      </div>
                      <div
                        className={cn(
                          'text-[9px] font-mono font-semibold truncate w-full mt-0.5',
                          isBroken ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {node.eventType}
                      </div>

                      {/* Hash Preview Tag */}
                      <div
                        className={cn(
                          'mt-1.5 px-1.5 py-0.5 rounded font-mono text-[8px] truncate w-full',
                          isBroken
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : 'bg-surface-200/70 text-surface-600 group-hover:bg-surface-300'
                        )}
                      >
                        {node.currHash.slice(0, 8)}...
                      </div>
                    </div>

                    {/* Animated Connector Arrow between Nodes */}
                    {idx < nodes.length - 1 && (
                      <div className="flex-1 flex flex-col items-center justify-center px-1 min-w-[28px] shrink-0">
                        {isTampered && idx === 1 ? (
                          /* Severed Link Animation */
                          <div className="flex flex-col items-center gap-0.5 animate-subtle-pulse">
                            <span className="text-[9px] font-mono font-extrabold text-rose-600 bg-rose-100 px-1 py-0.2 rounded border border-rose-300">
                              SEVERED
                            </span>
                            <svg className="w-full h-3 text-rose-500" viewBox="0 0 40 12" fill="none">
                              <path
                                d="M0 6 L14 6 L18 1 L22 11 L26 6 L40 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="3 3"
                              />
                            </svg>
                          </div>
                        ) : (
                          /* Healthy Animated Flow Connector */
                          <div className="w-full flex items-center justify-center relative">
                            <svg
                              className={cn(
                                'w-full h-3 transition-colors',
                                isTampered && idx >= 2 ? 'text-rose-300' : 'text-brand-400'
                              )}
                              viewBox="0 0 40 8"
                              fill="none"
                            >
                              <line
                                x1="0"
                                y1="4"
                                x2="34"
                                y2="4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeDasharray={isTampered && idx >= 2 ? '2 2' : '4 4'}
                                className={cn(!isTampered || idx < 2 ? 'animate-flow-dash' : '')}
                              />
                              <polygon
                                points="34,1 40,4 34,7"
                                fill={isTampered && idx >= 2 ? '#f43f5e' : '#2563eb'}
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Deep Block Inspector Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-bold border',
                    isTampered && selectedNode.stepNumber >= 3
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-brand-50 text-brand-700 border-brand-200'
                  )}
                >
                  {selectedNode.eventType}
                </span>
                <span className="text-xs text-surface-500 font-mono">{selectedNode.timestamp}</span>
                <span className="text-xs text-surface-400 font-mono">• Actor: {selectedNode.actor}</span>
              </div>
              <h3 className="text-lg font-bold text-surface-900">{selectedNode.label}</h3>
            </div>

            {/* Actions: Copy ID & Toggle JSON */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-mono text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showRawJson ? 'Hide Canonical JSON' : 'View Canonical JSON'}</span>
              </button>

              <div className="flex items-center gap-2 bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-mono">
                <span className="text-surface-500 truncate max-w-[200px]">{selectedNode.identifier}</span>
                <button
                  onClick={() => copyId(selectedNode.identifier)}
                  className="text-surface-400 hover:text-surface-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Raw Canonical JSON View (Expandable) */}
          {showRawJson && (
            <div className="p-4 rounded-2xl bg-surface-900 text-emerald-400 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-surface-400 text-[10px] border-b border-surface-800 pb-2">
                <span>RFC 8785 Canonical JSON Payload (Deterministically Sorted)</span>
                <span>SHA-256 Hashed Input</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedNode.canonicalPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* 4-Stage Cryptographic Hashing Dataflow Diagram */}
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="text-[11px] font-bold text-surface-700 uppercase tracking-wider flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-brand-600" />
              <span>4-Stage Deterministic Hashing Pipeline for Block #{selectedNode.stepNumber}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs font-mono">
              {/* Stage 1 */}
              <div className="p-3 rounded-xl bg-white border border-surface-200 space-y-1">
                <div className="text-[10px] text-surface-400 font-bold uppercase">1. Canonical JSON</div>
                <div className="text-surface-800 text-[11px] truncate">RFC 8785 Sorted Keys</div>
                <div className="text-[10px] text-emerald-600 font-semibold">✓ Deterministic Input</div>
              </div>

              {/* Stage 2 */}
              <div className="p-3 rounded-xl bg-white border border-surface-200 space-y-1">
                <div className="text-[10px] text-surface-400 font-bold uppercase">2. Payload Hash</div>
                <div className="text-surface-800 text-[11px] truncate">SHA256(canonicalPayload)</div>
                <div className="text-[10px] text-brand-600 font-semibold">
                  {selectedNode.currHash.slice(0, 10)}...
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-3 rounded-xl bg-white border border-surface-200 space-y-1">
                <div className="text-[10px] text-surface-400 font-bold uppercase">3. Header Chaining</div>
                <div className="text-surface-800 text-[11px] truncate">H_{selectedNode.stepNumber - 1} + Metadata</div>
                <div className="text-[10px] text-amber-600 font-semibold">
                  {selectedNode.prevHash.slice(0, 10)}...
                </div>
              </div>

              {/* Stage 4 */}
              <div className="p-3 rounded-xl bg-white border border-surface-200 space-y-1">
                <div className="text-[10px] text-surface-400 font-bold uppercase">4. Block Hash H_{selectedNode.stepNumber}</div>
                <div className="text-surface-800 text-[11px] truncate">SHA256(H_{selectedNode.stepNumber - 1} + ...)</div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  {selectedNode.currHash.slice(0, 10)}...
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Linkage Block */}
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] p-4 rounded-2xl border',
              isTampered && selectedNode.stepNumber >= 3
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-surface-50 border-black/[0.08]'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-surface-500 text-[10px] uppercase tracking-wider font-semibold">
                  PREVIOUS BLOCK HASH (H_{selectedNode.stepNumber - 1}):
                </span>
                {isTampered && selectedNode.stepNumber > 3 && (
                  <span className="text-rose-600 text-[10px] font-bold">❌ MISMATCH WITH H_{selectedNode.stepNumber - 1}</span>
                )}
              </div>
              <div
                className={cn(
                  'break-all font-medium',
                  isTampered && selectedNode.stepNumber > 3 ? 'text-rose-700' : 'text-amber-700'
                )}
              >
                {selectedNode.prevHash}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-surface-500 text-[10px] uppercase tracking-wider font-semibold">
                  CURRENT BLOCK HASH (H_{selectedNode.stepNumber}):
                </span>
                {isTampered && selectedNode.stepNumber === 3 && (
                  <span className="text-rose-600 text-[10px] font-bold">❌ DIVERGED HASH (PAYLOAD MUTATED)</span>
                )}
              </div>
              <div
                className={cn(
                  'break-all font-medium',
                  isTampered && selectedNode.stepNumber >= 3 ? 'text-rose-700' : 'text-emerald-700'
                )}
              >
                {selectedNode.currHash}
              </div>
            </div>
          </div>

          {/* Key-Value Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <div
                key={k}
                className={cn(
                  'p-3.5 rounded-xl border space-y-1',
                  v.includes('TAMPERED')
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-surface-50 border-surface-200 text-surface-800'
                )}
              >
                <div className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">{k}</div>
                <div className="text-xs font-bold">{v}</div>
              </div>
            ))}
          </div>

          {/* Signed Checkpoint Trust Anchor Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-50 to-brand-50/40 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-surface-900 flex items-center gap-2">
                  <span>External Trust Anchor: Signed Checkpoint</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 font-semibold">
                    Ed25519 Key ID: zapai-root-anchor-v1
                  </span>
                </div>
                <div className="text-surface-600 text-[11px]">
                  Anchors chain head <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-surface-200">H_8 = 1750e489...</code> preventing database rewrite attacks.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 font-semibold">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Signed Checkpoint Valid</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

