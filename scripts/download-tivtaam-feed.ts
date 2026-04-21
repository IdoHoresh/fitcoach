/**
 * Downloads the newest Tiv Taam price-transparency feed to
 * tmp/tivtaam-raw.xml.gz.
 *
 * Authenticates to url.publishedprices.co.il as the public `TivTaam` user
 * (empty password — legally mandated feed), lists files via the
 * DataTables JSON endpoint, picks the newest PriceFull*.gz, and streams
 * the binary into the cache path.
 *
 * Usage:
 *   npm run download-tivtaam-feed             — skip if cache exists
 *   npm run download-tivtaam-feed -- --force  — re-download even if cached
 *   npm run download-tivtaam-feed -- --dry-run — list files, pick newest, print; don't download
 *
 * All network calls are single-shot with a 10s timeout. No retry logic —
 * failures here are developer-time problems, not production hot paths.
 *
 * No unit tests (see lesson 2026-04-18 — codebase convention is to not mock
 * `global.fetch`; network-bound scripts are manual-verify only).
 */

import * as fs from 'fs'
import * as path from 'path'
import type { FeedFileEntry } from './transparency-feed-types'

// ── Constants ──

const BASE_URL = 'https://url.publishedprices.co.il'
const USERNAME = 'TivTaam'
const PASSWORD = ''
const CHAIN_ID = '7290873255550'
const HTTP_TIMEOUT_MS = 10_000
const STALE_THRESHOLD_DAYS = 7
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const CACHE_PATH = path.join(process.cwd(), 'tmp', 'tivtaam-raw.xml.gz')

// ── CLI flags ──

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const DRY_RUN = args.includes('--dry-run')

// ── HTTP helpers ──

/**
 * Minimal cookie jar — joins all Set-Cookie headers' name=value pairs into
 * a single Cookie header. The feed host only uses a session cookie +
 * csrftoken cookie, so full RFC6265 parsing is overkill.
 */
class CookieJar {
  private jar = new Map<string, string>()

  absorb(response: Response): void {
    // Node fetch exposes multiple Set-Cookie headers via getSetCookie() (Node 20+).
    const raws = response.headers.getSetCookie?.() ?? []
    for (const raw of raws) {
      const [pair] = raw.split(';', 1)
      const eq = pair.indexOf('=')
      if (eq === -1) continue
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (name) this.jar.set(name, value)
    }
  }

  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

/**
 * Wrapper: fetch with timeout + UA + cookie jar + **manual redirect following**.
 *
 * Why manual redirects: native `fetch` drops cookies across redirect hops.
 * The server rotates `cftpSID` inside the login 302 — if fetch follows it
 * automatically, the new session cookie is never sent to `/file`, and the
 * follow-up request lands back on the login page. Handling redirects here
 * lets the cookie jar absorb Set-Cookie from every hop in order.
 */
async function request(
  url: string,
  init: RequestInit & { jar?: CookieJar } = {},
  maxRedirects = 5,
): Promise<Response> {
  const { jar, ...rest } = init
  let currentUrl = url
  let currentInit: RequestInit = { ...rest, redirect: 'manual' }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS)
    try {
      const headers = new Headers(currentInit.headers)
      if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT)
      if (jar) {
        const cookieHeader = jar.header()
        if (cookieHeader) headers.set('Cookie', cookieHeader)
      }

      const res = await fetch(currentUrl, {
        ...currentInit,
        headers,
        signal: controller.signal,
      })
      if (jar) jar.absorb(res)

      // Non-redirect — done.
      if (res.status < 300 || res.status >= 400) return res

