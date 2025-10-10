import { describe, it, expect } from 'vitest'
import { WretchError } from 'wretch/resolver'
import { getMessage } from '../get-message'

describe('getMessage', () => {
  it('should return the message from an error object', () => {
    // arrange
    const errorMessage = 'Something went wrong!'
    const error = new Error(errorMessage)

    // act
    const result = getMessage(error)

    // assert
    expect(result).toBe(errorMessage)
  })

  it('should return the json message from a WretchError', async () => {
    // arrange
    const errorMessage = 'Network error'
    const wretchError = new WretchError()

    wretchError.json = { message: errorMessage }

    // act
    const result = await getMessage(wretchError)

    // assert
    expect(result).toBe(errorMessage)
  })

  it('should return the string representation of an unknown error', () => {
    // arrange
    const error = 12345

    // act
    const result = getMessage(error)

    // assert
    expect(result).toBe('12345')
  })
})
