import { afterEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '../sleep'

describe('sleep', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the given number of seconds', async () => {
    // arrange
    vi.useFakeTimers()
    const onDone = vi.fn()

    // act
    const sleeping = sleep(2).then(onDone)

    vi.advanceTimersByTime(1_999)
    await Promise.resolve()

    // assert
    expect(onDone).not.toHaveBeenCalled()

    // act
    vi.advanceTimersByTime(1)
    await sleeping

    // assert
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('resolves immediately when the delay is zero', async () => {
    // arrange
    vi.useFakeTimers()

    // act
    const sleeping = sleep(0)
    vi.runAllTimers()

    // assert
    await expect(sleeping).resolves.toBeUndefined()
  })
})
