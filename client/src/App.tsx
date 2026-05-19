import { useState } from 'react'
import { Orb, type AgentState } from './components/ui/orb'

/**
 * Dev-only preview gallery. Components appear here as their tasks land.
 * Task 16 replaces this entire file with the real <BroadcastStudio /> + <EndingScreen /> routing.
 */
export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#0c0a09] text-stone-200 flex flex-col items-center gap-12 py-12 px-6">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Business Game</p>
        <h1 className="text-2xl font-semibold tracking-wide mt-1">Preview Gallery</h1>
        <p className="text-stone-500 text-sm mt-2 max-w-md">
          Dev-only. Components appear here as they're built. Replaced by the real game UI in Task 16.
        </p>
      </header>

      <HostOrbPreview />
    </div>
  )
}

function HostOrbPreview() {
  const [agentState, setAgentState] = useState<AgentState>(null)

  return (
    <section className="flex flex-col items-center gap-4 w-full max-w-md">
      <h2 className="text-xs tracking-[0.25em] uppercase text-stone-500">3D Orb (host voice visual)</h2>
      <div className="w-72 h-72">
        <Orb
          colors={['#fbbf24', '#ef4444']}
          agentState={agentState}
          volumeMode="auto"
        />
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {([null, 'listening', 'thinking', 'talking'] as const).map((state) => (
          <button
            key={state ?? 'idle'}
            onClick={() => setAgentState(state)}
            className={[
              'px-3 py-1.5 rounded-md text-xs tracking-wider uppercase transition-colors',
              agentState === state
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200',
            ].join(' ')}
          >
            {state ?? 'idle'}
          </button>
        ))}
      </div>
    </section>
  )
}
