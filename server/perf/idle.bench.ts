#!/usr/bin/env bun
/**
 * Idle CPU of the API server: CPU-seconds consumed by a real `bun run ./server/index.ts` child
 * (no --watch) across a 10-minute window with zero traffic.
 *
 *   bun run perf:idle
 *   bun run perf:idle --out /tmp/idle.json
 *
 * The child gets a throwaway `:memory:` database and a runtime-picked free port, so a dev server
 * already on :3000 cannot collide. The clock starts only after the port accepts a bare TCP
 * connection — boot and migrations are excluded, and the probe is not an HTTP request, so nothing
 * talks to the server during the window. CPU time is read from /proc/<pid>/stat at 1, 5 and 10
 * minutes. Record-only: the exit code is 0 whatever the numbers say; compare runs via the JSON.
 * Linux-only (procfs).
 */
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'

const HOST = '127.0.0.1'
const MARKS_SECONDS = [60, 300, 600]
const READY_TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 250
const SERVER_COMMAND = ['bun', 'run', './server/index.ts']
const REPO_ROOT = join(import.meta.dir, '..', '..')

interface CpuSample {
  user: number
  system: number
}

interface MarkResult {
  label: string
  elapsedSeconds: number
  cumulative: CpuSample & { total: number }
  window: CpuSample & { total: number; seconds: number; percentOfOneCore: number }
}

interface RunReport {
  scenario: 'idle (zero traffic)'
  generatedAt: string
  runtime: string
  git: { sha: string; dirty: boolean }
  server: { command: string; pid: number; port: number; db: ':memory:' }
  marks: MarkResult[]
}

interface Options {
  out: string
}

async function run() {
  const options = parseOptions()
  const ticks = clockTicks()
  const port = await freePort()

  const child = Bun.spawn({
    cmd: SERVER_COMMAND,
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: ':memory:',
      OMDB_URL: 'https://omdb.test/api',
      IMAGE_DIR: join(tmpdir(), 'pandora-perf-images'),
      IMAGE_FETCH: 'off',
      PORT: String(port),
    },
    stdout: 'inherit',
    stderr: 'inherit',
  })

  process.once('SIGINT', () => {
    stopChild(child)
    process.exit(130)
  })
  process.once('SIGTERM', () => {
    stopChild(child)
    process.exit(143)
  })

  try {
    await waitForPort(port, child)

    const startedAt = Date.now()
    const baseline = readCpu(child.pid, ticks)
    let previous = { at: startedAt, cpu: baseline }
    const marks: MarkResult[] = []

    console.log(`server pid ${child.pid} ready on :${port} — idle window starts now, no traffic`)

    for (const [index, seconds] of MARKS_SECONDS.entries()) {
      await sleepUntil(startedAt + seconds * 1000)

      const at = Date.now()
      const cpu = readCpu(child.pid, ticks)
      const cumulative = since(cpu, baseline)
      const window = since(cpu, previous.cpu)
      const windowSeconds = (at - previous.at) / 1000
      const percentOfOneCore = round3((window.total / windowSeconds) * 100)
      const mark: MarkResult = {
        label: markLabel(seconds),
        elapsedSeconds: round1((at - startedAt) / 1000),
        cumulative,
        window: { ...window, seconds: round1(windowSeconds), percentOfOneCore },
      }

      marks.push(mark)
      previous = { at, cpu }

      console.log(
        `[${index + 1}/${MARKS_SECONDS.length}] ${mark.label}: total ${cumulative.total.toFixed(3)} s, window ${window.total.toFixed(3)} s, ${percentOfOneCore.toFixed(3)}% of 1 core`,
      )
    }

    const report: RunReport = {
      scenario: 'idle (zero traffic)',
      generatedAt: new Date().toISOString(),
      runtime: `bun ${Bun.version}`,
      git: gitInfo(),
      server: { command: SERVER_COMMAND.join(' '), pid: child.pid, port, db: ':memory:' },
      marks,
    }

    printReport(report)
    await writeReport(report, options.out)
    console.log(`\nwrote ${options.out}`)
  } finally {
    stopChild(child)
    await child.exited
  }
}

function parseOptions(): Options {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
    },
  })

  return {
    out: values.out ?? join(tmpdir(), 'pandora-perf', `idle-${timestamp()}.json`),
  }
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

function since(current: CpuSample, baseline: CpuSample) {
  return {
    user: current.user - baseline.user,
    system: current.system - baseline.system,
    total: current.user - baseline.user + (current.system - baseline.system),
  }
}

function markLabel(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Jiffies are 10 ms ticks; 6 decimals keep the JSON free of 0.010000000000000009 noise. */
function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** Binds to port 0, reads the assigned port, releases it — a runtime-picked free port for the child. */
async function freePort(): Promise<number> {
  const listener = Bun.listen({ hostname: HOST, port: 0, socket: { data: () => {} } })
  const { port } = listener

  listener.stop()

  return port
}

async function waitForPort(port: number, child: Bun.Subprocess): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`server exited during startup with code ${child.exitCode}`)
    }

    if (await canConnect(port)) {
      return
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`server did not accept connections on :${port} within ${READY_TIMEOUT_MS / 1000} s`)
}

/** A bare TCP connect: enough to know the port is served, without a single HTTP request. */
async function canConnect(port: number): Promise<boolean> {
  try {
    const socket = await Bun.connect({ hostname: HOST, port, socket: { data: () => {} } })

    socket.end()

    return true
  } catch {
    return false
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Absolute deadlines, so 10 minutes of timers cannot drift into 10 minutes and 3 seconds. */
async function sleepUntil(deadlineMs: number): Promise<void> {
  const remaining = deadlineMs - Date.now()

  if (remaining > 0) {
    await sleep(remaining)
  }
}

function clockTicks(): number {
  const value = Number(
    Bun.spawnSync({ cmd: ['getconf', 'CLK_TCK'] })
      .stdout.toString()
      .trim(),
  )

  return Number.isFinite(value) && value > 0 ? value : 100
}

/**
 * /proc/<pid>/stat: utime is field 14, stime field 15. comm may contain spaces and parens, so
 * everything after the last ')' is positional again (fields[0] is state, field 3).
 */
function readCpu(pid: number, ticksPerSecond: number): CpuSample {
  let stat: string

  try {
    stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
  } catch {
    throw new Error(`cannot read /proc/${pid}/stat — did the server exit during the window?`)
  }

  const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
  const user = round6(Number(fields[11]) / ticksPerSecond)
  const system = round6(Number(fields[12]) / ticksPerSecond)

  if (!Number.isFinite(user) || !Number.isFinite(system)) {
    throw new Error(`could not parse /proc/${pid}/stat`)
  }

  return { user, system }
}

function stopChild(child: Bun.Subprocess) {
  try {
    child.kill()
  } catch {
    // The child is already gone; nothing to clean up.
  }
}

function printReport(report: RunReport) {
  const dirty = report.git.dirty ? ' (dirty)' : ''

  console.log(
    `\n${report.scenario}  pid ${report.server.pid} on :${report.server.port}  db ${report.server.db}  ${report.runtime}  ${report.git.sha}${dirty}\n`,
  )

  printTable(
    ['mark', 'user s', 'sys s', 'total s', 'window Δ s', '% of 1 core'],
    report.marks.map((mark) => [
      mark.label,
      mark.cumulative.user.toFixed(3),
      mark.cumulative.system.toFixed(3),
      mark.cumulative.total.toFixed(3),
      mark.window.total.toFixed(3),
      mark.window.percentOfOneCore.toFixed(3),
    ]),
  )
}

async function writeReport(report: RunReport, path: string) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`)
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
