import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createAccessToken, decodeServiceAccount, signAssertion } from '../service-account'

/** A throwaway keypair: the tests verify the signature exactly as Google would. */
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const account = { clientEmail: 'backup@pandora-box.iam.gserviceaccount.com', privateKey }

const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const decodeSegment = (segment: string) => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))

describe('decodeServiceAccount', () => {
  it('decodes the base64 JSON and keeps the PEM newlines', () => {
    // act
    const decoded = decodeServiceAccount(encoded({ client_email: account.clientEmail, private_key: privateKey }))

    // assert
    expect(decoded).toEqual(account)
    expect(decoded.privateKey.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true)
  })

  it('rejects a value that is not base64 JSON', () => {
    // act & assert
    expect(() => decodeServiceAccount('not-a-key')).toThrow('FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64 JSON')
  })

  it('rejects a key file without the fields we sign with', () => {
    // act & assert
    expect(() => decodeServiceAccount(encoded({ project_id: 'box' }))).toThrow(
      'FIREBASE_SERVICE_ACCOUNT_B64 is missing client_email or private_key',
    )
  })
})

describe('signAssertion', () => {
  const issuedAt = Date.UTC(2026, 0, 1)

  it('signs an RS256 assertion Google can verify', () => {
    // act
    const [header, claims, signature] = signAssertion(account, issuedAt).split('.')

    // assert
    expect(decodeSegment(header!)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(
      createVerify('RSA-SHA256').update(`${header}.${claims}`).verify(publicKey, Buffer.from(signature!, 'base64url')),
    ).toBe(true)
  })

  it('carries the issuer, audience and database scope the grant reads', () => {
    // act
    const claims = decodeSegment(signAssertion(account, issuedAt).split('.')[1]!)

    // assert
    expect(claims.iss).toBe(account.clientEmail)
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token')
    expect(claims.scope).toContain('https://www.googleapis.com/auth/firebase.database')
    expect(claims.exp - claims.iat).toBe(3600)
  })
})

describe('createAccessToken', () => {
  const responseWith = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

  it('exchanges the assertion for a token and caches it', async () => {
    // arrange
    let issued = 0
    let clock = Date.UTC(2026, 0, 1)
    const fetchMock = vi.fn(async () => {
      issued += 1

      return responseWith({ access_token: `token-${issued}`, expires_in: 3600 })
    })
    const token = createAccessToken(account, { fetch: fetchMock as unknown as typeof fetch, now: () => clock })

    // act
    const first = await token()
    const second = await token()

    // assert
    expect(first).toBe('token-1')
    expect(second).toBe('token-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // act: a full TTL later the cache is past its refresh margin
    clock += 3_600_000

    // assert
    expect(await token()).toBe('token-2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sends the jwt-bearer grant to the token endpoint', async () => {
    // arrange
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      responseWith({ access_token: 'token-1', expires_in: 3600 }),
    )
    const token = createAccessToken(account, { fetch: fetchMock as unknown as typeof fetch })

    // act
    await token()

    // assert
    const [url, init] = fetchMock.mock.calls[0]!

    expect(url).toBe('https://oauth2.googleapis.com/token')
    expect(init.method).toBe('POST')
    expect(String(init.body)).toContain('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer')
    expect(String(init.body)).toContain('assertion=')
  })

  it('reports a rejected exchange', async () => {
    // arrange
    const fetchMock = vi.fn(async () => new Response('invalid_grant', { status: 400 }))
    const token = createAccessToken(account, { fetch: fetchMock as unknown as typeof fetch })

    // act & assert
    await expect(token()).rejects.toThrow('Google token exchange failed: 400 invalid_grant')
  })
})
