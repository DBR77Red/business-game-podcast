import { Suspense, useState } from 'react'
import { BroadcastStudio } from './components/BroadcastStudio'
import { EndingScreen } from './components/EndingScreen'
import { ErrorScreen } from './components/ErrorScreen'
import type { EndingPath } from './types'

interface EndingState {
  path: EndingPath
  replyText: string
  participantVoiceId: string
}

function Booting() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-3">
      <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Tuning in…</p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [ending, setEnding] = useState<EndingState | null>(null)

  const handleEnding = (path: EndingPath, replyText: string, participantVoiceId: string) => {
    setEnding({ path, replyText, participantVoiceId })
  }

  const handleReplay = () => setEnding(null)

  if (ending) {
    return (
      <EndingScreen
        path={ending.path}
        replyText={ending.replyText}
        participantVoiceId={ending.participantVoiceId}
        onReplay={handleReplay}
      />
    )
  }

  return (
    <ErrorScreen>
      <Suspense fallback={<Booting />}>
        <BroadcastStudio onEnding={handleEnding} />
      </Suspense>
    </ErrorScreen>
  )
}
