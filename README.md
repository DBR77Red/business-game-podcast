# Business Game Podcast

A voice-only interactive podcast game. You are the guest on an AI-hosted business show: the host interviews you live, you answer out loud, you help a listener (Marco) solve a real business problem, and a month later you hear how your advice played out. No text to read — the entire experience is audio. Available in **English** and **Brazilian Portuguese**.

Built as a technical showcase: real-time voice in, streamed voice out, a Claude-driven narrative state machine, and a sub-second perceived latency pipeline.

---

## How it plays

1. **Go On Air** — pick a language, the host welcomes you.
2. **Intro** — the host asks about your background and a core business belief.
3. **Tips** — sharp business questions; your answers are scored invisibly.
4. **Challenge** — Marco describes his 40%-client-churn problem; you ask clarifying questions and give an implementation plan.
5. **The reveal** — a month later, Marco sends an update. One of four endings (Breakout / Solid Win / Partial / Setback) depending on how good your advice was.

The mic is push-to-talk: hold to speak, release to send.

---

## Architecture

```
                          ┌─────────────────────────────────────────────┐
  Browser (React 19)      │            Hono server (Node)               │
                          │                                             │
  ┌──────────────┐  audio │  ┌──────────────┐                           │
  │useVoiceRecord│────────┼─▶│/api/transcribe│──▶ ElevenLabs Scribe STT  │
  └──────────────┘ (webm) │  └──────────────┘                           │
         │ transcript     │                                             │
         ▼                │  ┌──────────────┐   stream    ┌───────────┐ │
  ┌──────────────┐  JSON  │  │  /api/turn   │────tokens──▶│  Claude   │ │
  │useAudioStream│────────┼─▶│  (SSE)       │◀────────────│ (Sonnet)  │ │
  └──────────────┘        │  └──────┬───────┘             └───────────┘ │
         ▲                │         │ per sentence                      │
         │ SSE: state,    │         ▼                                   │
         │ audio[], done  │   ┌──────────────┐                          │
         │                │   │ SentenceBuffer│──▶ ElevenLabs TTS stream │
         └────────────────┼───┴──────────────┘                          │
                          └─────────────────────────────────────────────┘
```

**The turn pipeline (`/api/turn`)** is the heart of the project. Instead of waiting for Claude's full reply before synthesizing speech, the server:

1. Streams Claude's tokens.
2. Parses a one-line JSON state header (`segment`, `score`, `path`) and forwards it to the client immediately.
3. Buffers the remaining tokens into complete sentences (`SentenceBuffer`).
4. Sends each finished sentence to ElevenLabs TTS as soon as it's ready.
5. Emits Server-Sent Events back to the browser: a `state` event, an `audio` event per sentence (base64 mp3), and a final `done` event with the full narration text.

The browser decodes each audio chunk and plays them sequentially through the Web Audio API, routing amplitude into an `AnalyserNode` so the on-screen bars react to the host's actual voice. **Perceived latency from mic-release to first audio is ~600–800ms** instead of the ~3s a wait-for-everything approach would cost.

The narrative is a deterministic state machine (`IDLE → INTRO → TIPS → CHALLENGE → ENDING_1..4`). The client tracks how many replies have happened in the current segment (`segmentTurnCount`) and the system prompt uses that to advance reliably, rather than asking the model to count.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 19** (`use()` + Suspense), **Vite 8**, **TypeScript 6** | Modern data-loading for the story config; fast dev/build |
| Styling | **Tailwind CSS v4** (`@theme inline`), **shadcn/ui** ("base-nova") on **@base-ui/react** | Token-driven theming, no `tailwind.config.js` |
| Backend | **Hono** on `@hono/node-server` | Web-Standards request/response, native streaming, multi-runtime; tests run against `app.request()` with no HTTP server |
| AI | **@anthropic-ai/sdk** (streaming Messages API) | Story logic, hidden scoring, prose generation |
| Voice | **@elevenlabs/elevenlabs-js** | Streamed TTS + Scribe STT, multilingual |
| Tests | **Vitest 3** + **React Testing Library** | 37 tests across client and server |
| Deploy | **Railway** | Always-on Node process, single command |

