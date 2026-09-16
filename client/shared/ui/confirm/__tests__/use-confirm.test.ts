import { beforeEach, describe, expect, it } from 'vitest'
import { confrimData, useConfirm } from '../use-confirm'

describe('use-confirm', () => {
  beforeEach(() => {
    confrimData.value = null
  })

  it('stores the confirm data while the promise is pending', () => {
    // arrange
    const confirm = useConfirm()

    // act
    const promise = confirm({ title: 'Delete movie', message: 'Are you sure?', danger: true })

    // assert
    expect(promise).toBeInstanceOf(Promise)
    expect(confrimData.value).toMatchObject({
      title: 'Delete movie',
      message: 'Are you sure?',
      danger: true,
    })
  })

  it('resolves the promise with true and clears the state on confirm', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie' })

    // act
    confrimData.value?.resolve(true)
    await promise

    // assert
    await expect(promise).resolves.toBe(true)
    expect(confrimData.value).toBeNull()
  })

  it('resolves the promise with false on cancel', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie' })

    // act
    confrimData.value?.resolve(false)
    await promise

    // assert
    await expect(promise).resolves.toBe(false)
  })

  it('resolves a pending confirm with false when a new one starts', async () => {
    // arrange
    const confirm = useConfirm()
    const first = confirm({ title: 'first' })
    const second = confirm({ title: 'second' })

    // act
    await first

    // assert
    await expect(first).resolves.toBe(false)
    expect(confrimData.value?.title).toBe('second')

    confrimData.value?.resolve(true)
    await expect(second).resolves.toBe(true)
  })
})
