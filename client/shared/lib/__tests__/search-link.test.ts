import { expect, test } from 'vitest'
import { searchLink } from '../search-link'

test('searchLink', () => {
  import.meta.env.VITE_SEARCH_URL = 'http://localhost?q='

  expect(searchLink('test')).toBe('http://localhost?q=test')
  expect(searchLink('test 1')).toBe('http://localhost?q=test%201')
  expect(searchLink('test & request')).toBe('http://localhost?q=test%20%26%20request')
})
