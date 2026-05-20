import type { StoryConfig } from '../types'

let cached: Promise<StoryConfig> | null = null

async function fetchWithRetry(retries = 10, delayMs = 1500): Promise<StoryConfig> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch('/api/story')
      if (!r.ok) throw new Error(`fetchStoryConfig failed: ${r.status}`)
      return (await r.json()) as StoryConfig
    } catch (err) {
      lastErr = err
      if (attempt < retries) await new Promise((res) => setTimeout(res, delayMs))
    }
  }
  throw lastErr
}

/**
 * Returns a stable promise resolving to the episode config from /api/story.
 * Cached at module scope so React 19's `use()` hook sees the same promise
 * on every render — without that stability, `use()` would loop forever.
 *
 * Retries through the dev cold-start window: under `npm run dev`, Vite is
 * ready in ~200ms but the backend takes a few seconds to boot, so the first
 * fetch would otherwise 502. We retry for ~15s before surfacing the error.
 *
 * Cache lifetime: the page lifetime. Refreshing the tab refetches.
 * "Play Again" intentionally reuses the cached config; if /api/story ever
 * becomes per-session randomized, expose a `clearStoryCache()` helper here.
 */
export function fetchStoryConfig(): Promise<StoryConfig> {
  if (!cached) {
    cached = fetchWithRetry().catch((err) => {
      // Don't poison the cache permanently — let a later render retry.
      cached = null
      throw err
    })
  }
  return cached
}
