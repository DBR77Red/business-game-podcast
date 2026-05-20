import { useEffect, useRef, useState } from 'react'
import type { EndingPath, Language } from '../types'
import { authHeaders } from '../lib/appPassword'

const endingMeta: Record<Language, Record<EndingPath, { label: string; color: string }>> = {
  en: {
    'breakout': { label: 'Breakout Success', color: 'text-green-400' },
    'solid-win': { label: 'Solid Win', color: 'text-indigo-400' },
    'partial': { label: 'Partial Result', color: 'text-amber-400' },
    'setback': { label: 'Setback', color: 'text-red-400' },
  },
  pt: {
    'breakout': { label: 'Sucesso Estrondoso', color: 'text-green-400' },
    'solid-win': { label: 'Vitória Sólida', color: 'text-indigo-400' },
    'partial': { label: 'Resultado Parcial', color: 'text-amber-400' },
    'setback': { label: 'Revés', color: 'text-red-400' },
  },
}

const endingLabels: Record<Language, { update: string; replay: string }> = {
  en: { update: "Marco's update", replay: 'Play Again' },
  pt: { update: 'Atualização do Marco', replay: 'Jogar de Novo' },
}

interface Props {
  path: EndingPath
  replyText: string
  participantVoiceId: string
  language: Language
  onReplay: () => void
}

export function EndingScreen({ path, replyText, participantVoiceId, language, onReplay }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const meta = endingMeta[language][path]
  const t = endingLabels[language]

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ text: replyText, voiceId: participantVoiceId, language }),
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
  }, [replyText, participantVoiceId, language])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-10 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-500">{t.update}</p>
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
        {t.replay}
      </button>
    </div>
  )
}
