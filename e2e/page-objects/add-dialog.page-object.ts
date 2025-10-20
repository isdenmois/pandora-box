import { type Page } from 'playwright/test'

export class AddDialogPageObject {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByTestId('dialog-add')
  }

  get header() {
    return this.dialog.getByRole('heading')
  }

  get titleInput() {
    return this.dialog.getByRole('textbox', { name: 'title' })
  }

  get seasonPlus() {
    return this.dialog.getByTestId('season-plus')
  }

  get button() {
    return this.dialog.getByRole('button', { name: 'Add' })
  }
}
