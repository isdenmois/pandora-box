import wretch from 'wretch'
import type { FetchLike } from 'wretch'
import jwt from 'jwt-decode'
import { env } from '$env/dynamic/private'
import type { JwtPayload } from 'jwt-decode'

const apikey = env.TVDB_APIKEY
let currentToken: string | null = null

const getToken = async (): Promise<string | null> => {
  const token = currentToken

  if (token) {
    const expiration = token ? jwt<JwtPayload>(token).exp ?? 0 : 0

    if (expiration > Date.now() / 1000 + 1) {
      return token
    }
  }

  return null
}

const setToken = async (token: string): Promise<void> => {
  currentToken = token
}

const login = () =>
  wretch('https://api.thetvdb.com/login')
    .json({ apikey })
    .post()
    .res((response) => response.json())
    .then(({ token }) => <string>token)

export const authMiddleware =
  (next: FetchLike): FetchLike =>
  async (url, options) => {
    let token = await getToken()

    if (!token) {
      token = await login()

      setToken(token)
    }

    return next(url, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }
