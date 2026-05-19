import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { storyRoute } from './routes/story.js'
import { transcribeRoute } from './routes/transcribe.js'
import { turnRoute } from './routes/turn.js'
import { ttsRoute } from './routes/tts.js'

export const app = new Hono()

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())

app.use(
  '/api/*',
  cors({
    origin: (origin) => (origin && allowedOrigins.includes(origin) ? origin : null),
  }),
)

app.route('/api/story', storyRoute)
app.route('/api/transcribe', transcribeRoute)
app.route('/api/turn', turnRoute)
app.route('/api/tts', ttsRoute)

const port = Number(process.env.PORT ?? 3001)

// Start the HTTP server only when running directly (not when imported by tests).
// Vitest sets process.env.VITEST='true', which is the most reliable cross-platform check.
if (!process.env.VITEST) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}
