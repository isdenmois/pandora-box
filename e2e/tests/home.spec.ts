import { expect, test } from '@playwright/test'
import { UserMock } from '../mocks'
import { AddDialogPageObject, HomePageObject, SearchDialogPageObject } from '../page-objects'
import { SearchBuilder, SeriesBuilder } from '../builders'
import { searchFixture } from '../fixtures'
import { MovieBuilder } from '../builders/movie.builder'

test('home page', async ({ page }) => {
  const homePageObject = new HomePageObject(page)
  const searchDialogPageObject = new SearchDialogPageObject(page)
  const addDialogPageObject = new AddDialogPageObject(page)

  await test.step('Open home page', async () => {
    // arrange
    await UserMock.mockCurrent(page)
    await new SeriesBuilder(page).build()
    await new MovieBuilder(page).build()
    await new SearchBuilder(page)
      .addItem(searchFixture.series)
      .addItem(searchFixture.movie)
      .addDetails(searchFixture.details.series)
      .addDetails(searchFixture.details.movie)
      .build()

    // act
    await page.goto('/')

    // assert
    await expect(homePageObject.header).toContainText('Home')
    await expect(homePageObject.series('1')).not.toBeVisible()
    await expect(homePageObject.movie('1')).not.toBeVisible()
  })

  await test.step('Open search', async () => {
    // act
    await homePageObject.searchButton.click()

    // assert
    await expect(searchDialogPageObject.dialog).toBeVisible()
  })

  await test.step('Search by query', async () => {
    // act
    await searchDialogPageObject.input.fill('Black M')
    await searchDialogPageObject.input.press('Enter')

    // assert
    await expect(searchDialogPageObject.foundSeries).toBeVisible()
    await expect(searchDialogPageObject.foundSeries).toContainText('Black Mirror')
    await expect(searchDialogPageObject.foundSeries).toContainText('2020')

    await expect(searchDialogPageObject.foundMovie).toBeVisible()
    await expect(searchDialogPageObject.foundMovie).toContainText('Black Magic')
    await expect(searchDialogPageObject.foundMovie).toContainText('1980')
  })

  await test.step('Search by id', async () => {
    // act
    await searchDialogPageObject.input.fill('tt1 ')
    await searchDialogPageObject.input.press('Enter')

    // assert
    await expect(addDialogPageObject.header).toBeVisible()
    await expect(addDialogPageObject.titleInput).toHaveValue('Black Mirror')
  })

  await test.step('Add series', async () => {
    // arrange
    await addDialogPageObject.titleInput.fill('Black Mirror 7')
    await addDialogPageObject.seasonInput.fill('7')

    // act
    await addDialogPageObject.button.click()

    // assert
    await expect(addDialogPageObject.dialog).not.toBeVisible()

    await expect(homePageObject.series('1')).toBeVisible()
    await expect(homePageObject.series('1')).toContainText('Black Mirror 7')

    await expect(homePageObject.movie('1')).not.toBeVisible()
  })

  await test.step('Add movie', async () => {
    // arrange
    await homePageObject.searchButton.click()
    await searchDialogPageObject.input.fill('tt2 ')
    await searchDialogPageObject.input.press('Enter')

    // act
    await addDialogPageObject.titleInput.fill('Black Magic Sequel')
    await addDialogPageObject.button.click()

    // assert
    await expect(addDialogPageObject.dialog).not.toBeVisible()

    await expect(homePageObject.movie('1')).toBeVisible()
    await expect(homePageObject.movie('1')).toContainText('Black Magic Sequel')
  })
})
