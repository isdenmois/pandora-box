import { Page } from 'playwright/test'
import { Series } from '../fixtures'
import { SeriesMock } from '../mocks'

export class SeriesBuilder {
  private readonly series: Series[] = []

  constructor(private page: Page) {}

  addItem(...items: Series[]) {
    this.series.push(...items)
  }

  async build() {
    await SeriesMock.mockRest(this.page, this.series)
  }
}
