import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'

import * as AuthModel from './model'
import { db, table } from '../../db'
import { createSession } from './auth'

// If the class doesn't need to store a property,
// you may use `abstract class` to avoid class allocation
export abstract class Auth {
  static async login({ username, password }: AuthModel.signInBody) {
    const results = await db.select().from(table.user).where(eq(table.user.username, username))

    const existingUser = results[0]

    if (!existingUser) {
      throw 'Incorrect username or password'
    }

    const validPassword = verifyPassword(existingUser.passwordHash, password)

    if (!validPassword) {
      throw 'Incorrect username or password'
    }

    const session = await createSession(existingUser.id)

    return {
      session,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
    }
  }

  static async signUp(username: string, password: string) {
    const userId = randomUUID()
    const passwordHash = hashPassword(password)

    try {
      await db.insert(table.user).values({ id: userId, username, passwordHash })
    } catch {
      throw 'An error has occurred'
    }
  }
}

function hash(salt: string, password: string) {
  return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')

  return `${salt}${hash(salt, password)}`
}

function verifyPassword(passwordHash: string, password: string) {
  const salt = passwordHash.slice(0, 32)
  const storedHash = passwordHash.slice(32)

  return hash(salt, password) === storedHash
}
