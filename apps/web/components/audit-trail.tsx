'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Fingerprint,
  Link as LinkIcon,
  Copy,
  Check,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditNode {
  id: string
  label: string
  identifier: string
  timestamp: string
  entity: string
  eventType: string
  prevHash: string
  currHash: string
  details: {
    [key: string]: string
  }
}

const auditNodes: AuditNode[] = [
  {
    id: 'intent',
    label: '1. WhatsApp Inbound Intent',
    identifier: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgWM0I...',
    timestamp: '18:30:00.102 IST',
    entity: 'Consumer Intent Prompt',
    eventType: 'INTENT_RECEIVED',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currHash: 'a81f9b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
    details: {
      'Sender': '+91 98765 43210 (Verified)',
      'Prompt': 'Find running shoes under ₹4,000 UK 9',
      'Mandate Limit': '₹4,000 (paise: 400000)',
      'Status': 'Parsed & Dispatched',
    },
  },
  {
    id: 'negotiation',
    label: '2. A2A Deal Negotiation',
    identifier: 'conv_a2a_89218042a901',
    timestamp: '18:30:01.450 IST',
    entity: 'Structured A2A Bidding',
    eventType: 'DEAL_ACCEPTED',
    prevHash: 'a81f9b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
    currHash: 'b920ac4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
    details: {
      'Buyer Agent': 'agent_buyer_101',
      'Seller Agent': 'seller_runfast_bengaluru',
      'Turns': 'OFFER (₹3,999) ──► COUNTER (₹3,799 + free shipping) ──► ACCEPT',
      'Settled Amount': '₹3,799 (Agreed within budget)',
    },
  },
  {
    id: 'lock',
    label: '3. Atomic Inventory Reservation',
    identifier: 'res_77a9812bf0912',
    timestamp: '18:30:01.820 IST',
    entity: 'Redis Concurrency Lock',
    eventType: 'INVENTORY_RESERVED',
    prevHash: 'b920ac4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
    currHash: 'c031bd5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a',
    details: {
      'Redis Lock Key': 'lock:inventory:runfast:SKU-SHOE-001',
      'TTL Window': '120 seconds',
      'Postgres State': 'RESERVED (quantity: 1)',
      'Concurrency Defense': 'SET NX EX 120 (Zero Double-Selling)',
    },
  },
  {
    id: 'x402',
    label: '4. x402 V2 Mandate Authorization',
    identifier: 'zap_pay_89123c8901',
    timestamp: '18:30:02.110 IST',
    entity: 'x402 Protocol Signature',
    eventType: 'PAYMENT_AUTHORIZED',
    prevHash: 'c031bd5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a',
    currHash: 'd142ce6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b',
    details: {
      'Scheme / Network': 'exact / zapai-inr',
      'Facilitator': 'ZapAI Facilitator (/x402/verify)',
      'Zero-Trust Checks': 'Signature OK ∧ Nonce Fresh ∧ Amount <= Limit',
      'Nonce': 'n_98a7fbc3 (Single-use consumed)',
    },
  },
  {
    id: 'razorpay',
    label: '5. Razorpay Instant Settlement',
    identifier: 'pay_Rzp_9812401820',
    timestamp: '18:30:02.940 IST',
    entity: 'Financial Settlement & Webhook',
    eventType: 'PAYMENT_CAPTURED',
    prevHash: 'd142ce6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b',
    currHash: 'e253df708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c',
    details: {
      'Razorpay Order': 'order_Rzp_9812401',
      'Webhook Event': 'payment.captured (HMAC-SHA256 Verified)',
      'Deduplication': 'x-razorpay-event-id recorded',
      'Settlement Rail': 'Autonomous Facilitator (T+0 Instant INR)',
    },
  },
  {
    id: 'order',
    label: '6. Store Order & Inventory Commit',
    identifier: 'ORD-1042',
    timestamp: '18:30:03.150 IST',
    entity: 'Postgres Committed State',
    eventType: 'ORDER_CREATED',
    prevHash: 'e253df708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c',
    currHash: 'f364e08192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
    details: {
      'Inventory State': 'PAID (Deducted from Stock)',
      'Merchant Bank Credit': '₹3,799.00 Settled',
      'Audit Hash Chain': 'Verified Untampered (6/6 Blocks Intact)',
      'WhatsApp Receipt': 'Delivered to Customer with 5 Audit IDs',
    },
  },
]

export default function AuditTrailSection() {
  const [selectedNode, setSelectedNode] = useState<AuditNode>(auditNodes[0])
  const [copied, setCopied] = useState<boolean>(false)

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section
      id="audit-trail"
      className="py-20 sm:py-28 bg-[#fbfbfd] text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tamper-Evident SHA-256 Cryptographic Chain</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              Every Agent Action Leaves a Trail. <br />
              <span className="text-brand-600">Cryptographically Hash-Chained.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
              Every negotiation turn, inventory hold, x402 signature, and Razorpay payment ID is chained together.
              Formula: <code className="font-mono text-xs bg-surface-100 px-1.5 py-0.5 rounded text-brand-700">H_n = SHA256(H_prev + eventType + payloadHash + timestamp)</code>.
            </p>
          </div>
        </div>

        {/* Audit Chain Node Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {auditNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={cn(
                'p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 select-none',
                selectedNode.id === node.id
                  ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500/20'
                  : 'bg-white/60 border-surface-200 hover:bg-white hover:border-surface-300'
              )}
            >
              <div className="flex items-center justify-between text-[10px] text-surface-400 font-mono">
                <span>{node.timestamp}</span>
                <Hash className="w-3 h-3 text-brand-500" />
              </div>
              <div className="text-xs font-bold text-surface-900 truncate">{node.label}</div>
              <div className="text-[10px] font-mono text-emerald-600 font-semibold truncate">
                {node.eventType}
              </div>
            </div>
          ))}
        </div>

        {/* Deep Block Inspector Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
                  {selectedNode.eventType}
                </span>
                <span className="text-xs text-surface-500 font-mono">{selectedNode.timestamp}</span>
              </div>
              <h3 className="text-lg font-bold text-surface-900">{selectedNode.label}</h3>
            </div>

            {/* Copy Identifier */}
            <div className="flex items-center gap-2 bg-surface-50 px-3.5 py-2 rounded-xl border border-surface-200 text-xs font-mono">
              <span className="text-surface-500 truncate max-w-[220px]">{selectedNode.identifier}</span>
              <button
                onClick={() => copyId(selectedNode.identifier)}
                className="text-surface-400 hover:text-surface-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Cryptographic Linkage Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] bg-surface-900 text-surface-200 p-4 rounded-2xl">
            <div className="space-y-1">
              <span className="text-surface-500 text-[10px] uppercase tracking-wider block">PREVIOUS BLOCK HASH (H_n-1):</span>
              <div className="break-all text-amber-400">{selectedNode.prevHash}</div>
            </div>
            <div className="space-y-1">
              <span className="text-surface-500 text-[10px] uppercase tracking-wider block">CURRENT BLOCK HASH (H_n):</span>
              <div className="break-all text-emerald-400">{selectedNode.currHash}</div>
            </div>
          </div>

          {/* Key-Value Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <div key={k} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
                <div className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">{k}</div>
                <div className="text-xs font-bold text-surface-800">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
