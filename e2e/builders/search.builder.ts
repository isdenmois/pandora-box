import { type Page } from 'playwright/test'
import { type SearchItem, SearchItemDetails } from '../fixtures'
import { SearchMock } from '../mocks'

export class SearchBuilder {
  private items: SearchItem[] = []
  private details: SearchItemDetails[] = []

  constructor(
    private page: Page,
    private provider = 'omdb',
  ) {}

  addItem(...item: SearchItem[]) {
    this.items.push(...item)

    return this
  }

  addDetails(...item: SearchItemDetails[]) {
    this.details.push(...item)

    return this
  }

  async build() {
    await SearchMock.mockExternal(this.page, this.provider, this.items)

    for (const detail of this.details) {
      await SearchMock.mockDetails(this.page, this.provider, detail)
    }
  }
}
