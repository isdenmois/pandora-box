import { Page } from 'playwright/test'
import { Series } from '../fixtures'
import { mockApi, mockRest } from '../utils'

export const SeriesMock = {
  mockAll(page: Page, data = []) {
    return mockApi(page, 'api/v1/series', data)
  },
  mockRest(page: Page, data: Series[] = []) {
    return mockRest(page, 'api/v1/series', data)
  },
}
