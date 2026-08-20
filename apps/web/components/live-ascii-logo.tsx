'use client'

import React, { useEffect, useRef } from 'react'

const CLEAN_RAMP = ['@', '#', '$', '%', '*', '+', '=', '-', ':', '.', ' ']

// Parse hex/color names/rgb to r,g,b
const colorToRgb = (color: string) => {
  // If color is hex
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return { r, g, b }
  }
  // Fallback for names like 'black' or other formats
  if (color === 'black' || color === '#000000' || color === '#000') {
    return { r: 0, g: 0, b: 0 }
  }
  return { r: 25, g: 90, b: 220 } // default cerulean
}

export function LiveAsciiLogo({
  resolution = 104,
  color = '#195adc',
  showLabel = false,
  label = 'E O N',
}: {
  resolution?: number
  color?: string
  showLabel?: boolean
  label?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)
  const timeRef = useRef<number>(0)
  const baseMaskRef = useRef<Float32Array | null>(null)
  const animIdRef = useRef<number>(0)
  const fontSizeRef = useRef<number>(10)

  const width = resolution
  const height = Math.floor(resolution * 0.56)

  const rgbRef = useRef({ r: 25, g: 90, b: 220 })

  useEffect(() => {
    rgbRef.current = colorToRgb(color)
  }, [color])

  // Pre-sample static SVG path luminance ONCE per resolution
  useEffect(() => {
    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const ctx = offscreen.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#ffffff'
    // Scale and center SVG path safely inside offscreen grid with 8% padding
    const pathW = 860
    const pathH = 840
    const scale = (height * 0.86) / pathH
    const offsetX = (width - pathW * scale) / 2
    const offsetY = (height - pathH * scale) / 2
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)
    ctx.translate(-100, -75)

    const p = new Path2D(
      'M763.14,584.06l82.86-63.21-77.33,35.51h0c-9.67,4.82,7.06-21.94,7.06-21.94,70.02-112.71,89.85-203.89,46.32-253.56C682.48,119.3,179.32,453.78,238.87,745.44c7.6,37.33,52.84,113.36,173.57,92.23,91.13-15.95,165.69-81.22,217.1-144.98-15.81,13.13-128.27,125.98-250.46,125.03-140.78-1.09-103.36-199.25,43.43-334.27,199.88-198.95,443.93-171.22,312.24,65.92-2.26,3.58-12.66,18.49-24.53,10.8-3.58-2.62-6.79-5.85-9.43-9.67l-103.29-142.15,80.83,155.64c9.08,17.55,4.24,39.09-11.47,51.08l-82.86,63.21,94.71-43.49c17.96-8.25,39.25-2.41,50.49,13.85l98.58,142.63-76.13-156.12c-9.08-17.55-4.24-39.09,11.47,51.08Z'
    )
    ctx.fill(p)

    const imgData = ctx.getImageData(0, 0, width, height)
    const pixels = imgData.data
    const mask = new Float32Array(width * height)

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      mask[i] =
        (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) /
        255 *
        (pixels[idx + 3] / 255)
    }

    baseMaskRef.current = mask
  }, [width, height])

  // Measure font size from container & update canvas logical size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const span = document.createElement('span')
      span.style.cssText =
        'position:absolute;visibility:hidden;font-family:monospace;white-space:pre;font-size:inherit;line-height:0.76;'
      span.textContent = 'X'
      container.appendChild(span)
      const rect = span.getBoundingClientRect()
      fontSizeRef.current = Math.max(rect.width, 1)
      container.removeChild(span)

      const canvas = canvasRef.current
      if (canvas) {
        const cw = Math.ceil(fontSizeRef.current * width)
        const ch = Math.ceil(fontSizeRef.current * height * 0.76)
        canvas.style.width = `${cw}px`
        canvas.style.height = `${ch}px`
        canvas.width = cw
        canvas.height = ch
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [width, height])

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()
    const frameInterval = 1000 / 30

    const rampLength = CLEAN_RAMP.length
    const centerX = width / 2
    const centerY = height / 2

    const vals = new Float32Array(width * height)
    const mouseR2 = 12 * 12
    const waveVals = new Float32Array(width * height)

    const draw = (now: number) => {
      animIdRef.current = requestAnimationFrame(draw)
      const elapsed = now - lastTime
      if (elapsed < frameInterval) return
      lastTime = now - (elapsed % frameInterval)

      const mask = baseMaskRef.current
      if (!mask) return

      timeRef.current += 0.024
      const t = timeRef.current
      const mouse = mousePosRef.current

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width
        for (let x = 0; x < width; x++) {
          let val = mask[rowOffset + x]

          if (val > 0.04) {
            const dx = x - centerX
            const dy = y - centerY

            // Polar angle around logomark center
            const angle = Math.atan2(dy, dx)

            // Multiplier 1.0 guarantees 100% continuous 360° loop with zero discontinuity seam.
            // Broad wave pulse traveling counter-clockwise at a balanced, smooth speed
            const wave = Math.sin(angle - t * 1.8)
            const harmonic = Math.sin(angle * 2 - t * 3.6) * 0.3
            const rawWave = wave + harmonic

            // Normalized wave factor for blue color transition: 0 (default grey) -> 1 (vibrant blue wave)
            const waveFactor = Math.min(1, Math.max(0, (rawWave + 0.3) / 1.2))
            waveVals[rowOffset + x] = waveFactor

            // Keep character density solid so inactive parts NEVER fade out or become invisible!
            val = Math.min(1.0, Math.max(0.65, mask[rowOffset + x] + waveFactor * 0.35))
          }

          if (mouse && val > 0.01) {
            const mdx = x - mouse.x
            const mdy = y - mouse.y
            const md2 = mdx * mdx + mdy * mdy
            if (md2 < mouseR2) {
              val = Math.min(1, val + (1 - Math.sqrt(md2) / 12) * 0.45)
              waveVals[rowOffset + x] = Math.min(1, waveVals[rowOffset + x] + 0.5)
            }
          }

          vals[rowOffset + x] = val
        }
      }

      const cw = canvas.width
      const ch = canvas.height
      const cellW = cw / width
      const cellH = ch / height

      ctx.clearRect(0, 0, cw, ch)

      const fontSize = Math.max(6, cellH * 1.0)
      ctx.font = `${fontSize}px monospace`
      ctx.textBaseline = 'top'

      // Default base state: crisp dark/neutral slate grey (#64748b)
      const baseR = 100, baseG = 116, baseB = 139
      // Wave active state: vibrant cerulean blue (#195adc)
      const waveR = 25,  waveG = 90,  waveB = 220

      // Batch draws by color to avoid per-character fillStyle state changes.
      // Map<colorString, Array<[x, y, char]>>
      const colorBatches = new Map<string, Array<[number, number, string]>>()

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width
        const py = y * cellH
        for (let x = 0; x < width; x++) {
          const val = vals[rowOffset + x]
          if (val < 0.06) continue

          const waveFactor = waveVals[rowOffset + x]
          
          // Smooth color interpolation from base grey -> wave blue
          const r = Math.round(baseR + (waveR - baseR) * waveFactor)
          const g = Math.round(baseG + (waveG - baseG) * waveFactor)
          const b = Math.round(baseB + (waveB - baseB) * waveFactor)

          // High minimum opacity (0.75) guarantees inactive grey characters remain solid
          const opacity = Math.min(1.0, Math.max(0.75, val))
          const rampIdx = Math.floor((1 - val) * (rampLength - 1))
          const char = CLEAN_RAMP[rampIdx] ?? CLEAN_RAMP[rampLength - 1]

          const colorKey = `rgba(${r},${g},${b},${opacity.toFixed(2)})`
          let batch = colorBatches.get(colorKey)
          if (!batch) {
            batch = []
            colorBatches.set(colorKey, batch)
          }
          batch.push([x * cellW, py, char])
        }
      }

      // Draw each color group in one fillStyle assignment
      for (const [color, draws] of colorBatches) {
        ctx.fillStyle = color
        for (let i = 0; i < draws.length; i++) {
          ctx.fillText(draws[i][2], draws[i][0], draws[i][1])
        }
      }
    }

    // Pause animation when off-screen to save CPU
    const container = containerRef.current
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            lastTime = performance.now()
            animIdRef.current = requestAnimationFrame(draw)
          } else {
            cancelAnimationFrame(animIdRef.current)
          }
        }
      },
      { threshold: 0 }
    )
    if (container) intersectionObserver.observe(container)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      intersectionObserver.disconnect()
    }
  }, [width, height])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = (e.clientX - rect.left) / rect.width
    const relativeY = (e.clientY - rect.top) / rect.height
    mousePosRef.current = {
      x: Math.floor(relativeX * width),
      y: Math.floor(relativeY * height),
    }
  }

  const handleMouseLeave = () => {
    mousePosRef.current = null
  }

  return (
    <div className="w-full flex flex-col justify-center items-center my-3 bg-transparent select-none overflow-hidden">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="font-mono text-[8px] xs:text-[10px] sm:text-[13px] md:text-[16px] lg:text-[19px] xl:text-[21px] leading-[0.76] tracking-[-0.04em] overflow-hidden w-full max-w-full flex flex-col items-center justify-center cursor-default bg-transparent"
        style={{ color }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
          }}
        />
        {showLabel && (
          <div className="mt-3 flex items-center justify-center tracking-[0.4em] text-[11px] sm:text-[12px] font-mono font-bold uppercase text-[#09090b]/80 dark:text-white/80 select-none">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveAsciiLogo
