'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Blog1 from '@/components/ui/blog-1'

const flowSteps = [
  {
    date: 'STAGE 01 — UNIFIED CATALOG REPOSITORY',
    title:
      'Ingest your native product catalog or connect Shopify with one click. Automatic variant sync and granular SKU floor price guardrails.',
    author: {
      name: '01',
      role: 'Catalog & Inventory Spine',
    },
  },
  {
    date: 'STAGE 02 — MARGIN MANDATES & AI SELLER',
    title:
      'Gemini 2.5 Flash detects buyer intent, queries inventory, and negotiates within your strict margin floors while temporarily locking units.',
    author: {
      name: '02',
      role: 'Autonomous Margin Protection',
    },
  },
  {
    date: 'STAGE 03 — WHATSAPP COMMERCE & RAZORPAY SETTLEMENT',
    title:
      'Issues authenticated Razorpay Payment Links directly in WhatsApp chat. HMAC verified webhooks confirm payments and fulfill orders.',
    author: {
      name: '03',
      role: 'Conversational Settlement Rails',
    },
  },
]

interface TrailTile {
  key: string
  col: number
  row: number
  timestamp: number
}

export default function FlowSection() {
  const [trail, setTrail] = useState<TrailTile[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const lastClientPos = useRef<{ clientX: number; clientY: number } | null>(null)
  const rafId = useRef<number | null>(null)

  const updateTileFromClientPos = (clientX: number, clientY: number) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()

    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const x = clientX - rect.left
      const y = clientY - rect.top

      const GRID_SIZE = 50
      const col = Math.floor(x / GRID_SIZE)
      const row = Math.floor(y / GRID_SIZE)

      if (x >= 0 && y >= 0) {
        const key = `${col}-${row}`
        const now = Date.now()

        setTrail((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].key === key) {
            return prev.map((item, idx) =>
              idx === prev.length - 1 ? { ...item, timestamp: now } : item
            )
          }
          const updated = [
            ...prev.filter((item) => item.key !== key),
            { key, col, row, timestamp: now },
          ]
          return updated.slice(-6)
        })
        setIsHovered(true)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    lastClientPos.current = { clientX: e.clientX, clientY: e.clientY }
    if (rafId.current !== null) return
    rafId.current = requestAnimationFrame(() => {
      if (lastClientPos.current) {
        updateTileFromClientPos(lastClientPos.current.clientX, lastClientPos.current.clientY)
      }
      rafId.current = null
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      if (lastClientPos.current && rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          if (lastClientPos.current) {
            updateTileFromClientPos(
              lastClientPos.current.clientX,
              lastClientPos.current.clientY
            )
          }
          rafId.current = null
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  useEffect(() => {
    if (trail.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      setTrail((prev) => prev.filter((item) => now - item.timestamp < 600))
    }, 150)

    return () => clearInterval(interval)
  }, [trail])

  return (
    <section
      ref={sectionRef}
      id="flow-intro"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        lastClientPos.current = null
        setTimeout(() => setTrail([]), 450)
      }}
      className="relative bg-white overflow-hidden py-16 sm:py-20 border-t border-[#e4e4e7]"
    >
      {/* 50px Precision Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:50px_50px] opacity-80 pointer-events-none" />

      {/* 3D Popping Grid Squares with Trail Decay */}
      <AnimatePresence>
        {isHovered &&
          trail.map((tile, i) => {
            const ageIndex = trail.length - 1 - i
            const yLift = -4.5 + ageIndex * 1.0
            const xOffset = -1.8 + ageIndex * 0.4
            const opacity = Math.max(0.12, 1 - ageIndex * 0.16)
            const shadowOffset = Math.max(1, Math.round(4.5 - ageIndex * 0.8))
            const shadowAlpha = Math.max(0.15, 0.95 - ageIndex * 0.16)

            return (
              <motion.div
                key={tile.key}
                initial={{ scale: 0.92, opacity: 0, y: 0, x: 0 }}
                animate={{
                  scale: 1.03 - ageIndex * 0.012,
                  opacity,
                  y: yLift,
                  x: xOffset,
                }}
                exit={{ scale: 0.88, opacity: 0, y: 0, x: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  left: `${tile.col * 50}px`,
                  top: `${tile.row * 50}px`,
                }}
                className="absolute w-[50px] h-[50px] bg-white border border-[#09090b] rounded-none pointer-events-none z-10 flex items-center justify-center"
              >
                <div
                  className={`w-full h-full rounded-none border-t border-l border-white border-r border-b border-[#09090b]/10 transition-colors duration-200 ${
                    ageIndex === 0
                      ? 'bg-gradient-to-br from-white via-[#f8fafc] to-[#eff6ff]'
                      : 'bg-gradient-to-br from-white via-[#fcfcfd] to-[#f4f4f5]'
                  }`}
                  style={{
                    boxShadow: `${shadowOffset}px ${shadowOffset}px 0px rgba(9,9,11,${shadowAlpha})`,
                  }}
                />
              </motion.div>
            )
          })}
      </AnimatePresence>

      <div className="relative z-10">
        <Blog1
          className="mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 bg-transparent text-[#09090b]"
          header={{
            heading: 'Built for how modern commerce actually happens',
            description:
              'From unified catalog ingestion to automated WhatsApp negotiations and instant Razorpay UPI checkouts, every stage connects deterministically.',
            ctaText: 'Launch Your AI Store',
            ctaHref: '/onboarding',
          }}
          posts={flowSteps}
        />
      </div>
    </section>
  )
}
