import { Page } from 'playwright/test'
import { SearchItem, SearchItemDetails } from '../fixtures'
import { mockApi } from '../utils'

export const SearchMock = {
  mockExternal(page: Page, provider: string, data: SearchItem[]) {
    return mockApi(page, `api/v1/search/external/${provider}?q=*`, data)
  },
  mockDetails(page: Page, provider: string, data: SearchItemDetails) {
    return mockApi(page, `api/v1/search/external/${provider}/${data.id}`, data)
  },
}
