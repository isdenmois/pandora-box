import { Page } from 'playwright/test'

export class SearchDialogPageObject {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByTestId('dialog-search')
  }

  get input() {
    return this.dialog.getByRole('textbox')
  }

  get foundSeries() {
    return this.dialog.getByTestId('search-series-tt1')
  }

  get foundMovie() {
    return this.dialog.getByTestId('search-movie-tt2')
  }
}
