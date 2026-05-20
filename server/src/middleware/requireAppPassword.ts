import type { MiddlewareHandler } from 'hono'

/**
 * Gates the paid routes (Claude + ElevenLabs) behind a shared secret so a
 * public deployment can't be spammed into running up the API bill.
 *
 * Behavior:
 * - If APP_PASSWORD is unset (e.g. local dev), the gate is open — no friction.
 * - If APP_PASSWORD is set, requests must send a matching `x-app-password`
 *   header or get 401.
 *
 * The check reads process.env at request time so tests can toggle it per-case.
 */
export const requireAppPassword: MiddlewareHandler = async (c, next) => {
  const expected = process.env.APP_PASSWORD
  if (expected) {
    const provided = c.req.header('x-app-password')
    if (provided !== expected) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }
  await next()
}
