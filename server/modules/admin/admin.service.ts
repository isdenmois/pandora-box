import { Auth } from '../auth/service'

export const adminService = {
  async register(username: string, password: string) {
    if (!validateUsername(username)) {
      throw 'Invalid username (length should be >= 3 && <= 31)'
    }

    if (!validatePassword(password)) {
      throw 'Invalid password (length should be >= 6)'
    }

    await Auth.signUp(username, password)
  },
}

function validateUsername(username: unknown): username is string {
  return typeof username === 'string' && username.length >= 3 && username.length <= 31 && /^[a-z0-9_-]+$/.test(username)
}

function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6 && password.length <= 255
}
