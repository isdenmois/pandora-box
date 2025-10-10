import { type Page } from 'playwright/test'
import { Movie } from '../fixtures'
import { mockApi, mockRest } from '../utils'

export const MovieMock = {
  mockAll(page: Page, data = []) {
    return mockApi(page, 'api/v1/movie', data)
  },
  mockRest(page: Page, data: Movie[] = []) {
    return mockRest(page, 'api/v1/movie', data)
  },
}
