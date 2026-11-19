#!/usr/bin/env bun
/**
 * Baseline for `GET /api/v1/series`, the list read that dominates a page load.
 *
 * Run it before and after the framework migration on the same machine, with the same flags:
 *
 *   bun run perf:series
 *   bun run perf:series --out /tmp/before.json
 *   bun run perf:series --compare /tmp/before.json
 *
 * The measured loop only knows a URL and a cookie. After the migration, the only lines that
 * change are the `app` import and `app.listen(0)`; seeding, stats, output and comparison stay.
 *
 * Requests run over a real socket so Bun's HTTP parsing and response serialization are included.
 * A throwaway `:memory:` database keeps the run off `data/` and makes seeding deterministic.
 */
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { compareSummaries, medianSummary, type Summary, summarize } from './stats'

// These must be set before `../index` is imported: env parses at import time, and importing the
// database module runs the migrations.
process.env.DATABASE_URL = ':memory:'
process.env.OMDB_URL = 'https://omdb.test/api'
process.env.IMAGE_DIR = join(tmpdir(), 'pandora-perf-images')
process.env.IMAGE_FETCH = 'off'

const { app } = await import('../index')
const { db } = await import('@/infra')
const { table } = await import('@/domain')
const { hashPassword } = await import('@/shared')

const PASSWORD = 'perf-benchmark-password'
const ENDPOINT = '/api/v1/series'
const GLOBAL_SHARE = 0.8
const OWN_PRIVATE_SHARE = 0.15
const INSERT_CHUNK = 100
const GENRES = ['drama', 'comedy', 'sci-fi', 'crime', 'thriller', 'anime', 'documentary']
const LANGUAGES = ['en', 'fr', 'ja', 'de', 'es']
const TAGS = ['favorite', 'rewatch', 'slow-burn', 'classic', 'weekend', 'family', 'noir', 'space']

interface PassResult {
  summary: Summary
  rssBefore: number
  rssAfter: number
}

interface LevelResult {
  concurrency: number
  requests: number
  passes: PassResult[]
  median: Summary
  /** First pass start → last pass end, so growth across all three passes shows up. */
  rss: { start: number; end: number; growth: number }
}

interface RunReport {
  endpoint: string
  generatedAt: string
  runtime: string
  git: { sha: string; dirty: boolean }
  dataset: {
    profile: 'realistic'
    rows: number
    visible: number
    global: number
    ownPrivate: number
    foreignPrivate: number
  }
  requests: number
  warmup: number
  passCount: number
  levels: LevelResult[]
}

interface Options {
  rows: number
  requests: number
  warmup: number
  concurrency: number[]
  passCount: number
  out: string
  compare?: string
  maxRegress: number
}

async function run() {
  const options = parseOptions()
  const seeded = await seed(options.rows)

  const server = app.listen(0)

  try {
    const port = server.server?.port

    if (!port) {
      throw new Error('The server did not report a listening port')
    }

    const baseUrl = `http://127.0.0.1:${port}`
    const cookie = await login(baseUrl)
    const url = `${baseUrl}${ENDPOINT}`

    await verifyTarget(url, cookie, seeded)
    await measurePass(url, cookie, 1, options.warmup) // JIT + pool warmup, discarded

    const levels: LevelResult[] = []

    for (const concurrency of options.concurrency) {
      levels.push(await measureLevel(url, cookie, concurrency, options))
    }

    const report: RunReport = {
      endpoint: `GET ${ENDPOINT}`,
      generatedAt: new Date().toISOString(),
      runtime: `bun ${Bun.version}`,
      git: gitInfo(),
      dataset: seeded.dataset,
      requests: options.requests,
      warmup: options.warmup,
      passCount: options.passCount,
      levels,
    }

    printReport(report)
    await writeReport(report, options.out)
    console.log(`\nwrote ${options.out}`)

    if (options.compare) {
      const regressed = await printComparison(report, options.compare, options.maxRegress)

      if (regressed) {
        process.exitCode = 1
      }
    }
  } finally {
    server.stop()
  }
}

