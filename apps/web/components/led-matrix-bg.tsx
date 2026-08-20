'use client'

import React, { useEffect, useRef } from 'react'
import { MotionValue } from 'framer-motion'

interface LedMatrixBgProps {
  /** Size of each square/circle dot in pixels */
  size?: number
  /** Gap between dots in pixels */
  gap?: number
  /** Shape type: 'Square' or 'Circle' */
  shapeType?: 'Square' | 'Circle'
  /** Base primary accent color for active LEDs */
  primaryColor?: string
  /** Secondary subtle color for inactive LEDs */
  secondaryColor?: string
  /** Base probability percentage of LEDs being lit (0 - 100) */
  probability?: number
  /** Animation speed multiplier (1 - 100) */
  animSpeed?: number
  /** Real-time scroll velocity MotionValue from framer-motion */
  scrollVelocity?: MotionValue<number>
  /** Real-time scroll Y progress MotionValue from framer-motion */
  scrollYProgress?: MotionValue<number>
  /** Additional CSS className */
  className?: string
  /** Corner radius for square shape container if any */
  radius?: number
  /** Interactive mouse repulsion physics enabled */
  interactive?: boolean
}

interface LedNode {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  dx: number
  dy: number
  color: string
  isAccent: boolean
  startTime: number
  delay: number
  duration: number
  glow: number // 0 to 1
  radius: number
}

