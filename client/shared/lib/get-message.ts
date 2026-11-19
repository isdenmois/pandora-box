import { ApiError } from '../api/error'

export const getMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return String(error)
}
