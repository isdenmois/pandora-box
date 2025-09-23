import { sessionRepository } from '../../infra'

export async function validate(sessionId: string) {
  const result = await sessionRepository.getById(sessionId)

  if (!result) {
    return { session: null, user: null }
  }

  const { session, user } = result

  const sessionExpired = Date.now() >= session.expiresAt.getTime()

  if (sessionExpired) {
    sessionRepository.delete(session.id)
    return { session: null, user: null }
  }

  return { session, user }
}

export type ValidSession = Awaited<ReturnType<typeof validate>>
