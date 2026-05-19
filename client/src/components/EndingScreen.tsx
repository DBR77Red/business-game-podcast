import { useEffect, useRef, useState } from 'react'
import type { EndingPath } from '../types'

const endingMeta: Record<EndingPath, { label: string; color: string }> = {
  'breakout': { label: 'Breakout Success', color: 'text-green-400' },
  'solid-win': { label: 'Solid Win', color: 'text-indigo-400' },
  'partial': { label: 'Partial Result', color: 'text-amber-400' },
  'setback': { label: 'Setback', color: 'text-red-400' },
}

interface Props {
  path: EndingPath
  replyText: string
  participantVoiceId: string
  onReplay: () => void
}

export function EndingScreen({ path, replyText, participantVoiceId, onReplay }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const meta = endingMeta[path]

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: replyText, voiceId: participantVoiceId }),
        })
        if (cancelled || !res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)
        audioRef.current = audio
        audio.onended = () => setIsPlaying(false)
        setIsPlaying(true)
        await audio.play().catch(() => setIsPlaying(false))
      } catch (err) {
        console.error('EndingScreen audio failed:', err)
        setIsPlaying(false)
      }
    })()

    return () => {
      cancelled = true
      audioRef.current?.pause()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [replyText, participantVoiceId])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-10 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Marco's update</p>
        <h2 className={`text-2xl font-bold ${meta.color}`}>{meta.label}</h2>
        {isPlaying && (
          <div className="flex gap-1 mt-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-amber-400 rounded-sm animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onReplay}
        className="px-8 py-3 border border-stone-600 text-stone-400 text-sm tracking-[0.2em] uppercase hover:border-stone-400 hover:text-stone-200 transition-colors"
      >
        Play Again
      </button>
    </div>
  )
}
