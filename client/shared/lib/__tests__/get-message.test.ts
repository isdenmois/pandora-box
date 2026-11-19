import { describe, expect, it } from 'vitest'
import { ApiError } from '../../api/error'
import { getMessage } from '../get-message'

describe('getMessage', () => {
  it('should return the message from an Error', () => {
    // arrange
    const errorMessage = 'Something went wrong!'
    const error = new Error(errorMessage)

    // act
    const result = getMessage(error)

    // assert
    expect(result).toBe(errorMessage)
  })

  it('should return the message of an ApiError envelope', () => {
    // arrange
    const error = new ApiError('not_found', 'Not found', 404)

    // act
    const result = getMessage(error)

    // assert
    expect(result).toBe('Not found')
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
