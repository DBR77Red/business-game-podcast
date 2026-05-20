import type { AppState } from '../types'

const config: Record<AppState, { label: string; dotClass: string; textClass: string }> = {
  IDLE: { label: 'STANDBY', dotClass: 'bg-stone-500', textClass: 'text-stone-400' },
  NARRATOR_SPEAKING: {
    label: 'ON AIR',
    dotClass: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
    textClass: 'text-red-400',
  },
  PLAYER_TURN: {
    label: 'YOUR TURN',
    dotClass: 'bg-green-400 shadow-[0_0_10px_#4ade80]',
    textClass: 'text-green-400',
  },
  PROCESSING: { label: 'STANDBY', dotClass: 'bg-stone-500 animate-pulse', textClass: 'text-stone-400' },
  ENDING: {
    label: 'ENDING',
    dotClass: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
    textClass: 'text-amber-400',
  },
}

interface Props {
  appState: AppState
}

export function StatusIndicator({ appState }: Props) {
  const { label, dotClass, textClass } = config[appState]
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-bold tracking-[0.2em] uppercase ${textClass}`}>{label}</span>
    </div>
  )
}
