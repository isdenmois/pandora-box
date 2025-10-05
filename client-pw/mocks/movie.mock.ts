import { Page } from 'playwright/test'
import { mockApi, mockRest } from '../utils'
import { Movie } from '../fixtures'

export const MovieMock = {
  mockAll(page: Page, data = []) {
    return mockApi(page, 'api/v1/movie', data)
  },
  mockRest(page: Page, data: Movie[] = []) {
    return mockRest(page, 'api/v1/movie', data)
  },
}
