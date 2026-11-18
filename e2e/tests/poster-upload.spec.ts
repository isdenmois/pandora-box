import { expect, type Page, test } from '@playwright/test'
import { SeriesBuilder } from '../builders'
import { MovieBuilder } from '../builders/movie.builder'
import { type Movie, posterMovie } from '../fixtures'
import { UserMock } from '../mocks'
import { HomePageObject } from '../page-objects'

/** A 1x1 png; the server checks the IEND marker, so it has to be a whole file. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** A manual record: no `extId`, so opening its details never looks anything up. */
const manualMovie = {
  ...posterMovie,
  provider: 'manual',
  extId: null,
  posterSource: null,
} as Movie

const mockPixel = (page: Page) =>
  page.route('**/images/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))

test('poster upload from the edit form', async ({ page }) => {
  const homePageObject = new HomePageObject(page)
  const updated = { ...manualMovie, poster: '/images/movie-1.png' }

  // arrange
  await UserMock.mockCurrent(page)
  await UserMock.mockList(page)
  const builder = new MovieBuilder(page)
  builder.addItem(manualMovie)
  await builder.build()
  await new SeriesBuilder(page).build()
  await mockPixel(page)
  // Registered after the list mock, so this one wins for the upload path.
  await page.route('**/api/v1/movie/*/poster', (route) => route.fulfill({ json: updated }))

  await page.goto('/')
  await homePageObject.movie('1').click()
  await page.getByRole('button', { name: 'Edit' }).click()

  const upload = page.waitForRequest(
    (request) => request.method() === 'PATCH' && request.url().endsWith('/api/v1/movie/1/poster'),
  )

  // act
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByLabel('Poster file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PIXEL })
  await page.getByRole('button', { name: 'Save' }).click()

  // assert
  const request = await upload
  expect(request.headers()['content-type']).toContain('multipart/form-data')
  // The file is its own part, so the JSON body must not carry a source URL.
  expect(request.postDataBuffer()?.toString()).not.toContain('"poster":')

  await expect(page).toHaveURL(/\/details\/movie\/1$/)
  await expect(page.locator('.poster img')).toHaveAttribute('src', '/images/movie-1.png')
})

test('details page does not print the poster URL', async ({ page }) => {
  const homePageObject = new HomePageObject(page)

  // arrange
  await UserMock.mockCurrent(page)
  await UserMock.mockList(page)
  const builder = new MovieBuilder(page)
  builder.addItem(posterMovie)
  await builder.build()
  await new SeriesBuilder(page).build()
  await mockPixel(page)

  // act
  await page.goto('/')
  await homePageObject.movie('1').click()

  // assert
  await expect(page.locator('.poster img')).toHaveAttribute('src', posterMovie.poster as string)
  await expect(page.getByText('Poster source')).toHaveCount(0)
})
