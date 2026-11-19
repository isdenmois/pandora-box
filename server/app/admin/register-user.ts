import { userRepository } from '@server/infra'
import { hashPassword } from '@server/shared'

export async function registerUser(username: string, password: string) {
  const passwordHash = hashPassword(password)

  try {
    await userRepository.createUser(username, passwordHash)
  } catch {
    throw 'An error has occurred'
  }
}