function parseOptions(): Options {
  const { values } = parseArgs({
    options: {
      rows: { type: 'string', default: '1000' },
      requests: { type: 'string', default: '5000' },
      warmup: { type: 'string', default: '500' },
      concurrency: { type: 'string', default: '1,10' },
      passes: { type: 'string', default: '3' },
      out: { type: 'string' },
      compare: { type: 'string' },
      'max-regress': { type: 'string', default: '0.1' },
    },
  })

  const maxRegress = Number(values['max-regress'])

  if (!Number.isFinite(maxRegress) || maxRegress < 0) {
    throw new Error(`--max-regress must be a number >= 0, got ${values['max-regress']}`)
  }

  return {
    rows: positiveInt('rows', values.rows),
    requests: positiveInt('requests', values.requests),
    warmup: positiveInt('warmup', values.warmup, 0),
    concurrency: [...new Set(values.concurrency.split(',').map((part) => positiveInt('concurrency', part)))],
    passCount: positiveInt('passes', values.passes),
    out: values.out ?? join(tmpdir(), 'pandora-perf', `series-${timestamp()}.json`),
    compare: values.compare,
    maxRegress,
  }
}

function positiveInt(name: string, raw: string | undefined, minimum = 1): number {
  const value = Number(raw)

  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`--${name} must be an integer >= ${minimum}, got ${raw}`)
  }

  return value
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function gitInfo() {
  try {
    const sha = Bun.spawnSync({ cmd: ['git', 'rev-parse', '--short', 'HEAD'] })
      .stdout.toString()
      .trim()
    const dirty =
      Bun.spawnSync({ cmd: ['git', 'status', '--porcelain'] })
        .stdout.toString()
        .trim().length > 0

    return { sha: sha || 'unknown', dirty }
  } catch {
    return { sha: 'unknown', dirty: false }
  }
}

/** Rows go in directly: the benchmark measures reads, and 1,000 POSTs would dominate the run. */
async function seed(rows: number) {
  const viewer = { id: randomUUID(), username: 'perf-viewer' }
  const other = { id: randomUUID(), username: 'perf-other' }

  await db.insert(table.user).values(
    [viewer, other].map((user) => ({
      ...user,
      role: 'user',
      passwordHash: hashPassword(PASSWORD),
    })),
  )

  const globalCount = Math.round(rows * GLOBAL_SHARE)
  const ownPrivateCount = Math.round(rows * OWN_PRIVATE_SHARE)
  const foreignPrivateCount = Math.max(0, rows - globalCount - ownPrivateCount)
  const foreignIds = new Set<string>()
  const values = Array.from({ length: rows }, (_, index) => {
    const bucket = index < globalCount ? 'global' : index < globalCount + ownPrivateCount ? 'own' : 'foreign'
    // Global rows keep a mix of creators, as a real shared list would.
    const createdBy = bucket === 'foreign' ? other.id : bucket === 'global' && index % 3 === 0 ? other.id : viewer.id
    const id = randomUUID()

    if (bucket === 'foreign') {
      foreignIds.add(id)
    }

    return seriesRow({ id, index, createdBy, private: bucket !== 'global', viewerId: viewer.id, otherId: other.id })
  })

  for (let start = 0; start < values.length; start += INSERT_CHUNK) {
    await db.insert(table.series).values(values.slice(start, start + INSERT_CHUNK))
  }

  return {
    viewer,
    foreignIds,
    dataset: {
      profile: 'realistic' as const,
      rows,
      visible: globalCount + ownPrivateCount,
      global: globalCount,
      ownPrivate: ownPrivateCount,
      foreignPrivate: foreignPrivateCount,
    },
  }
}

function seriesRow({
  id,
  index,
  createdBy,
  private: isPrivate,
  viewerId,
  otherId,
}: {
  id: string
  index: number
  createdBy: string
  private: boolean
  viewerId: string
  otherId: string
}): typeof table.series.$inferInsert {
  const tagCount = index % 6

  return {
    id,
    extId: null,
    provider: 'manual',
    title: `Benchmark Series ${index}`,
    poster: null,
    posterSource: null,
    year: 1990 + (index % 35),
    season: 1 + (index % 5),
    seasonHistory: index % 3 === 0 ? { '1': 'watched', '2': 'planned' } : null,
    rating: (index % 100) / 10,
    language: LANGUAGES[index % LANGUAGES.length],
    genre: GENRES[index % GENRES.length],
    reason: index % 3 === 0 ? 'Recommended by a friend' : null,
    seen: index % 4 === 0 ? '2026-11-01' : null,
    seenRating: index % 4 === 0 ? index % 11 : null,
    seenComment: index % 4 === 0 ? 'Benchmark comment' : null,
    createdBy,
    recommendedBy: index % 5 === 0 ? (createdBy === viewerId ? otherId : viewerId) : null,
    private: isPrivate,
    scheduled: index % 4 === 0 ? 1 + (index % 10) : null,
    tags: tagCount ? Array.from({ length: tagCount }, (_, offset) => TAGS[(index + offset) % TAGS.length]) : null,
    extra: {
      imdbRating: `${6 + (index % 4)}.${index % 10}`,
      genres: [GENRES[index % GENRES.length], GENRES[(index + 2) % GENRES.length]],
      plot: `Benchmark plot ${index}`,
    },
  }
}

