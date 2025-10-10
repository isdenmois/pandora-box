import { type Page } from 'playwright/test'
import { type Movie } from '../fixtures'
import { MovieMock } from '../mocks'

export class MovieBuilder {
  private readonly items: Movie[] = []

  constructor(private page: Page) {}

  addItem(...items: Movie[]) {
    this.items.push(...items)
  }

  async build() {
    await MovieMock.mockRest(this.page, this.items)
  }
}
