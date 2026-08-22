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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditNode {
  id: string
  label: string
  identifier: string
  timestamp: string
  entity: string
  details: {
    [key: string]: string
  }
}

const auditNodes: AuditNode[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Message ID',
    identifier: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgWM0I...',
    timestamp: '10:42:01 AM IST',
    entity: 'Consumer Intent Prompt',
    details: {
      'Sender': '+91 98765 43210 (Verified)',
      'Prompt': 'Find running shoes under ₹4,000 UK 9',
      'Channel': 'WhatsApp Cloud API BSP',
      'Status': 'Delivered & Decrypted',
    },
  },
  {
    id: 'conversation',
    label: 'Conversation ID',
    identifier: 'conv_a2a_89218042a901',
    timestamp: '10:42:02 AM IST',
    entity: 'A2A Negotiation Session',
    details: {
      'Buyer Agent': 'agent_buyer_01 (Mandate: ₹4,000)',
      'Seller Agent': 'seller_runfast_bengaluru',
      'Multi-Turn Bids': '₹3,700 → ₹3,799 (Agreed)',
      'Margin Check': 'Floor ₹3,600 Verified OK',
    },
  },
  {
    id: 'x402',
    label: 'x402 Transaction ID',
    identifier: 'x402_tx_49182049102c89',
    timestamp: '10:42:03 AM IST',
    entity: 'Agent Payment Challenge',
    details: {
      'Protocol': 'HTTP 402 Payment Required',
      'Locked SKU': 'NK-PEG-40 (Redis TTL 120s)',
      'Amount': '3799.00 INR',
      'Challenge Hash': '0x8f2a910c2834b9e1',
    },
  },
  {
    id: 'razorpay',
    label: 'Razorpay Payment ID',
    identifier: 'pay_Rzp198203491204',
    timestamp: '10:42:15 AM IST',
    entity: 'Payment Captured Webhook',
    details: {
      'Order ID': 'order_Rzp_9812401',
      'Payment Method': 'UPI (Google Pay)',
      'Webhook Signature': 'HMAC-SHA256 (Verified)',
      'Bank Auth Code': 'HDFC_UPI_98218042',
    },
  },
  {
    id: 'shopify',
    label: 'Shopify Order ID',
    identifier: 'ORD-1042 (gid://shopify/Order/8921)',
    timestamp: '10:42:16 AM IST',
    entity: 'Merchant Fulfillment',
    details: {
      'Merchant Store': 'RunFast Sports Bengaluru',
      'Inventory State': 'COMMITTED (1 Unit Deducted)',
      'Payout Window': 'Instant T+0 INR Settlement',
      'Fulfillment Status': 'Dispatched to Warehouse',
    },
  },
]

export default function AuditTrailSection() {
  const [selectedNode, setSelectedNode] = useState<AuditNode>(auditNodes[2])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 1500)
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
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              Every agent action <br />
              <span className="text-brand-600">leaves a trail.</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
              When autonomous agents make financial commitments, trust requires cryptographic traceability.
              A 5-point linked identifier set connects the buyer message directly to the final bank settlement.
            </p>
          </div>
        </div>

        {/* 5-Link Chain Strip */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-mono text-surface-500 pb-2 border-b border-black/[0.06]">
            <span className="flex items-center gap-2 text-surface-900 font-bold">
              <LinkIcon className="w-3.5 h-3.5 text-brand-600" />
              5-Field Linked Identifier Chain
            </span>
            <span>Click any node to inspect payload</span>
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {auditNodes.map((node, idx) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={cn(
                  'p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2',
                  selectedNode.id === node.id
                    ? 'bg-blue-50/60 border-brand-500 shadow-xs'
                    : 'bg-surface-50 border-black/[0.06] hover:border-black/[0.12]'
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-surface-400">0{idx + 1}</span>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    selectedNode.id === node.id ? 'bg-brand-600' : 'bg-surface-300'
                  )} />
                </div>

                <div>
                  <h4 className="font-bold text-xs sm:text-[13px] text-surface-900 font-sans truncate">
                    {node.label}
                  </h4>
                  <p className="font-mono text-[10.5px] text-surface-500 truncate mt-0.5">
                    {node.identifier}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-brand-700 block font-medium">
                  {node.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Payload Inspector Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] text-white border border-black/[0.1] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-sm">
          {/* Left: Selected Node Overview */}
          <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-mono text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedNode.entity}</span>
            </div>

            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
              {selectedNode.label}
            </h3>

            {/* Identifier with Copy Button */}
            <div className="p-3 bg-black/50 rounded-xl border border-white/10 flex items-center justify-between gap-2 font-mono text-xs text-brand-300">
              <span className="truncate">{selectedNode.identifier}</span>
              <button
                onClick={() => handleCopy(selectedNode.identifier)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer shrink-0"
                title="Copy Identifier"
              >
                {copiedId === selectedNode.identifier ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans font-normal">
              Recorded immutably in the AgentBridge append-only audit ledger with SHA-256 checksum chaining.
            </p>
          </div>

          {/* Right: Key-Value Payload Field Breakdown */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(selectedNode.details).map(([key, value]) => (
              <div
                key={key}
                className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-1 font-mono"
              >
                <span className="text-[10px] text-slate-400 block uppercase">
                  {key}
                </span>
                <p className="text-xs text-slate-200 font-semibold truncate font-sans">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