      // Redirect — resolve Location, strip body (GET for 303/302 per spec), loop.
      const location = res.headers.get('location')
      if (!location) return res
      currentUrl = new URL(location, currentUrl).toString()
      // 301/302/303 downgrade POST to GET, 307/308 preserve method + body.
      const preserveBody = res.status === 307 || res.status === 308
      currentInit = {
        method: preserveBody ? currentInit.method : 'GET',
        body: preserveBody ? currentInit.body : undefined,
        redirect: 'manual',
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw new Error(`download-tivtaam-feed: too many redirects following ${url}`)
}

/** Extracts `csrftoken` value from a meta tag in HTML. */
function extractCsrf(html: string): string {
  const match = html.match(/<meta\s+name="csrftoken"\s+content="([^"]+)"/i)
  if (!match) {
    throw new Error('download-tivtaam-feed: csrftoken meta tag not found — page structure changed?')
  }
  return match[1]
}

// ── Pipeline steps ──

async function login(jar: CookieJar): Promise<void> {
  // 1. GET /login to get initial csrftoken + session cookie.
  const pageRes = await request(`${BASE_URL}/login`, { jar })
  if (!pageRes.ok) {
    throw new Error(`login page fetch failed: ${pageRes.status} ${pageRes.statusText}`)
  }
  const csrf = extractCsrf(await pageRes.text())

  // 2. POST credentials + csrftoken.
  const formBody = new URLSearchParams({
    csrftoken: csrf,
    username: USERNAME,
    password: PASSWORD,
    r: '',
  }).toString()

  const loginRes = await request(`${BASE_URL}/login/user`, {
    method: 'POST',
    jar,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: `${BASE_URL}/login`,
      Origin: BASE_URL,
    },
    body: formBody,
  })

  if (!loginRes.ok) {
    throw new Error(`login submission failed: ${loginRes.status} ${loginRes.statusText}`)
  }

  // Success marker: file-manager page contains a logout link.
  const body = await loginRes.text()
  if (!/\/logout/.test(body)) {
    throw new Error('login appeared to succeed but file-manager page has no logout link')
  }
}

async function listFiles(jar: CookieJar): Promise<FeedFileEntry[]> {
  // Fetch fresh csrftoken from the file-manager page (different token than login page).
  const pageRes = await request(`${BASE_URL}/file`, { jar })
  if (!pageRes.ok) {
    throw new Error(`file-manager page fetch failed: ${pageRes.status}`)
  }
  const csrf = extractCsrf(await pageRes.text())

  // Pull a large page so we can pick the biggest-catalog store from the
  // current day's uploads — see pickNewestPriceFull() for rationale.
  // Server-side sort is intentionally omitted; we compute the selection
  // in JS across the full page.
  const formBody = new URLSearchParams({
    sEcho: '1',
    iColumns: '5',
    sColumns: ',,,,',
    iDisplayStart: '0',
    iDisplayLength: '5000',
    sSearch: '',
    bRegex: 'false',
    cd: '/',
    csrftoken: csrf,
  }).toString()

  const listRes = await request(`${BASE_URL}/file/json/dir`, {
    method: 'POST',
    jar,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
    body: formBody,
  })

  if (!listRes.ok) {
    throw new Error(`file list failed: ${listRes.status} ${listRes.statusText}`)
  }

  const json = (await listRes.json()) as {
    aaData?: { fname: string; size: number; time: string }[]
    error?: string
  }

  if (json.error) {
    throw new Error(`file list API error: ${json.error}`)
  }

  return (json.aaData ?? []).map((r) => ({
    fname: r.fname,
    size: r.size,
    time: r.time,
  }))
}

/**
 * Pick the "canonical catalog" file for this chain.
 *
 * Transparency feeds ship one `PriceFull*.gz` per store, uploaded in a
 * single daily batch. File **size** varies dramatically by store — flagship
 * locations ship the full assortment (~9k items, ~400KB gz), while small/
 * new/test stores ship a fraction (~6 items, <10KB). Catalog structure is
 * identical across stores; we want the store with the most items.
 *
 * Strategy: find the newest publish date (first 10 chars of the time
 * string), then among that day's uploads pick the largest file. This is
 * robust to (a) missing a day's upload on some stores and (b) test stores
 * uploading alongside real ones.
 */
