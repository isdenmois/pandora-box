import { type Page } from 'playwright/test'

export class HomePageObject {
  constructor(private readonly page: Page) {}

  get headers() {
    return this.page.getByRole('heading')
  }

  get searchButton() {
    return this.page.getByTestId('search-button')
  }

  series(id: string) {
    return this.page.getByTestId(`series-${id}`)
  }

  movie(id: string) {
    return this.page.getByTestId(`movie-${id}`)
  }
}
