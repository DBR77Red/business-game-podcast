import { useEffect, useRef, type RefObject } from 'react'
import type { AppState } from '../types'

interface Props {
  appState: AppState
  /** Live AnalyserNode from useAudioStream. When present, bars react to real audio frequencies. */
  analyserRef?: RefObject<AnalyserNode | null>
  /** Number of bars to render. Default 8 per the spec. */
  bars?: number
}

const BASE_HEIGHT = 6
const MAX_HEIGHT = 84

export function HostBars({ appState, analyserRef, bars = 8 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const barRefs = useRef<Array<HTMLDivElement | null>>([])
  const rafRef = useRef(0)
  const idlePhaseRef = useRef(0)

  const isLive = appState === 'NARRATOR_SPEAKING' || appState === 'ENDING'
  const isWaiting = appState === 'PLAYER_TURN' || appState === 'PROCESSING'

  useEffect(() => {
    // Allocate the frequency buffer once per effect run, not per frame.
    let freqData: Uint8Array<ArrayBuffer> | null = null

    const animate = () => {
      const analyser = analyserRef?.current
      const els = barRefs.current

      if (analyser && isLive) {
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount)
        }
        const data = freqData
        analyser.getByteFrequencyData(data)
        // Sample evenly across the frequency bins, skipping the top quarter
        // (mostly noise/silence in speech).
        const usable = Math.floor(data.length * 0.75)
        for (let i = 0; i < bars; i++) {
          const startBin = Math.floor((i / bars) * usable)
          const endBin = Math.floor(((i + 1) / bars) * usable)
          let sum = 0
          for (let j = startBin; j < endBin; j++) sum += data[j]
          const avg = sum / Math.max(1, endBin - startBin) / 255
          const h = BASE_HEIGHT + avg * (MAX_HEIGHT - BASE_HEIGHT)
          if (els[i]) els[i]!.style.height = `${h}px`
        }
      } else {
        // Idle / waiting: gentle sine wiggle so the UI doesn't feel dead.
        idlePhaseRef.current += 0.04
        const amplitude = isWaiting ? 0.25 : 0.12
        for (let i = 0; i < bars; i++) {
          const t = idlePhaseRef.current + (i / bars) * Math.PI
          const wave = (Math.sin(t) + 1) / 2
          const h = BASE_HEIGHT + wave * amplitude * (MAX_HEIGHT - BASE_HEIGHT)
          if (els[i]) els[i]!.style.height = `${h}px`
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserRef, bars, isLive, isWaiting])

  // Color/glow per state. NARRATOR/ENDING glow red (ON AIR), PLAYER_TURN glows green,
  // PROCESSING/IDLE stay neutral.
  const barClass = (() => {
    if (appState === 'NARRATOR_SPEAKING' || appState === 'ENDING') {
      return 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    }
    if (appState === 'PLAYER_TURN') {
      return 'bg-green-400 shadow-[0_0_8px_#4ade80]'
    }
    return 'bg-stone-600'
  })()

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Microphone icon as the visual centerpiece */}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-stone-400" aria-hidden="true">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm6-3c0 2.76-2.24 5-5 5h-2c-2.76 0-5-2.24-5-5H4c0 3.53 2.61 6.43 6 6.92V21h4v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>

      {/* 8 bars, frequency-driven when live, idle wiggle otherwise */}
      <div
        ref={containerRef}
        className="flex items-end justify-center gap-1.5 h-24"
        aria-hidden="true"
      >
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barRefs.current[i] = el
            }}
            className={`w-2 rounded-full transition-colors duration-200 ${barClass}`}
            style={{ height: `${BASE_HEIGHT}px` }}
          />
        ))}
      </div>
    </div>
  )
}
