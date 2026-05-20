import { use, useCallback, useRef, useState } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import { useAudioStream } from '../hooks/useAudioStream'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { StatusIndicator } from './StatusIndicator'
import { HostBars } from './HostBars'
import { MicButton } from './MicButton'
import { fetchStoryConfig } from '../lib/fetchStory'
import type { AppState, EndingPath, GameState, Language, Segment } from '../types'

interface Props {
  language: Language
  onLanguageChange: (lang: Language) => void
  onEnding: (path: EndingPath, replyText: string, participantVoiceId: string) => void
}

const segmentToPath: Partial<Record<Segment, EndingPath>> = {
  ENDING_1: 'breakout',
  ENDING_2: 'solid-win',
  ENDING_3: 'partial',
  ENDING_4: 'setback',
}

const labels: Record<Language, {
  welcomeTo: string
  subtitle: string
  goOnAir: string
  holdToSpeak: string
  pickLanguage: string
}> = {
  en: {
    welcomeTo: 'Welcome to',
    subtitle: 'A live podcast experience',
    goOnAir: 'Go On Air',
    holdToSpeak: 'Hold to speak',
    pickLanguage: 'Choose language',
  },
  pt: {
    welcomeTo: 'Bem-vindo ao',
    subtitle: 'Uma experiência de podcast ao vivo',
    goOnAir: 'Entrar no Ar',
    holdToSpeak: 'Segure para falar',
    pickLanguage: 'Escolha o idioma',
  },
}

export function BroadcastStudio({ language, onLanguageChange, onEnding }: Props) {
  const story = use(fetchStoryConfig())
  const { gameState, startGame, applyTurn } = useGameEngine()
  const { playTurn, analyserRef } = useAudioStream()
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder()
  const [appState, setAppState] = useState<AppState>('IDLE')
  const runningRef = useRef(false)
  const t = labels[language]

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
          language,
        })

        const state = await stateReady
        setAppState('NARRATOR_SPEAKING')
        const { narration } = await done
        applyTurn(state, playerReply, narration)

        if (state.segment.startsWith('ENDING')) {
          const path = (state.path ?? segmentToPath[state.segment] ?? 'setback') as EndingPath
          const replyText = story.participant.replyTexts[language][path]
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
    [story, playTurn, applyTurn, onEnding, language],
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-10 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500">{t.welcomeTo}</p>
          <h1 className="text-6xl md:text-7xl font-bold text-stone-100 tracking-tight leading-tight">
            {story.episodeTitle}
          </h1>
          <p className="text-stone-500 text-sm mt-3">{t.subtitle}</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-stone-600">{t.pickLanguage}</p>
          <div className="inline-flex border border-stone-700 rounded-md overflow-hidden">
            {(['en', 'pt'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={[
                  'px-4 py-1.5 text-xs tracking-wider uppercase transition-colors',
                  language === lang
                    ? 'bg-stone-200 text-stone-900'
                    : 'text-stone-400 hover:text-stone-200',
                ].join(' ')}
              >
                {lang === 'en' ? 'English' : 'Português'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="px-10 py-3 border border-red-500 text-red-400 text-sm tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors"
        >
          {t.goOnAir}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#0c0a09] px-6 py-10">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <StatusIndicator appState={appState} />
        <h1 className="text-2xl md:text-3xl font-bold text-stone-100 tracking-tight">
          {story.episodeTitle}
        </h1>
      </div>

      <HostBars appState={appState} analyserRef={analyserRef} />

      <div className="flex flex-col items-center gap-4">
        <MicButton
          onPressStart={handleMicDown}
          onPressEnd={handleMicUp}
          isRecording={isRecording}
          isDisabled={appState !== 'PLAYER_TURN'}
        />
        <p className="text-sm text-stone-400 tracking-wide min-h-[1.5rem]">
          {appState === 'PLAYER_TURN' ? t.holdToSpeak : ''}
        </p>
      </div>
    </div>
  )
}
