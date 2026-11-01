import { type AppLanguage, getLanguage, subscribeLanguage } from '../lib/speech'
import { useState, useEffect } from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function ArdhamLogo({ size = 'md', showText = true, className = '' }: Props) {
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-3xl',
  }

  const titleSizes = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Golden Shield & Oral Voice Emblem */}
      <div
        className={`relative flex items-center justify-center shrink-0 shadow-md border border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 text-amber-300 font-extrabold ${iconSizes[size]} overflow-hidden group`}
      >
        {/* Subtle radial center glow */}
        <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent pointer-events-none" />

        {/* Mini Acoustic Soundwaves */}
        <span className="absolute left-1 text-[8px] sm:text-[9px] text-amber-400/60 font-mono select-none">
          (((
        </span>
        <span className="absolute right-1 text-[8px] sm:text-[9px] text-amber-400/60 font-mono select-none">
          )))
        </span>

        {/* Central Telugu 'అ' Glyph */}
        <span className="relative text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
          అ
        </span>

        {/* Top Auspicious Sparkle Dot */}
        <span className="absolute top-1 text-[7px] text-amber-300 animate-pulse">✦</span>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-emerald-950 font-sans ${titleSizes[size]}`}
            >
              {lang === 'en' ? 'Ardham' : lang === 'hi' ? 'अर्थम' : 'అర్థం'}
            </span>
            {lang !== 'en' && (
              <span className="text-xs sm:text-sm font-extrabold text-slate-500 hidden sm:inline tracking-wider uppercase">
                Ardham
              </span>
            )}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase">
              100%
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide mt-0.5 hidden sm:block">
            {lang === 'en'
              ? 'Loan Comprehension & Verification'
              : lang === 'hi'
              ? 'ऋण समझ एवं सत्यापन'
              : 'రుణ అవగాహన & సమ్మతి ధృవీకరణ'}
          </span>
        </div>
      )}
    </div>
  )
}