async function login(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'perf-viewer', password: PASSWORD }),
  })

  if (response.status !== 200) {
    throw new Error(`Login failed with ${response.status}: ${await response.text()}`)
  }

  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('auth-session='))
    ?.split(';')[0]

  if (!cookie) {
    throw new Error('Login did not set an auth-session cookie')
  }

  return cookie
}

/** A fast run over a broken route (401, empty list) must not masquerade as a good baseline. */
async function verifyTarget(url: string, cookie: string, seeded: Awaited<ReturnType<typeof seed>>) {
  const response = await fetch(url, { headers: { cookie } })
  const text = await response.text()

  if (response.status !== 200) {
    throw new Error(`Target answered ${response.status}, expected 200: ${text.slice(0, 200)}`)
  }

  const rows = JSON.parse(text) as { id: string }[]

  if (rows.length !== seeded.dataset.visible) {
    throw new Error(`Target returned ${rows.length} rows, expected ${seeded.dataset.visible}`)
  }

  const leaked = rows.filter((row) => seeded.foreignIds.has(row.id))

  if (leaked.length) {
    throw new Error(`Target leaked ${leaked.length} private rows belonging to another user`)
  }
}

async function measureLevel(url: string, cookie: string, concurrency: number, options: Options): Promise<LevelResult> {
  const passes: PassResult[] = []

  for (let pass = 0; pass < options.passCount; pass++) {
    const result = await measurePass(url, cookie, concurrency, options.requests)
    passes.push(result)
    console.log(
      `c=${concurrency} pass ${pass + 1}/${options.passCount}: p95 ${result.summary.p95.toFixed(2)} ms, ${Math.round(result.summary.rps)} req/s, ${result.summary.errors} errors`,
    )
  }

  return {
    concurrency,
    requests: options.requests,
    passes,
    median: medianSummary(passes.map((pass) => pass.summary)),
    rss: {
      start: passes[0].rssBefore,
      end: passes[passes.length - 1].rssAfter,
      growth: passes[passes.length - 1].rssAfter - passes[0].rssBefore,
    },
  }
}

