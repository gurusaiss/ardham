import { useState, useEffect, useRef } from 'react'

interface Props {
  isSpeaking: boolean
  language: 'te' | 'en' | 'hi'
  sizeClass?: string
}

export default function HumanAvatarRig({
  isSpeaking,
  language: _language,
  sizeClass = 'w-36 h-36 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96',
}: Props) {
  const [breathPhase, setBreathPhase] = useState(0)
  const animFrameRef = useRef<number | null>(null)
  const breathTimeRef = useRef(0)

  // Gentle procedural human breathing cycle
  useEffect(() => {
    let active = true
    function animate() {
      if (!active) return
      breathTimeRef.current += 0.02
      setBreathPhase(Math.sin(breathTimeRef.current))
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => {
      active = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div className={`relative flex items-center justify-center select-none shrink-0 ${sizeClass}`}>
      {/* 1. Golden / Emerald Ambient Aura Glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'bg-amber-400/25 blur-2xl sm:blur-3xl scale-105 sm:scale-110'
            : 'bg-emerald-500/15 blur-xl sm:blur-2xl scale-95'
        }`}
      />

      {/* 2. Concentric Acoustic Waves when Speaking */}
      {isSpeaking && (
        <>
          <div className="absolute -inset-2 sm:-inset-4 rounded-full border border-amber-400/30 animate-ping pointer-events-none" />
          <div className="absolute -inset-4 sm:-inset-8 rounded-full border border-emerald-400/20 animate-pulse pointer-events-none" />
        </>
      )}

      {/* 3. Photorealistic Portrait Container with Gold Zari Border */}
      <div
        className="relative w-full h-full rounded-full p-1.5 sm:p-2 bg-gradient-to-tr from-amber-500 via-emerald-600 to-yellow-400 shadow-[0_10px_30px_rgba(0,0,0,0.8)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-transform duration-500"
        style={{
          transform: `scale(${1 + breathPhase * 0.008})`,
        }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-slate-900 bg-slate-950">
          <img
            src="/lakshmi-avatar.jpg"
            alt="Lakshmi AI Loan Officer"
            className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.02]"
            loading="eager"
          />

          {/* Subtle soft vignette */}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-amber-400/30 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Live Audio Equalizer Waveform Pill at the base */}
        {isSpeaking && (
          <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 bg-slate-950/90 border border-amber-400/60 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shadow-xl">
            <span className="sound-bar h-1.5 sm:h-2 bg-amber-400"></span>
            <span className="sound-bar h-3 sm:h-4 bg-amber-400"></span>
            <span className="sound-bar h-2 sm:h-2.5 bg-emerald-400"></span>
            <span className="sound-bar h-3.5 sm:h-5 bg-amber-400"></span>
            <span className="sound-bar h-2 sm:h-3 bg-emerald-400"></span>
          </div>
        )}
      </div>
    </div>
  )
}
