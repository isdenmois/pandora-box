import { pbkdf2Sync, randomBytes } from 'node:crypto'

function hash(salt: string, password: string) {
  return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')

  return `${salt}${hash(salt, password)}`
}

export function verifyPassword(passwordHash: string, password: string) {
  const salt = passwordHash.slice(0, 32)
  const storedHash = passwordHash.slice(32)

  return hash(salt, password) === storedHash
}
