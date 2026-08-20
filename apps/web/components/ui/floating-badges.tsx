'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import {
  Store,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react'

interface FloatingBadge {
  id: number
  label: string
  icon: React.ReactNode
}

interface FloatingBadgesProps {
  badges?: FloatingBadge[]
  position?: 'left' | 'right'
  variant?: 'light' | 'dark'
  radius?: number
  className?: string
}

const commerceBadges: FloatingBadge[] = [
  { id: 1, label: 'WhatsApp Cloud API', icon: <Smartphone className="h-4 w-4" /> },
  { id: 2, label: 'Razorpay Payment Links', icon: <CreditCard className="h-4 w-4" /> },
  { id: 3, label: 'Native Catalog Engine', icon: <Store className="h-4 w-4" /> },
  { id: 4, label: 'Shopify Admin Sync', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 5, label: 'Floor Price Mandates', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 6, label: 'Real-Time Stock Locks', icon: <Lock className="h-4 w-4" /> },
  { id: 7, label: 'HMAC Webhook Gateway', icon: <Zap className="h-4 w-4" /> },
  { id: 8, label: 'Merchant Telemetry', icon: <Layers className="h-4 w-4" /> },
  { id: 9, label: 'Gemini Intent AI', icon: <Sparkles className="h-4 w-4" /> },
]

export function FloatingBadges({
  badges = commerceBadges,
  position = 'right',
  variant = 'light',
  radius = 240,
  className,
}: FloatingBadgesProps) {
  const totalBadges = badges.length

  return (
    <div
      className={cn(
        'absolute top-0 bottom-0 pointer-events-none hidden lg:block z-0',
        position === 'right' ? 'right-0 w-[900px]' : 'left-0 w-[900px]',
        className
      )}
    >
      <div
        className="absolute"
        style={{
          width: radius * 2,
          height: radius * 2,
          top: '50%',
          right: position === 'right' ? 170 : 'auto',
          left: position === 'left' ? 170 : 'auto',
          marginTop: -radius,
        }}
      >
        {/* Orbit Ring Trail */}
        <div
          className="absolute inset-0 rounded-full border border-dashed border-gray-300/60 pointer-events-none"
          style={{ transform: 'scale(1)' }}
        />

        {/* Center Axis: AgentBridge Brand Mark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute w-32 h-32 rounded-full border border-dashed border-gray-300/60" />
          <div className="absolute w-22 h-22 rounded-full border border-[#195adc]/25" />
          <div className="absolute w-16 h-16 rounded-full bg-[#195adc]/10 blur-md" />

          <div className="relative flex items-center justify-center p-3.5 rounded-full border border-[#e4e4e7] bg-white/95 shadow-md shadow-[#195adc]/10">
            <div className="w-8 h-8 rounded-lg bg-[#195adc] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
          </div>
        </div>

        {/* Orbit animation */}
        <div
          className="absolute inset-0 animate-orbit-slow"
          style={{ transformOrigin: 'center center' }}
        >
          {badges.map((badge, index) => {
            const baseAngle = (360 / totalBadges) * index - 90
            const angleRad = (baseAngle * Math.PI) / 180

            const x = radius + radius * Math.cos(angleRad)
            const y = radius + radius * Math.sin(angleRad)

            return (
              <div key={badge.id} className="absolute" style={{ left: x, top: y }}>
                <div style={{ transform: 'translate(-50%, -50%)' }}>
                  <div
                    className="animate-counter-rotate"
                    style={{ transformOrigin: 'center center' }}
                  >
                    <BadgeItem badge={badge} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BadgeItem({ badge }: { badge: FloatingBadge }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border border-[#e4e4e7] bg-white/95 text-[#09090b] shadow-xs backdrop-blur-md select-none">
      <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 bg-blue-50 text-[#195adc] border border-blue-100 shadow-2xs">
        {badge.icon}
      </div>
      <span className="text-[11.5px] font-medium tracking-tight whitespace-nowrap leading-none">
        {badge.label}
      </span>
    </div>
  )
}

export { commerceBadges, commerceBadges as ecosystemBadges, commerceBadges as filmBadges }
export type { FloatingBadge }
