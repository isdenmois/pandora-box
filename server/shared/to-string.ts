export function toString(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    if ('message' in error) {
      return String(error.message)
    }
  }

  return String(error)
}
