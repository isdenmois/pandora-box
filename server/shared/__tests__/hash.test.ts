import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../hash'

describe('password hashing', () => {
  it('stores a 32-character salt followed by a 128-character hash', () => {
    // arrange
    const password = 'secret'

    // act
    const hash = hashPassword(password)

    // assert
    expect(hash).toMatch(/^[0-9a-f]{32}[0-9a-f]{128}$/)
  })

  it('verifies the password it was built from', () => {
    // arrange
    const hash = hashPassword('secret')

    // act
    const valid = verifyPassword(hash, 'secret')

    // assert
    expect(valid).toBe(true)
  })

  it('rejects a different password', () => {
    // arrange
    const hash = hashPassword('secret')

    // act
    const valid = verifyPassword(hash, 'not-secret')

    // assert
    expect(valid).toBe(false)
  })

  it('salts every hash so the same password is stored differently', () => {
    // arrange

    // act
    const first = hashPassword('secret')
    const second = hashPassword('secret')

    // assert
    expect(first).not.toBe(second)
    expect(verifyPassword(first, 'secret')).toBe(true)
    expect(verifyPassword(second, 'secret')).toBe(true)
  })

  it('rejects a tampered hash', () => {
    // arrange
    const hash = hashPassword('secret')
    const tampered = `${hash.slice(0, -1)}${hash.endsWith('a') ? 'b' : 'a'}`

    // act
    const valid = verifyPassword(tampered, 'secret')

    // assert
    expect(valid).toBe(false)
  })

  it('rejects a malformed stored hash instead of throwing', () => {
    // arrange

    // act
    const valid = verifyPassword('too-short', 'secret')

    // assert
    expect(valid).toBe(false)
  })
})