/** Closed-loop: `concurrency` workers pull from one counter until the request budget is spent. */
async function measurePass(
  url: string,
  cookie: string,
  concurrency: number,
  requestCount: number,
): Promise<PassResult> {
  const latencies: number[] = []
  const rssBefore = process.memoryUsage().rss
  const started = performance.now()
  let next = 0
  let errors = 0
  let bytes = 0

  const worker = async () => {
    while (true) {
      const index = next
      next += 1

      if (index >= requestCount) {
        return
      }

      const requestStarted = performance.now()
      const response = await fetch(url, { headers: { cookie } })
      const body = await response.arrayBuffer()

      latencies.push(performance.now() - requestStarted)
      bytes += body.byteLength

      if (response.status !== 200) {
        errors += 1
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  const wallMs = performance.now() - started

  return {
    summary: summarize({ latencies, wallMs, errors, bytes }),
    rssBefore,
    rssAfter: process.memoryUsage().rss,
  }
}

function printReport(report: RunReport) {
  const { dataset } = report
  const dirty = report.git.dirty ? ' (dirty)' : ''

  console.log(
    `\n${report.endpoint}  rows ${dataset.rows} (visible ${dataset.visible})  ${report.runtime}  ${report.git.sha}${dirty}\n`,
  )

  for (const level of report.levels) {
    console.log(`c=${level.concurrency}  ${level.requests} requests/pass`)

    printTable(
      ['pass', 'p50 ms', 'p95 ms', 'p99 ms', 'mean ms', 'req/s', 'errors', 'avg KB'],
      [
        ...level.passes.map((pass, index) => metricRow(`#${index + 1}`, pass.summary, level.requests)),
        metricRow('median', level.median, level.requests),
      ],
    )

    console.log(`rss ${mb(level.rss.start)} → ${mb(level.rss.end)} (${signedBytes(level.rss.growth)})\n`)
  }
}

function metricRow(label: string, summary: Summary, requests: number): string[] {
  return [
    label,
    summary.p50.toFixed(2),
    summary.p95.toFixed(2),
    summary.p99.toFixed(2),
    summary.mean.toFixed(2),
    Math.round(summary.rps).toString(),
    summary.errors.toString(),
    (summary.bytes / requests / 1024).toFixed(0),
  ]
}

async function writeReport(report: RunReport, path: string) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`)
}

/** Prints deltas and returns whether a gated metric (p95, req/s) regressed past the threshold. */
async function printComparison(report: RunReport, path: string, maxRegress: number): Promise<boolean> {
  const baseline = JSON.parse(await readFile(path, 'utf8')) as RunReport

  requireSameRun(baseline, report)

  console.log(`compare against ${path}  (gated: p95, req/s at ${(maxRegress * 100).toFixed(0)}%)\n`)

  let regressed = false

  for (const level of report.levels) {
    const baseLevel = baseline.levels.find((candidate) => candidate.concurrency === level.concurrency)

    if (!baseLevel) {
      throw new Error(`Baseline has no c=${level.concurrency} level`)
    }

    const deltas = compareSummaries(baseLevel.median, level.median, { maxRegress })

    console.log(`c=${level.concurrency}`)
    printTable(
      ['metric', 'baseline', 'current', 'change', 'gate'],
      deltas.map((delta) => [
        delta.metric,
        formatMetric(delta.metric, delta.baseline),
        formatMetric(delta.metric, delta.current),
        signedPercent(delta.change),
        delta.gated ? (delta.regressed ? 'FAIL' : 'pass') : 'info',
      ]),
    )

    const growthDelta = level.rss.growth - baseLevel.rss.growth

    console.log(
      `rss growth ${signedBytes(baseLevel.rss.growth)} → ${signedBytes(level.rss.growth)} (Δ ${signedBytes(growthDelta)}, info)\n`,
    )

    if (deltas.some((delta) => delta.gated && delta.regressed)) {
      regressed = true
    }
  }

  return regressed
}

/** Comparing different datasets or budgets would report a difference that is not the framework's. */
function requireSameRun(baseline: RunReport, report: RunReport) {
  const mismatches = [
    ['visible rows', baseline.dataset.visible, report.dataset.visible],
    ['requests/pass', baseline.requests, report.requests],
    ['passes', baseline.passCount, report.passCount],
    [
      'concurrency levels',
      baseline.levels.map((level) => level.concurrency).join(','),
      report.levels.map((level) => level.concurrency).join(','),
    ],
  ].filter(([, from, to]) => from !== to)

  if (mismatches.length) {
    throw new Error(
      `Refusing to compare mismatched runs: ${mismatches.map(([name, from, to]) => `${name} ${from} → ${to}`).join(', ')}`,
    )
  }
}

function formatMetric(metric: string, value: number): string {
  return metric === 'rps' ? Math.round(value).toString() : value.toFixed(2)
}

function signedPercent(change: number): string {
  if (!Number.isFinite(change)) {
    return 'n/a'
  }

  const percent = change * 100

  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
}

function signedBytes(bytes: number): string {
  const sign = bytes >= 0 ? '+' : '-'

  return `${sign}${mb(Math.abs(bytes))}`
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Left-aligns the label column and right-aligns the numbers. */
function printTable(headers: string[], rows: string[][]) {
  const widths = headers.map((header, column) => Math.max(header.length, ...rows.map((row) => row[column].length)))
  const line = (cells: string[]) =>
    cells.map((cell, column) => (column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column]))).join('  ')

  console.log(line(headers))

  for (const row of rows) {
    console.log(line(row))
  }
}

await run().catch((error) => {
  console.error(`perf: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
