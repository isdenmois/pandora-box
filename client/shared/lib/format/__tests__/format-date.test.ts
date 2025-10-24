import { expect, test } from 'vitest'
import { formatDate } from '../format-date'

test('formatDate', () => {
  expect(formatDate('2025-10-24')).toBe('24.10.2025')
})
