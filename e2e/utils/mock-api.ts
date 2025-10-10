import { type Page } from 'playwright/test'

export const mockApi = <T>(page: Page, url: string, json: T) =>
  page.route(`**/${url}`, async (route) => {
    await route.fulfill({ json })
  })

export const mockRest = <T>(page: Page, url: string, json: T[]) => {
  let id = 1

  return page.route(`**/${url}`, async (route) => {
    const method = route.request().method()

    if (method === 'GET') {
      return await route.fulfill({ json })
    }

    if (method === 'POST') {
      const data = {
        ...route.request().postDataJSON(),
        id: String(id++),
      }

      json.push(data)

      return await route.fulfill({ json: data })
    }

    return await route.continue()
  })
}
