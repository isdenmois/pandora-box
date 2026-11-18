import { Elysia } from 'elysia'
import { describe, expect, it } from 'vitest'
import { bearerToken, createBackupTokenGuard, tokenMatches } from '../backup-token.guard'

const TOKEN = 'f0a4e1c7-2b7e-4f2f-9a41-6d0f1f2c9b3e'

const appWith = (expected: string | undefined) =>
  new Elysia().use(createBackupTokenGuard(expected)).post('/', () => 'ok')

const call = (expected: string | undefined, authorization?: string) =>
  appWith(expected).handle(
    new Request('http://localhost/', {
      method: 'POST',
      headers: authorization ? { authorization } : undefined,
    }),
  )

describe('tokenMatches', () => {
  it('only accepts an identical secret', () => {
    // act & assert
    expect(tokenMatches(TOKEN, TOKEN)).toBe(true)
    expect(tokenMatches('nope', TOKEN)).toBe(false)
    // A shorter guess must not throw, which `timingSafeEqual` would on a length mismatch.
    expect(tokenMatches('x', TOKEN)).toBe(false)
    expect(tokenMatches(undefined, TOKEN)).toBe(false)
    expect(tokenMatches(TOKEN, undefined)).toBe(false)
  })
})

describe('bearerToken', () => {
  it('reads the credential out of the header, whatever the scheme case', () => {
    // act & assert
    expect(bearerToken(`Bearer ${TOKEN}`)).toBe(TOKEN)
    expect(bearerToken(`bearer ${TOKEN}`)).toBe(TOKEN)
    expect(bearerToken(`Basic ${TOKEN}`)).toBeUndefined()
    expect(bearerToken(undefined)).toBeUndefined()
  })
})

describe('backup token guard', () => {
  it('answers 503 when no token is configured, so the feature reads as off', async () => {
    // act
    const response = await call(undefined, `Bearer ${TOKEN}`)

    // assert
    expect(response.status).toBe(503)
  })

  it('answers 401 without a header', async () => {
    // act
    const response = await call(TOKEN)

    // assert
    expect(response.status).toBe(401)
  })

  it('answers 401 for a wrong token', async () => {
    // act
    const response = await call(TOKEN, 'Bearer wrong-token')

    // assert
    expect(response.status).toBe(401)
  })

  it('lets the matching token through', async () => {
    // act
    const response = await call(TOKEN, `Bearer ${TOKEN}`)

    // assert
    expect(response.status).toBe(200)
  })
})
