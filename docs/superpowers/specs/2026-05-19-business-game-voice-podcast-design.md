# Business Game — Voice Podcast Interactive Story

**Date:** 2026-05-19  
**Status:** Approved  

---

## Concept

A single-session, voice-only interactive story game in the format of a podcast episode called **"Business Game"**. The player is the guest. The host (AI narrator) runs the show. The player speaks their answers live — no typing, no text to read. The experience lives entirely in audio.

The game ends with a reveal: a podcast audience participant, whose business problem the guest helped solve live on air, sends a message a month later reporting the outcome of the advice.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast dev, clean component structure, employer-readable code |
| Backend | Express.js | Persistent process (no cold starts), WebSocket-ready, native audio streaming |
| TTS | ElevenLabs (streamed) | Audio starts playing ~300–500ms after request, no silence gaps |
| STT | ElevenLabs Scribe | Consistent with TTS vendor, no second API to manage |
| AI narration | Claude Sonnet | Story logic, prose generation, internal scoring |
| Deployment | Railway (~$1/mo hobby) | Always-on, permanent URL, single `railway up` deploy |

API keys are never exposed to the browser — all ElevenLabs and Claude calls go through the Express backend.

---

## UI Design

**Broadcast Studio** aesthetic. Fullscreen dark background, warm tones.

States:
- **Narrator speaking** — `ON AIR` indicator glows red, animated audio bars pulse with the voice stream
- **Player's turn** — `ON AIR` dims, green mic indicator appears, mic button becomes active (push-to-talk: hold to record, release to send)
- **Processing** — neutral standby state while STT + Claude + TTS pipeline runs
- **Ending reveal** — screen shifts for the participant's reply, a different voice plays

No story text is ever displayed. The player never reads anything — they only listen and speak.

---

## Episode Structure

### Milestone 1 — Introduction
Host introduces "Business Game" and welcomes the guest (the player). Asks 1–2 warm-up questions:
- Player's background / what they do
- One business belief they hold strongly

Claude uses the player's answers to calibrate the host's tone and personalise subsequent questions.

### Milestone 2 — Business Tips Segment
Host presents 2–3 sharp audience questions on business topics: handling failure, team building, pricing decisions, or similar. Player answers each one live.

Claude internally evaluates the quality, specificity, and clarity of the answers. This produces a hidden running score that influences which ending path the player is on.

### Milestone 3 — Live Participant Challenge
Host announces a live participant from the online audience. The participant (a different ElevenLabs voice) describes their real business problem. The player must:
1. Ask clarifying questions if needed
2. Give a concrete, actionable implementation plan

The specificity, practicality, and structure of the player's plan is the primary driver of the final ending.

### Time Skip: "A month later..."
Host narrates the passage of time. Participant sends their reply.

---

## The Four Endings

Endings are determined by Claude's hidden scoring across Milestones 2 and 3. Score thresholds map to endings.

| Ending | Trigger | Participant reply |
|---|---|---|
| **1 — Breakout** | Exceptional tips + specific, actionable plan | Business transformed. Episode went viral. Guest invited back as recurring expert. |
| **2 — Solid Win** | Good tips + solid plan | Plan worked, took longer than expected. Participant reports growth, credits the guest's clarity. |
| **3 — Partial** | Vague tips or vague plan | Participant pivoted away from the plan mid-way. Some progress but mixed feedback. |
| **4 — Setback** | Poor tips + generic plan | Plan failed. Participant shares the struggle. Host diplomatically closes the episode. Guest learns. |

---

## Architecture

### Data Flow — One Turn
```
Player speaks → ElevenLabs Scribe (STT) → Claude (story logic + scoring + prose) → ElevenLabs TTS (streamed) → Player hears
```
Steps 2–4 (STT, Claude, TTS) run through the Express backend. The browser records audio and plays the returned audio stream — API keys never touch the client.

### Frontend Components

```
src/
├── components/
│   ├── BroadcastStudio.tsx     # Main game screen — ON AIR, audio bars, mic button
│   ├── AudioVisualizer.tsx     # Animated bars driven by TTS audio stream amplitude
│   ├── MicButton.tsx           # Hold-to-speak, shows recording state visually
│   ├── StatusIndicator.tsx     # ON AIR / YOUR TURN / STANDBY states
│   └── EndingScreen.tsx        # Participant reply reveal, replay option
├── hooks/
│   ├── useAudioPlayer.ts       # Streams TTS audio via Web Audio API
│   ├── useVoiceRecorder.ts     # Records mic, sends blob to backend for STT
│   └── useGameEngine.ts        # Game state machine: segment, path, score
├── engine/
│   └── storyConfig.ts          # Episode JSON: milestones, participant problem, endings
└── App.tsx
```

### Backend API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/speak` | POST | Text → ElevenLabs TTS → streamed audio chunks |
| `/api/transcribe` | POST | Audio blob → ElevenLabs Scribe → transcript string |
| `/api/narrate` | POST | Game state + player reply → Claude → next narration + updated state |
| `/api/story` | GET | Returns the episode config JSON |

### Game State Machine

```
INTRO → TIPS → CHALLENGE → SCORING → ENDING_1 | ENDING_2 | ENDING_3 | ENDING_4
```

`useGameEngine` tracks: `{ segment, turnCount, score, path, history }`.

The `/api/narrate` endpoint receives the full conversation history, current segment, and a hidden system prompt (scoring rubric). It returns:
```json
{
  "narration": "Host's next spoken line",
  "state": { "segment": "TIPS", "score": 72, "path": "solid-win" }
}
```

### Voices

| Role | Voice |
|---|---|
| Host (narrator) | ElevenLabs — authoritative, professional (e.g. "Daniel") |
| Participant (caller) | ElevenLabs — warmer, different voice (e.g. "Rachel") |

---

## Story Content

The specific business scenario for the participant's problem is **TBD** — to be written as a JSON config. The architecture is fully content-agnostic. Swapping the story requires only editing `storyConfig.ts`.

**What is pre-written (in `storyConfig.ts`):**
- The participant's name, business context, and problem description
- The 4 ending outcome messages (participant's reply texts)
- Milestone labels and segment order
- Scoring thresholds that map score ranges to endings

**What Claude generates dynamically:**
- All host dialogue (questions, transitions, reactions to player answers)
- The narration connecting segments
- The host's closing lines for each ending (Claude receives the ending type and writes the farewell)

---

## Setup Steps (Pre-Build)

1. Install ElevenLabs skills: `npm skills add elevenlabs/skills`
2. Configure ElevenLabs MCP server
3. Scaffold project: `npm create vite@latest` (React + TypeScript)
4. Add Tailwind, Express backend, Railway config

---

## Out of Scope

- User accounts or saved progress
- Multiple episodes
- Visual story text
- Mobile-native app (web browser only)
- Multiplayer
