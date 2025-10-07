import { Page } from 'playwright/test'
import { adminUser, User } from '../fixtures'
import { mockApi } from '../utils'

export const UserMock = {
  mockCurrent(page: Page, data: User = adminUser) {
    return mockApi(page, 'api/v1/user/current', data)
  },
}