function pickNewestPriceFull(files: FeedFileEntry[]): FeedFileEntry {
  const candidates = files.filter(
    (f) => f.fname.startsWith(`PriceFull${CHAIN_ID}-`) && f.fname.endsWith('.gz'),
  )
  if (candidates.length === 0) {
    throw new Error(
      `no PriceFull*.gz files found for chain ${CHAIN_ID} — feed may have stopped publishing`,
    )
  }

  // 1. Find the newest publish date across all candidates.
  const newestDate = candidates
    .map((f) => f.time.slice(0, 10)) // 'YYYY-MM-DD'
    .sort()
    .reverse()[0]

  // 2. Among the newest-date batch, pick the largest file (biggest catalog).
  const todaysUploads = candidates.filter((f) => f.time.startsWith(newestDate))
  todaysUploads.sort((a, b) => b.size - a.size)
  return todaysUploads[0]
}

function warnIfStale(file: FeedFileEntry): void {
  const fileTime = new Date(file.time).getTime()
  const nowMs = Date.now()
  const ageDays = (nowMs - fileTime) / (1000 * 60 * 60 * 24)
  if (ageDays > STALE_THRESHOLD_DAYS) {
    console.warn(
      `[WARN] feed file is ${Math.floor(ageDays)} days old — Tiv Taam may have stopped publishing`,
    )
  }
}

async function downloadTo(jar: CookieJar, fname: string, outPath: string): Promise<number> {
  const res = await request(`${BASE_URL}/file/d/${encodeURIComponent(fname)}`, { jar })
  if (!res.ok) {
    throw new Error(`download failed: ${res.status} ${res.statusText}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, buf)
  return buf.byteLength
}

// ── Main ──

async function main(): Promise<void> {
  // Cache fast-path. Require both the cache file AND its meta marker —
  // the meta is written only at the end of a successful download, so its
  // presence proves the gz body finished streaming. Either missing ⇒
  // treat as a partial/stale cache and re-download.
  const metaPath = `${CACHE_PATH}.meta.json`
  if (
    !FORCE &&
    !DRY_RUN &&
    fs.existsSync(CACHE_PATH) &&
    fs.existsSync(metaPath) &&
    fs.statSync(CACHE_PATH).size > 0
  ) {
    const stat = fs.statSync(CACHE_PATH)
    console.log(
      `[Tiv Taam download] using cached file: ${path.relative(process.cwd(), CACHE_PATH)} (${(stat.size / 1024).toFixed(1)} KB)`,
    )
    console.log('[Tiv Taam download] pass --force to re-download')
    return
  }

  const jar = new CookieJar()

  console.log('[Tiv Taam download] logging in...')
  await login(jar)
  console.log('[Tiv Taam download] login OK')

  console.log('[Tiv Taam download] listing files...')
  const files = await listFiles(jar)
  console.log(`[Tiv Taam download] ${files.length} files listed`)

  const picked = pickNewestPriceFull(files)
  console.log(
    `[Tiv Taam download] newest: ${picked.fname} (${(picked.size / 1024).toFixed(1)} KB, ${picked.time})`,
  )
  warnIfStale(picked)

  if (DRY_RUN) {
    console.log('[Tiv Taam download] (dry run — not downloading)')
    return
  }

  const bytes = await downloadTo(jar, picked.fname, CACHE_PATH)
  console.log(
    `[Tiv Taam download] wrote ${(bytes / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), CACHE_PATH)}`,
  )

  // Write meta alongside cache so downstream scripts can report feed age
  // without re-authenticating. Meta presence is also the cache-validity
  // signal — the next run skips download only when both files exist.
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ fname: picked.fname, time: picked.time, size: picked.size }, null, 2) + '\n',
  )
}

main().catch((err: unknown) => {
  console.error('[Tiv Taam download] FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
