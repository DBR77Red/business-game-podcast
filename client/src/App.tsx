import { useState } from 'react'
import { HostOrb } from './components/HostOrb'
import { StatusIndicator } from './components/StatusIndicator'
import type { AppState } from './types'

/**
 * Dev-only preview gallery. Components appear here as their tasks land.
 * Task 16 replaces this entire file with the real <BroadcastStudio /> + <EndingScreen /> routing.
 */
const APP_STATES: AppState[] = ['IDLE', 'NARRATOR_SPEAKING', 'PLAYER_TURN', 'PROCESSING', 'ENDING']

export default function App() {
  const [appState, setAppState] = useState<AppState>('NARRATOR_SPEAKING')

  return (
    <div className="min-h-screen w-full bg-[#0c0a09] text-stone-200 flex flex-col items-center gap-12 py-12 px-6">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Business Game</p>
        <h1 className="text-2xl font-semibold tracking-wide mt-1">Preview Gallery</h1>
        <p className="text-stone-500 text-sm mt-2 max-w-md">
          Dev-only. Components appear here as they're built. Replaced by the real game UI in Task 16.
        </p>
      </header>

      <section className="flex flex-col items-center gap-6 w-full max-w-md">
        <h2 className="text-xs tracking-[0.25em] uppercase text-stone-500">App state</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {APP_STATES.map((state) => (
            <button
              key={state}
              onClick={() => setAppState(state)}
              className={[
                'px-3 py-1.5 rounded-md text-xs tracking-wider uppercase transition-colors',
                appState === state
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200',
              ].join(' ')}
            >
              {state}
            </button>
          ))}
        </div>
        <StatusIndicator appState={appState} />
      </section>

      <section className="flex flex-col items-center gap-4 w-full max-w-md">
        <h2 className="text-xs tracking-[0.25em] uppercase text-stone-500">HostOrb (3D, reacts to AppState)</h2>
        <HostOrb appState={appState} />
      </section>
    </div>
  )
}