export default function LedMatrixBg({
  size = 7,
  gap = 14,
  shapeType = 'Square',
  primaryColor = '#195adc',
  secondaryColor = 'rgba(228, 228, 231, 0.45)',
  probability = 4,
  animSpeed = 80,
  scrollVelocity,
  scrollYProgress,
  className = '',
  radius = 0,
  interactive = true,
}: LedMatrixBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  })

  // Extract valid RGB / HEX / RGBA string fallback
  const parseColor = (str: string, fallback: string) => {
    if (!str) return fallback
    return str
  }

  const accentColor = parseColor(primaryColor, '#195adc')
  const inactiveColor = parseColor(secondaryColor, 'rgba(228, 228, 231, 0.45)')

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isVisible = false
    let nodes: LedNode[] = []
    let smoothVel = 0
    let width = 0
    let height = 0
    let dpr = 1

    const getIsAccent = (prob: number) => {
      return Math.random() * 100 < prob
    }

    const initNodes = (w: number, h: number) => {
      const newNodes: LedNode[] = []
      const step = size + gap
      const cols = Math.ceil(w / step) + 1
      const rows = Math.ceil(h / step) + 1

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * step
          const by = r * step
          const isAcc = getIsAccent(probability)
          const delay = Math.random() * (-99.9 * animSpeed + 10099.9)
          const duration = Math.random() * (-99.9 * animSpeed + 10099.9)

          newNodes.push({
            x: bx,
            y: by,
            baseX: bx,
            baseY: by,
            vx: 0,
            vy: 0,
            dx: 0,
            dy: 0,
            color: isAcc ? accentColor : inactiveColor,
            isAccent: isAcc,
            startTime: performance.now() + Math.random() * 3000,
            delay,
            duration,
            glow: isAcc ? 1 : 0,
            radius: size / 2,
          })
        }
      }
      return newNodes
    }

    const updateCanvasDimensions = () => {
      if (!container || !canvas) return
      dpr = window.devicePixelRatio || 1
      width = container.offsetWidth
      height = container.offsetHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.scale(dpr, dpr)
      nodes = initNodes(width, height)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      }
    }

    const handlePointerLeave = () => {
      mouseRef.current.active = false
    }

    if (interactive && container) {
      container.addEventListener('pointermove', handlePointerMove)
      container.addEventListener('pointerleave', handlePointerLeave)
    }

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions()
    })
    resizeObserver.observe(container)

    let lastTime = performance.now()
    let accumulatedScroll = 0

    const render = (currentTime: number) => {
      const dt = Math.min(32, currentTime - lastTime) / 1000
      lastTime = currentTime

      // 1. Fetch real-time scroll velocity & progress
      const rawVel = scrollVelocity ? scrollVelocity.get() : 0
      const progress = scrollYProgress ? scrollYProgress.get() : 0
      
      // Smooth out velocity with critical damping
      smoothVel += (rawVel - smoothVel) * 0.12

      // Kinetic probability surge during fast scrolling
      const velMag = Math.abs(smoothVel)
      const dynamicProb = Math.min(45, probability + velMag * 0.015)

      // Accumulate smooth velocity drift for standalone or combined scrolling
      accumulatedScroll += smoothVel * 0.03 * dt

      // Total vertical scroll translation: as user scrolls down (progress increases), LEDs move UP
      const step = size + gap
      const totalGridHeight = Math.max(step * 2, Math.ceil(height / step) * step)
      const scrollOffset = progress * (height * 3.2) + accumulatedScroll

      // 2. Clear canvas with high quality
      ctx.clearRect(0, 0, width, height)

      // Mouse position
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const mActive = mouseRef.current.active

      // Center of section for wave calculations
      const centerY = height / 2

      // 3. Update nodes and collect render data
      const nodeCount = nodes.length

      // Batched rendering: separate arrays for normal and glow nodes to minimize
      // context state switches (save/restore + shadow are expensive per-node).
      const normalAccentX: number[] = []
      const normalAccentY: number[] = []
      const normalInactiveX: number[] = []
      const normalInactiveY: number[] = []
      const glowX: number[] = []
      const glowY: number[] = []
      const glowAlpha: number[] = []

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i]

        // Continuous Upward Translation with seamless modulo wrapping
        let shiftedY = (node.baseY - scrollOffset) % totalGridHeight
        if (shiftedY < 0) shiftedY += totalGridHeight

        // --- Led Flicker / State Cycle ---
        const timeElapsed = currentTime - node.startTime
        if (timeElapsed > node.delay + node.duration) {
          node.startTime = currentTime + node.delay
          node.isAccent = getIsAccent(dynamicProb)
          node.color = node.isAccent ? accentColor : inactiveColor
        }

        // Smooth glow interpolator
        const targetGlow = node.isAccent ? 1 : 0
        node.glow += (targetGlow - node.glow) * 0.1

        // --- Physics 1: Scroll Inertia Drag & Spring Recovery ---
        const distFromCenterRatio = 1 - Math.min(1, Math.abs(shiftedY - centerY) / centerY)
        const waveOffset = Math.sin(shiftedY * 0.015 + currentTime * 0.003) * 3

        const targetDy = -smoothVel * 0.02 * (0.6 + distFromCenterRatio * 0.4) + waveOffset
        const springForceY = (targetDy - node.dy) * 22
        const dampingY = node.vy * 8
        node.vy += (springForceY - dampingY) * dt
        node.dy += node.vy * dt

        // Horizontal micro spring recoil
        const targetDx = Math.cos(shiftedY * 0.02 + currentTime * 0.002) * (velMag * 0.004)
        const springForceX = (targetDx - node.dx) * 18
        const dampingX = node.vx * 6
        node.vx += (springForceX - dampingX) * dt
        node.dx += node.vx * dt

        // --- Physics 2: Mouse Repulsion Physics ---
        let mousePushX = 0
        let mousePushY = 0

        if (mActive) {
          const currentX = node.baseX + node.dx
          const currentY = shiftedY + node.dy
          const dxMouse = currentX - mx
          const dyMouse = currentY - my
          const distSq = dxMouse * dxMouse + dyMouse * dyMouse
          const maxDist = 130
          const maxDistSq = maxDist * maxDist

          if (distSq < maxDistSq && distSq > 0) {
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / maxDist) * 18
            mousePushX = (dxMouse / dist) * force
            mousePushY = (dyMouse / dist) * force

            if (dist < 60 && Math.random() < 0.2) {
              node.isAccent = true
              node.glow = 1
            }
          }
        }

        const renderX = node.baseX + node.dx + mousePushX
        const renderY = shiftedY + node.dy + mousePushY

        // Route to the appropriate batch
        if (node.glow > 0.05 && (velMag > 200 || node.isAccent)) {
          glowX.push(renderX)
          glowY.push(renderY)
          glowAlpha.push(Math.min(1, 0.4 + node.glow * 0.6))
        } else if (node.isAccent) {
          normalAccentX.push(renderX)
          normalAccentY.push(renderY)
        } else {
          normalInactiveX.push(renderX)
          normalInactiveY.push(renderY)
        }
      }

      // --- Batched draw pass 1: inactive nodes ---
      ctx.fillStyle = inactiveColor
      ctx.globalAlpha = 0.45
      for (let i = 0; i < normalInactiveX.length; i++) {
        if (shapeType === 'Square') {
          ctx.fillRect(normalInactiveX[i], normalInactiveY[i], size, size)
        } else {
          ctx.beginPath()
          ctx.arc(normalInactiveX[i] + size / 2, normalInactiveY[i] + size / 2, size / 2, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // --- Batched draw pass 2: accent (no glow) nodes ---
      ctx.fillStyle = accentColor
      ctx.globalAlpha = 0.85
      for (let i = 0; i < normalAccentX.length; i++) {
        if (shapeType === 'Square') {
          ctx.fillRect(normalAccentX[i], normalAccentY[i], size, size)
        } else {
          ctx.beginPath()
          ctx.arc(normalAccentX[i] + size / 2, normalAccentY[i] + size / 2, size / 2, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // --- Batched draw pass 3: glow nodes (single save/restore for the whole batch) ---
      if (glowX.length > 0) {
        ctx.save()
        ctx.shadowColor = accentColor
        ctx.shadowBlur = 6
        ctx.fillStyle = accentColor
        for (let i = 0; i < glowX.length; i++) {
          ctx.globalAlpha = glowAlpha[i]
          if (shapeType === 'Square') {
            ctx.fillRect(glowX[i], glowY[i], size, size)
          } else {
            ctx.beginPath()
            ctx.arc(glowX[i] + size / 2, glowY[i] + size / 2, size / 2, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
        ctx.restore()
      }

      if (isVisible) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    // Pause RAF when off-screen — saves GPU on non-visible canvases
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting
          if (isVisible) {
            lastTime = performance.now()
            animationFrameId = requestAnimationFrame(render)
          } else {
            cancelAnimationFrame(animationFrameId)
          }
        }
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      if (interactive && container) {
        container.removeEventListener('pointermove', handlePointerMove)
        container.removeEventListener('pointerleave', handlePointerLeave)
      }
    }
  }, [
    size,
    gap,
    shapeType,
    primaryColor,
    secondaryColor,
    probability,
    animSpeed,
    scrollVelocity,
    interactive,
  ])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-auto overflow-hidden ${className}`}
      style={{ borderRadius: radius ? `${radius}px` : undefined }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  )
}
