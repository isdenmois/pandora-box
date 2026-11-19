/** One measured pass at a fixed concurrency. */
export interface Summary {
  p50: number
  p95: number
  p99: number
  mean: number
  min: number
  max: number
  /** Completed requests per second over the pass's wall clock. */
  rps: number
  errors: number
  /** Total response body bytes across the pass. */
  bytes: number
}

export interface Measurement {
  /** One end-to-end latency in milliseconds per completed request. */
  latencies: number[]
  /** Wall clock of the whole pass, including client overhead. */
  wallMs: number
  errors: number
  bytes: number
}

export interface MetricDelta {
  metric: 'p50' | 'p95' | 'p99' | 'mean' | 'rps'
  baseline: number
  current: number
  /** `(current - baseline) / baseline`; positive means current is larger. */
  change: number
  /** Worse than the baseline by more than the threshold, in this metric's direction. */
  regressed: boolean
  /** Whether `regressed` fails the run. Only p95 and rps gate; the rest are informational. */
  gated: boolean
}

/** Marks the latencies where higher is worse and the throughput metric where lower is worse. */
const LATENCY_METRICS = ['p50', 'p95', 'p99', 'mean'] as const
const GATED_METRICS = new Set<string>(['p95', 'rps'])

/** Nearest-rank percentile: the smallest value with at least `fraction` of samples at or below it. */
export function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1))

  return sorted[rank]
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function summarize({ latencies, wallMs, errors, bytes }: Measurement): Summary {
  if (!latencies.length) {
    throw new Error('Cannot summarize a pass with no completed requests')
  }

  const total = latencies.reduce((sum, latency) => sum + latency, 0)

  return {
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    p99: percentile(latencies, 0.99),
    mean: total / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies),
    rps: (latencies.length / wallMs) * 1000,
    errors,
    bytes,
  }
}

/** The metric-wise median of the passes, so one noisy pass cannot set the reported number. */
export function medianSummary(passes: readonly Summary[]): Summary {
  if (!passes.length) {
    throw new Error('Cannot take the median of no passes')
  }

  const pick = (metric: keyof Summary) => median(passes.map((pass) => pass[metric]))

  return {
    p50: pick('p50'),
    p95: pick('p95'),
    p99: pick('p99'),
    mean: pick('mean'),
    min: pick('min'),
    max: pick('max'),
    rps: pick('rps'),
    errors: pick('errors'),
    bytes: pick('bytes'),
  }
}

export function compareSummaries(
  baseline: Summary,
  current: Summary,
  { maxRegress }: { maxRegress: number },
): MetricDelta[] {
  const metrics = [...LATENCY_METRICS, 'rps'] as const

  return metrics.map((metric) => {
    const from = baseline[metric]
    const to = current[metric]
    const change = from === 0 ? (to === 0 ? 0 : Number.POSITIVE_INFINITY) : (to - from) / from
    // A change that lands exactly on the threshold is a pass, not a fail; the epsilon absorbs
    // float division noise (110/100 - 1 = 0.10000000000000009).
    const worse = metric === 'rps' ? change < -maxRegress - 1e-9 : change > maxRegress + 1e-9

    return { metric, baseline: from, current: to, change, regressed: worse, gated: GATED_METRICS.has(metric) }
  })
}
