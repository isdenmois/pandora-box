import type { Page } from 'playwright/test'
import { adminUser, type User } from '../fixtures'
import { mockApi } from '../utils'

export const UserMock = {
  mockCurrent(page: Page, data: User = adminUser) {
    return mockApi(page, 'api/v1/user/current', data)
  },
  mockList(page: Page, data: User[] = [adminUser]) {
    return mockApi(
      page,
      'api/v1/user',
      data.map(({ id, username }) => ({ id, username })),
    )
  },
}
