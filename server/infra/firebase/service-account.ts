import { createSign } from 'node:crypto'

/** The two fields of the service-account JSON we need; everything else is ignored. */
export interface ServiceAccount {
  clientEmail: string
  privateKey: string
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

/** Realtime Database admin access, plus the email scope the Admin SDK asks for. */
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email'

const TOKEN_TTL_S = 3600

/** Refresh a minute early so a token about to expire is never sent. */
const REFRESH_MARGIN_MS = 60_000

const TOKEN_TIMEOUT_MS = 10_000

export function decodeServiceAccount(encoded: string): ServiceAccount {
  let parsed: { client_email?: unknown; private_key?: unknown }

  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64 JSON')
  }

  if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is missing client_email or private_key')
  }

  return { clientEmail: parsed.client_email, privateKey: parsed.private_key }
}

/**
 * The OAuth2 JWT grant: a self-signed RS256 assertion, exchanged for an access token.
 * `iss`, `scope` and `aud` are the only claims the grant reads.
 */
export function signAssertion(account: ServiceAccount, issuedAtMs: number): string {
  const issuedAt = Math.floor(issuedAtMs / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: account.clientEmail,
    scope: SCOPES,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_S,
  }

  const unsigned = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(
    JSON.stringify(claims),
  ).toString('base64url')}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.privateKey)

  return `${unsigned}.${signature.toString('base64url')}`
}

export interface AccessTokenOptions {
  fetch?: typeof fetch
  now?: () => number
}

/** Exchanges a signed assertion only when the cached token is missing or stale. */
export function createAccessToken(account: ServiceAccount, options: AccessTokenOptions = {}) {
  const request = options.fetch ?? globalThis.fetch
  const now = options.now ?? Date.now
  let cached: { token: string; expiresAt: number } | null = null

  return async function accessToken(): Promise<string> {
    if (cached && now() < cached.expiresAt - REFRESH_MARGIN_MS) {
      return cached.token
    }

    const response = await request(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signAssertion(account, now()),
      }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')

      throw new Error(`Google token exchange failed: ${response.status}${detail ? ` ${detail.slice(0, 200)}` : ''}`)
    }

    const body = (await response.json()) as { access_token?: unknown; expires_in?: unknown }

    if (typeof body.access_token !== 'string') {
      throw new Error('Google token exchange returned no access_token')
    }

    const ttl = typeof body.expires_in === 'number' ? body.expires_in : TOKEN_TTL_S

    cached = { token: body.access_token, expiresAt: now() + ttl * 1000 }

    return cached.token
  }
}