API keys never reach the browser — every ElevenLabs and Claude call goes through the Hono backend.

---

## Project structure

```
.
├── client/                      # React + Vite frontend
│   └── src/
│       ├── hooks/
│       │   ├── useGameEngine.ts     # segment/score/history state machine
│       │   ├── useVoiceRecorder.ts  # MediaRecorder push-to-talk → /api/transcribe
│       │   └── useAudioStream.ts     # SSE consumer + Web Audio queue + AnalyserNode
│       ├── components/
│       │   ├── BroadcastStudio.tsx   # main game loop (uses React 19 use())
│       │   ├── HostBars.tsx          # 8-bar voice visualizer (frequency-driven)
│       │   ├── MicButton.tsx         # push-to-talk
│       │   ├── StatusIndicator.tsx   # ON AIR / YOUR TURN / STANDBY
│       │   ├── EndingScreen.tsx       # participant reply playback
│       │   └── ErrorScreen.tsx        # error boundary
│       ├── lib/fetchStory.ts          # cached promise for use()
│       └── App.tsx                    # Suspense + ending routing
├── server/                      # Hono backend
│   └── src/
│       ├── index.ts                   # app + routes + (prod) static serving
│       ├── routes/
│       │   ├── story.ts               # GET  /api/story   (episode config, EN+PT)
│       │   ├── transcribe.ts          # POST /api/transcribe (Scribe STT)
│       │   ├── turn.ts                # POST /api/turn   (streaming SSE pipeline)
│       │   └── tts.ts                 # POST /api/tts    (one-shot TTS, no Claude)
│       ├── prompts/hostSystemPrompt.ts
│       └── lib/sentenceBuffer.ts       # streaming sentence splitter
├── railway.json                 # deploy config
└── package.json                 # root: concurrently runs both workspaces
```

---

## Local setup

**Prerequisites:** Node 20+, an [ElevenLabs API key](https://elevenlabs.io/app/settings/api-keys), an [Anthropic API key](https://console.anthropic.com/settings/keys).

```bash
# from the repo root
npm install
npm install --prefix client
npm install --prefix server
```

Create `.env` at the repo root (see `.env.example`):

```
ELEVENLABS_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
```

Run both client and server:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (Vite proxies `/api/*` to it)

Open the client, allow microphone access, and click **Go On Air**.

---

## Testing

```bash
npm test            # client + server
npm run test:client
npm run test:server
```

37 tests: the streaming `SentenceBuffer`, all four API routes, the three hooks, and the UI components.

---

## Deployment (Railway)

The server serves the built client in production (`NODE_ENV=production`). `railway.json` builds both workspaces and starts `node server/dist/index.js`.

```bash
npm install -g @railway/cli
railway login
railway init
# set ELEVENLABS_API_KEY, ANTHROPIC_API_KEY, HOST_VOICE_ID,
# PARTICIPANT_VOICE_ID, NODE_ENV=production in the Railway dashboard
railway up
railway domain
```

Don't set `PORT` (Railway injects it). `CORS_ORIGINS` is unnecessary in production since the client is served from the same origin.

---

## Notable engineering details

- **Sentence-streamed TTS** for ~700ms perceived latency (`server/src/routes/turn.ts` + `lib/sentenceBuffer.ts`).
- **Real audio-reactive visuals** via Web Audio `AnalyserNode`, not canned animation (`hooks/useAudioStream.ts` → `components/HostBars.tsx`).
- **React 19 `use()` + Suspense** for the story config — no `useEffect`/`useState` fetch dance (`lib/fetchStory.ts`, `App.tsx`).
- **Deterministic narrative state machine** — the prompt advances on a client-tracked per-segment reply count rather than trusting the model to count.
- **Hono on Web Standards** — the same `app` runs on Node/Bun/Deno/Workers; tests call `app.request(new Request(...))` with no live server.
