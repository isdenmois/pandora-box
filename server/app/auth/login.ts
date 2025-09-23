import { sessionRepository, userRepository } from '../../infra'
import { verifyPassword } from '../../shared'

export async function login(username: string, password: string) {
  const user = await userRepository.getByUsername(username)

  if (!user) {
    throw 'Incorrect username or password'
  }

  const validPassword = verifyPassword(user.passwordHash, password)

  if (!validPassword) {
    throw 'Incorrect username or password'
  }

  const session = await sessionRepository.create(user.id)

  return {
    session,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  }
}
