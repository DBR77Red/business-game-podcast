import { use, useCallback, useRef, useState } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import { useAudioStream } from '../hooks/useAudioStream'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { StatusIndicator } from './StatusIndicator'
import { HostOrb } from './HostOrb'
import { MicButton } from './MicButton'
import { fetchStoryConfig } from '../lib/fetchStory'
import type { AppState, EndingPath, GameState } from '../types'

interface Props {
  onEnding: (path: EndingPath, replyText: string, participantVoiceId: string) => void
}

export function BroadcastStudio({ onEnding }: Props) {
  const story = use(fetchStoryConfig())
  const { gameState, startGame, applyTurn } = useGameEngine()
  const { playTurn, outputVolumeRef } = useAudioStream()
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder()
  const [appState, setAppState] = useState<AppState>('IDLE')
  const runningRef = useRef(false)

  const runHostTurn = useCallback(
    async (playerReply: string, currentState: GameState) => {
      if (runningRef.current) return
      runningRef.current = true
      setAppState('PROCESSING')

      try {
        const { stateReady, done } = playTurn({
          gameState: currentState,
          playerReply,
          voiceId: story.hostVoiceId,
        })

        const state = await stateReady
        setAppState('NARRATOR_SPEAKING')
        const { narration } = await done
        applyTurn(state, playerReply, narration)

        if (state.segment.startsWith('ENDING')) {
          const path = (state.path ?? 'setback') as EndingPath
          const replyText = story.participant.replyTexts[path]
          onEnding(path, replyText, story.participant.voiceId)
          return
        }

        setAppState('PLAYER_TURN')
      } catch (err) {
        console.error('Host turn failed:', err)
        setAppState('PLAYER_TURN')
      } finally {
        runningRef.current = false
      }
    },
    [story, playTurn, applyTurn, onEnding],
  )

  const handleStart = async () => {
    startGame()
    await runHostTurn('', { ...gameState, segment: 'INTRO' })
  }

  const handleMicDown = () => {
    if (appState === 'PLAYER_TURN') startRecording()
  }

  const handleMicUp = async () => {
    if (!isRecording) return
    setAppState('PROCESSING')
    try {
      const transcript = await stopRecording()
      await runHostTurn(transcript, gameState)
    } catch (err) {
      console.error('Mic turn failed:', err)
      setAppState('PLAYER_TURN')
    }
  }

  if (appState === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Welcome to</p>
          <h1 className="text-4xl font-bold text-stone-100 tracking-wide">{story.episodeTitle}</h1>
          <p className="text-stone-500 text-sm mt-1">A live podcast experience</p>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-3 border border-red-500 text-red-400 text-sm tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors"
        >
          Go On Air
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#0c0a09] px-6 py-10">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <StatusIndicator appState={appState} />
        <div className="text-xs tracking-[0.25em] uppercase text-stone-600">{story.episodeTitle}</div>
      </div>

      <HostOrb appState={appState} outputVolumeRef={outputVolumeRef} />

      <div className="flex flex-col items-center gap-4">
        <MicButton
          onPressStart={handleMicDown}
          onPressEnd={handleMicUp}
          isRecording={isRecording}
          isDisabled={appState !== 'PLAYER_TURN'}
        />
        <p className="text-sm text-stone-400 tracking-wide min-h-[1.5rem]">
          {appState === 'PLAYER_TURN' ? 'Hold to speak' : ''}
        </p>
      </div>
    </div>
  )
}
