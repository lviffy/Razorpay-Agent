'use client'

import React, { useId } from 'react'

interface DitherCardBackgroundProps {
  variant?: 'top-right' | 'bottom-right' | 'center-scale' | 'left-bleed' | 'watermark-wide' | 'bottom-left' | 'watermark-left'
  className?: string
  color?: string
  showLogo?: boolean
}

export function DitherCardBackground({
  variant = 'top-right',
  className = '',
  color = '#195adc',
  showLogo = true,
}: DitherCardBackgroundProps) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '_')
  const patternId = `dither_pattern_${id}`
  const bgPatternId = `bg_dither_pattern_${id}`
  const maskId = `dither_mask_${id}`

  // Position, scale & rotation presets for the EONVERSE dithered logomark graphic
  const variantStyles: Record<string, string> = {
    'top-right': 'top-[-15%] right-[-10%] w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] rotate-[-12deg] group-hover:scale-110 group-hover:rotate-[-6deg]',
    'bottom-right': 'bottom-[-20%] right-[-8%] w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rotate-[15deg] group-hover:scale-110 group-hover:rotate-[8deg]',
    'center-scale': 'top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] rotate-[35deg] group-hover:scale-115 group-hover:rotate-[20deg]',
    'left-bleed': 'top-[-10%] left-[-15%] w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] rotate-[22deg] group-hover:scale-110 group-hover:rotate-[12deg]',
    'watermark-wide': 'right-[-5%] bottom-[-30%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rotate-[-8deg] group-hover:scale-108 group-hover:rotate-[-3deg]',
    'bottom-left': 'bottom-[-15%] left-[-10%] w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] rotate-[18deg] group-hover:scale-110 group-hover:rotate-[10deg]',
    'watermark-left': 'top-[50%] right-[16px] -translate-y-[50%] w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rotate-0 group-hover:scale-105',
  }

  const transformClass = variantStyles[variant] || variantStyles['top-right']

  const logoPath =
    'M763.14,584.06l82.86-63.21-77.33,35.51h0c-9.67,4.82,7.06-21.94,7.06-21.94,70.02-112.71,89.85-203.89,46.32-253.56C682.48,119.3,179.32,453.78,238.87,745.44c7.6,37.33,52.84,113.36,173.57,92.23,91.13-15.95,165.69-81.22,217.1-144.98-15.81,13.13-128.27,125.98-250.46,125.03-140.78-1.09-103.36-199.25,43.43-334.27,199.88-198.95,443.93-171.22,312.24,65.92-2.26,3.58-12.66,18.49-24.53,10.8-3.58-2.62-6.79-5.85-9.43-9.67l-103.29-142.15,80.83,155.64c9.08,17.55,4.24,39.09-11.47,51.08l-82.86,63.21,94.71-43.49c17.96-8.25,39.25-2.41,50.49,13.85l98.58,142.63-76.13-156.12c-9.08-17.55-4.24-39.09,11.47-51.08Z'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden rounded-xl z-0 ${className}`}
    >
      {/* 1. Distinct & Clearly Visible Card Dither Grid Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.14] group-hover:opacity-[0.24] transition-opacity duration-300">
        <defs>
          <pattern
            id={bgPatternId}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2.5" cy="2.5" r="1.35" fill={color} />
            <circle cx="7.5" cy="7.5" r="1.35" fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${bgPatternId})`} />
      </svg>

      {/* 2. Dithered EONVERSE Logomark Graphic (Rendered ONLY on requested card) */}
      {showLogo && (
        <div
          className={`absolute transition-all duration-500 ease-out transform ${transformClass}`}
        >
          <svg
            viewBox="0 0 1080 1080"
            className="w-full h-full text-[#195adc]"
            aria-hidden="true"
          >
            <defs>
              {/* Bold Halftone Dither Dot Matrix Pattern for the Logo */}
              <pattern
                id={patternId}
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="6" cy="6" r="5" fill={color} />
                <circle cx="18" cy="18" r="5" fill={color} />
                <circle cx="18" cy="6" r="3" fill={color} opacity="0.7" />
                <circle cx="6" cy="18" r="3" fill={color} opacity="0.7" />
              </pattern>

              {/* Mask using authentic EONVERSE swirl logomark */}
              <mask id={maskId}>
                <path fill="#ffffff" d={logoPath} />
              </mask>
            </defs>

            <rect
              width="1080"
              height="1080"
              fill={`url(#${patternId})`}
              mask={`url(#${maskId})`}
              className="opacity-[0.32] group-hover:opacity-[0.55] transition-opacity duration-300"
            />

            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="12 12"
              d={logoPath}
              className="opacity-[0.28] group-hover:opacity-[0.5] transition-opacity duration-300"
            />
          </svg>
        </div>
      )}

      {/* 3. Soft Bottom Fade Gradient to preserve text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none z-0" />
    </div>
  )
}
