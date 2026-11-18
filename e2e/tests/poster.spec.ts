import { expect, test } from '@playwright/test'
import { MovieBuilder } from '../builders/movie.builder'
import { posterMovie } from '../fixtures'
import { UserMock } from '../mocks'
import { HomePageObject } from '../page-objects'

/** A 1x1 png, enough for the browser to fire `load` instead of `error`. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('poster images', async ({ page }) => {
  const homePageObject = new HomePageObject(page)
  const card = homePageObject.movie(posterMovie.id)

  await test.step('Render a stored poster from /images', async () => {
    // arrange
    await UserMock.mockCurrent(page)
    await page.route('**/images/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))

    const builder = new MovieBuilder(page)
    builder.addItem(posterMovie)
    await builder.build()

    // act
    await page.goto('/')

    // assert
    await expect(card).toBeVisible()
    await expect(card.locator('img')).toHaveAttribute('src', posterMovie.poster as string)
  })

  await test.step('Fall back to the placeholder when the file is missing', async () => {
    // arrange
    // Routes match in reverse order, so this one wins over the successful response above.
    await page.route('**/images/**', (route) => route.fulfill({ status: 404 }))

    // act
    await page.reload()

    // assert
    await expect(card).toBeVisible()
    await expect(card.locator('img')).toHaveCount(0)
  })
})
