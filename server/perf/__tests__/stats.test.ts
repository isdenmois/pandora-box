import { describe, expect, it } from 'vitest'
import { compareSummaries, median, medianSummary, percentile, type Summary, summarize } from '../stats'

const base: Summary = {
  p50: 50,
  p95: 100,
  p99: 200,
  mean: 60,
  min: 10,
  max: 300,
  rps: 1000,
  errors: 0,
  bytes: 100,
}

describe('percentile', () => {
  it('uses nearest rank on the sorted values', () => {
    // arrange
    const values = Array.from({ length: 100 }, (_, index) => index + 1)

    // act & assert
    expect(percentile(values, 0.5)).toBe(50)
    expect(percentile(values, 0.95)).toBe(95)
    expect(percentile(values, 0.99)).toBe(99)
  })

  it('answers the only value for a single sample', () => {
    expect(percentile([7], 0.95)).toBe(7)
  })

  it('does not mutate the caller’s array', () => {
    // arrange
    const values = [3, 1, 2]

    // act
    percentile(values, 0.5)

    // assert
    expect(values).toEqual([3, 1, 2])
  })
})

describe('median', () => {
  it('picks the middle of an odd count and averages the middle of an even one', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
})

describe('summarize', () => {
  it('reports latency, throughput and payload totals', () => {
    // arrange
    const latencies = [10, 20, 30, 40]

    // act
    const summary = summarize({ latencies, wallMs: 1000, errors: 2, bytes: 4096 })

    // assert
    expect(summary).toMatchObject({ p50: 20, mean: 25, min: 10, max: 40, rps: 4, errors: 2, bytes: 4096 })
  })

  it('refuses an empty sample instead of reporting a fake zero', () => {
    expect(() => summarize({ latencies: [], wallMs: 1, errors: 0, bytes: 0 })).toThrow()
  })
})

describe('medianSummary', () => {
  it('takes each metric’s median across passes', () => {
    // arrange
    const passes = [
      { ...base, p95: 1, rps: 10 },
      { ...base, p95: 5, rps: 20 },
      { ...base, p95: 3, rps: 30 },
    ]

    // act
    const summary = medianSummary(passes)

    // assert
    expect(summary.p95).toBe(3)
    expect(summary.rps).toBe(20)
  })
})

describe('compareSummaries', () => {
  it('gates p95 and throughput at the threshold while reporting other latency metrics', () => {
    // arrange
    const current = { ...base, p50: 100, p95: 111, rps: 889 }

    // act
    const deltas = compareSummaries(base, current, { maxRegress: 0.1 })

    // assert
    const byMetric = Object.fromEntries(deltas.map((delta) => [delta.metric, delta]))
    expect(byMetric.p95).toMatchObject({ regressed: true, gated: true })
    expect(byMetric.rps).toMatchObject({ regressed: true, gated: true })
    expect(byMetric.p50).toMatchObject({ regressed: true, gated: false })
  })

  it('treats exactly the threshold as acceptable', () => {
    // arrange
    const current = { ...base, p95: 110, rps: 900 }

    // act
    const deltas = compareSummaries(base, current, { maxRegress: 0.1 })

    // assert
    expect(deltas.every((delta) => !delta.regressed)).toBe(true)
  })

  it('does not call a faster run a regression', () => {
    // arrange
    const current = { ...base, p95: 80, rps: 1200 }

    // act
    const deltas = compareSummaries(base, current, { maxRegress: 0.1 })

    // assert
    expect(deltas.some((delta) => delta.regressed)).toBe(false)
    expect(deltas.find((delta) => delta.metric === 'rps')?.change).toBeCloseTo(0.2)
  })
})
