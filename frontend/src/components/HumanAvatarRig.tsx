import { useState, useEffect, useRef } from 'react'

interface Props {
  isSpeaking: boolean
  language: 'te' | 'en' | 'hi'
  sizeClass?: string
}

export default function HumanAvatarRig({ isSpeaking, sizeClass = 'w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px]' }: Props) {
  // Eye blink state (0 = closed, 1 = open)
  const [eyeOpen, setEyeOpen] = useState(1)
  // Mouth openness (0 = closed smile, 1 = open wide)
  const [mouthOpen, setMouthOpen] = useState(0)
  // Mouth horizontal stretch (0.8 = rounded O, 1.2 = wide E)
  const [mouthWidth, setMouthWidth] = useState(1.0)
  // Head subtle tilt degrees
  const [headTilt, setHeadTilt] = useState(0)

  const animFrameRef = useRef<number | null>(null)
  const speechTimeRef = useRef(0)

  // 1. Natural procedural human blink cycle (every 3.2s with random double blinks)
  useEffect(() => {
    let blinkTimer: any = null
    function scheduleBlink() {
      const delay = 2500 + Math.random() * 2000
      blinkTimer = setTimeout(() => {
        // Close eyes
        setEyeOpen(0.05)
        setTimeout(() => {
          setEyeOpen(1)
          // 25% chance of a quick natural double blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setEyeOpen(0.05)
              setTimeout(() => setEyeOpen(1), 90)
            }, 120)
          }
          scheduleBlink()
        }, 110)
      }, delay)
    }

    scheduleBlink()
    return () => {
      if (blinkTimer) clearTimeout(blinkTimer)
    }
  }, [])

  // 2. Real-time procedural lip-sync and expressive head motion (Brahma AI / Ramayana cinematic style)
  useEffect(() => {
    let active = true

    function animateLipSync() {
      if (!active) return

      if (isSpeaking) {
        speechTimeRef.current += 0.08
        const t = speechTimeRef.current

        // Multi-frequency harmonic phonetic simulation
        // Simulates natural Indian syllable transitions: open vowels (A, Aa), rounded (O, U), wide (E, I), closed stops (M, P)
        const openHarmonic =
          Math.sin(t * 8.5) * 0.45 +
          Math.sin(t * 14.2) * 0.35 +
          Math.sin(t * 4.1) * 0.2

        // Normalized mouth aperture (0 to 1)
        const rawOpen = Math.max(0, Math.min(1, 0.45 + openHarmonic * 0.55))
        setMouthOpen(rawOpen)

        // Mouth stretch (rounded O vs wide E)
        const widthHarmonic = 1.0 + Math.sin(t * 6.2) * 0.18
        setMouthWidth(widthHarmonic)

        // Subtle lifelike head sway while articulating
        const tilt = Math.sin(t * 2.1) * 1.5 + Math.cos(t * 3.4) * 0.8
        setHeadTilt(tilt)
      } else {
        // Return smoothly to closed resting warm smile
        setMouthOpen((prev) => Math.max(0, prev - 0.08))
        setMouthWidth((prev) => prev + (1.0 - prev) * 0.1)
        setHeadTilt((prev) => prev * 0.9)
      }

      animFrameRef.current = requestAnimationFrame(animateLipSync)
    }

    animFrameRef.current = requestAnimationFrame(animateLipSync)

    return () => {
      active = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isSpeaking])

  // Mouth SVG bezier geometry based on aperture & stretch
  // Neutral center at (200, 335)
  const mouthW = 28 * mouthWidth
  const mouthH = 3 + mouthOpen * 22
  const lipDrop = mouthOpen * 14

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeClass}`}>
      {/* Golden Aura Glow (reacts to speech) */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'bg-amber-400/20 blur-3xl scale-110'
            : 'bg-emerald-500/10 blur-2xl scale-95'
        }`}
      />

      {/* Acoustic Resonance Rings */}
      {isSpeaking && (
        <div className="absolute inset-4 rounded-full border border-amber-400/30 animate-ping pointer-events-none" />
      )}

      {/* Photorealistic Vector Human Rig */}
      <svg
        viewBox="0 0 400 480"
        className="w-full h-full drop-shadow-2xl transition-transform duration-300"
        style={{ transform: `rotate(${headTilt}deg)` }}
      >
        <defs>
          {/* Indian Wheatish-Golden Skin Gradient */}
          <radialGradient id="skinGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f3c8a8" />
            <stop offset="45%" stopColor="#e3af8a" />
            <stop offset="85%" stopColor="#cb926b" />
            <stop offset="100%" stopColor="#ab734e" />
          </radialGradient>

          {/* Cheekbone Flush */}
          <radialGradient id="blushGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e17068" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#e17068" stopOpacity="0" />
          </radialGradient>

          {/* Neck Shading Gradient */}
          <linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a36b48" />
            <stop offset="40%" stopColor="#c58c65" />
            <stop offset="100%" stopColor="#8d5433" />
          </linearGradient>

          {/* Emerald Silk Saree with Gold Zari */}
          <linearGradient id="sareeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* 22K Traditional Indian Gold */}
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Realistic Hazel-Brown Iris */}
          <radialGradient id="irisGrad" cx="45%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="60%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1c0a00" />
          </radialGradient>

          {/* Hair Soft Gradient */}
          <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f1815" />
            <stop offset="40%" stopColor="#140f0c" />
            <stop offset="100%" stopColor="#080605" />
          </linearGradient>

          {/* Lips Natural Coral Gradient */}
          <linearGradient id="lipGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c24141" />
            <stop offset="50%" stopColor="#b93333" />
            <stop offset="100%" stopColor="#962020" />
          </linearGradient>
        </defs>

        {/* 1. Shoulders & Silk Saree with Zari Pallu */}
        <path
          d="M 60 480 Q 120 405 200 410 Q 280 405 340 480 Z"
          fill="url(#sareeGrad)"
        />
        {/* Saree Gold Zari Border */}
        <path
          d="M 125 415 Q 170 440 200 480 L 230 480 Q 190 435 145 410 Z"
          fill="url(#goldGrad)"
          opacity="0.9"
        />
        {/* Gold Necklace (Mangalsutra & Gold beads) */}
        <path
          d="M 152 405 Q 200 430 248 405"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="200" cy="425" r="5.5" fill="url(#goldGrad)" />
        <circle cx="200" cy="425" r="2" fill="#991b1b" />

        {/* 2. Neck with anatomical contour */}
        <path
          d="M 165 340 L 165 410 Q 200 422 235 410 L 235 340 Z"
          fill="url(#neckGrad)"
        />

        {/* 3. Hair Base (Back Volume / Bun) */}
        <ellipse cx="200" cy="205" rx="108" ry="125" fill="url(#hairGrad)" />

        {/* 4. Traditional Indian Gold Jhumkas (Earrings) */}
        {/* Left Earring */}
        <g transform="translate(90, 275)">
          <circle cx="0" cy="0" r="4" fill="url(#goldGrad)" />
          <path d="M -7 10 Q 0 4 7 10 L 5 18 L -5 18 Z" fill="url(#goldGrad)" />
          <circle cx="0" cy="21" r="2.5" fill="#b91c1c" />
        </g>
        {/* Right Earring */}
        <g transform="translate(310, 275)">
          <circle cx="0" cy="0" r="4" fill="url(#goldGrad)" />
          <path d="M -7 10 Q 0 4 7 10 L 5 18 L -5 18 Z" fill="url(#goldGrad)" />
          <circle cx="0" cy="21" r="2.5" fill="#b91c1c" />
        </g>

        {/* 5. Face / Head Contour (Warm Indian female portrait geometry) */}
        <path
          d="M 106 195 C 102 260 135 365 200 372 C 265 365 298 260 294 195 C 292 135 260 95 200 95 C 140 95 108 135 106 195 Z"
          fill="url(#skinGlow)"
        />

        {/* Cheekbone Soft Blushes */}
        <circle cx="145" cy="272" r="26" fill="url(#blushGlow)" />
        <circle cx="255" cy="272" r="26" fill="url(#blushGlow)" />

        {/* 6. Hair Front: Soft Middle Parting with glossy waves */}
        <path
          d="M 106 190 Q 140 120 200 135 Q 260 120 294 190 C 290 140 265 85 200 85 C 135 85 110 140 106 190 Z"
          fill="url(#hairGrad)"
        />
        {/* Fine Hair Strands & Sheen */}
        <path
          d="M 112 185 Q 155 128 198 138"
          fill="none"
          stroke="#382923"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M 288 185 Q 245 128 202 138"
          fill="none"
          stroke="#382923"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* 7. Traditional Vermillion Bindi (Auspicious Indian Trust Marker) */}
        <circle cx="200" cy="188" r="4.5" fill="#991b1b" />
        <circle cx="200" cy="188" r="1.5" fill="#fbbf24" />

        {/* 8. Eyebrows (Natural curved feminine arches) */}
        {/* Left Eyebrow */}
        <path
          d="M 132 208 Q 158 196 182 206"
          fill="none"
          stroke="#1c130e"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Right Eyebrow */}
        <path
          d="M 218 206 Q 242 196 268 208"
          fill="none"
          stroke="#1c130e"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 9. Expressive Human Eyes (with real-time natural blink) */}
        {/* Left Eye */}
        <g transform="translate(156, 228)">
          {/* Sclera (Eye White) */}
          <path
            d="M -23 0 Q 0 -13 23 0 Q 0 13 -23 0 Z"
            fill="#fbfcf8"
            stroke="#c48f6c"
            strokeWidth="0.8"
          />
          {/* Iris */}
          <circle cx="0" cy="0" r="9.5" fill="url(#irisGrad)" />
          {/* Pupil */}
          <circle cx="0" cy="0" r="4.5" fill="#000000" />
          {/* Catchlight (Life Reflection) */}
          <circle cx="-2.5" cy="-2.5" r="2.2" fill="#ffffff" opacity="0.9" />
          <circle cx="2.5" cy="2.5" r="1.1" fill="#ffffff" opacity="0.6" />

          {/* Upper Eyelid / Lash that closes on blink */}
          <path
            d={`M -24 0 Q 0 ${-13 * eyeOpen + 12 * (1 - eyeOpen)} 24 0`}
            fill="none"
            stroke="#1c130e"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Blink Eyelid Skin Cover */}
          {eyeOpen < 0.9 && (
            <path
              d={`M -23 0 Q 0 ${-13 * eyeOpen} 23 0 Q 0 ${13 * (1 - eyeOpen)} -23 0 Z`}
              fill="#d9a37e"
            />
          )}
        </g>

        {/* Right Eye */}
        <g transform="translate(244, 228)">
          {/* Sclera */}
          <path
            d="M -23 0 Q 0 -13 23 0 Q 0 13 -23 0 Z"
            fill="#fbfcf8"
            stroke="#c48f6c"
            strokeWidth="0.8"
          />
          {/* Iris */}
          <circle cx="0" cy="0" r="9.5" fill="url(#irisGrad)" />
          {/* Pupil */}
          <circle cx="0" cy="0" r="4.5" fill="#000000" />
          {/* Catchlight */}
          <circle cx="-2.5" cy="-2.5" r="2.2" fill="#ffffff" opacity="0.9" />
          <circle cx="2.5" cy="2.5" r="1.1" fill="#ffffff" opacity="0.6" />

          {/* Upper Eyelid / Lash */}
          <path
            d={`M -24 0 Q 0 ${-13 * eyeOpen + 12 * (1 - eyeOpen)} 24 0`}
            fill="none"
            stroke="#1c130e"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Blink Cover */}
          {eyeOpen < 0.9 && (
            <path
              d={`M -23 0 Q 0 ${-13 * eyeOpen} 23 0 Q 0 ${13 * (1 - eyeOpen)} -23 0 Z`}
              fill="#d9a37e"
            />
          )}
        </g>

        {/* 10. Refined Nose with Indian Gold Nathni (Nose Stud) */}
        <g transform="translate(200, 274)">
          {/* Nose Bridge Highlight & Contour */}
          <path
            d="M -3 -48 L -2 -10 Q -6 6 -11 12 Q 0 16 11 12 Q 6 6 2 -10 L 3 -48"
            fill="none"
            stroke="#c88c67"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Nostril Curves */}
          <path
            d="M -13 11 Q -9 15 0 16 Q 9 15 13 11"
            fill="none"
            stroke="#8c5332"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Small Traditional Gold Nose Stud (Nathni) on left nostril */}
          <circle cx="-11" cy="9" r="2.2" fill="url(#goldGrad)" />
          <circle cx="-11" cy="9" r="0.8" fill="#ffffff" />
        </g>

        {/* 11. Dynamic Real-Time Lip-Sync Mouth Rig (Brahma AI Style) */}
        <g transform="translate(200, 335)">
          {/* Oral Cavity (Dark interior revealed when speaking) */}
          {mouthOpen > 0.08 && (
            <path
              d={`M ${-mouthW} 0 Q 0 ${mouthH * 1.3} ${mouthW} 0 Q 0 ${-mouthH * 0.4} ${-mouthW} 0 Z`}
              fill="#4a0e17"
            />
          )}

          {/* Upper Pearly Teeth (Visible when mouth opens wide) */}
          {mouthOpen > 0.22 && (
            <path
              d={`M ${-mouthW * 0.7} 0 Q 0 7 ${mouthW * 0.7} 0 Z`}
              fill="#ffffff"
              opacity="0.95"
            />
          )}

          {/* Tongue Tip */}
          {mouthOpen > 0.45 && (
            <path
              d={`M ${-mouthW * 0.5} ${mouthH * 0.6} Q 0 ${mouthH * 0.2} ${mouthW * 0.5} ${mouthH * 0.6} Q 0 ${mouthH * 1.1} ${-mouthW * 0.5} ${mouthH * 0.6} Z`}
              fill="#c25864"
            />
          )}

          {/* Upper Lip with Cupid's Bow */}
          <path
            d={`M ${-mouthW - 2} 0 Q ${-mouthW * 0.45} -7 -4 -5 Q 0 -3 4 -5 Q ${mouthW * 0.45} -7 ${mouthW + 2} 0 Q 0 ${mouthOpen * 2} ${-mouthW - 2} 0 Z`}
            fill="url(#lipGrad)"
          />

          {/* Lower Lip (Drops dynamically with speech pitch and phonemes) */}
          <path
            d={`M ${-mouthW - 2} 0 Q 0 ${lipDrop + 6} ${mouthW + 2} 0 Q 0 ${lipDrop + 14} ${-mouthW - 2} 0 Z`}
            fill="url(#lipGrad)"
          />

          {/* Lip Highlights for realistic moist texture */}
          <ellipse
            cx="0"
            cy={lipDrop + 9}
            rx={mouthW * 0.4}
            ry={2.5}
            fill="#fca5a5"
            opacity="0.45"
          />
        </g>
      </svg>
    </div>
  )
}
