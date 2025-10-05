import { Page } from 'playwright/test'

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

  get seasonInput() {
    return this.dialog.getByRole('textbox', { name: 'season' })
  }

  get button() {
    return this.dialog.getByRole('button')
  }
}
