#!/usr/bin/env node
/**
 * Prints the log stream from devices running `startLogStream` (src/log-stream.ts).
 *
 *   npx backstage-log-host [port] [--compact]          # default 8099; --compact = one line per request and log
 *   npx backstage-log-host --max-lines=40              # cap each body or object; full by default
 *   cloudflared tunnel --url http://localhost:8099     # remote device: enter the printed URL as wss://… in
 *                                                      # Backstage → Info → LOG STREAM
 *
 * Same Wi-Fi needs no tunnel: ws://<your LAN IP>:8099.
 *
 * `ws` is resolved from the app, not declared as a dependency, so the package stays dependency-free;
 * every React Native project already has it through Metro.
 */
let WebSocket
try {
  WebSocket = (await import('ws')).default
} catch {
  console.error('backstage-log-host needs the `ws` package: yarn add -D ws')
  process.exit(1)
}

const args = process.argv.slice(2)
const compact = args.includes('--compact')
const port = Number(args.find(arg => !arg.startsWith('--')) ?? 8099)
const maxLinesArg = args.find(arg => arg.startsWith('--max-lines='))
const maxLines = maxLinesArg ? Number(maxLinesArg.split('=')[1]) : Infinity

const color = (code, text) => `\x1b[${code}m${text}\x1b[0m`
const badge = (code, text) => color(code, ` ${text.padEnd(5)} `)

// Logs: badge and text share the level's color. Network: always a magenta badge (red when failed),
// with method, status and URL colored separately so a request never reads like a log line.
const LEVELS = {
  log: { badge: '100;97', text: 0 },
  debug: { badge: '100;37', text: 90 },
  info: { badge: '46;30', text: 36 },
  warn: { badge: '43;30', text: 33 },
  error: { badge: '41;97', text: 31 },
}
// An app's own request/response dumps (e.g. an axios interceptor's `response {…}` log): light magenta,
// related to the NET badge but never mistaken for it. Warnings and errors keep their level colors.
const API_LOG = { badge: '105;30', text: 95 }
const INLINE_JSON_MAX = 100
const METHOD_COLORS = { GET: 32, POST: 33, PUT: 34, PATCH: 36, DELETE: 31 }
const statusColor = status =>
  !status || status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32

const time = timestamp =>
  `${new Date(timestamp).toTimeString().slice(0, 8)}.${String(timestamp % 1000).padStart(3, '0')}`
const size = bytes =>
  bytes == null ? '' : ` · ${bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`}`

const colorUrl = url => {
  const match = url.match(/^(\w+:\/\/[^/]+)(.*)$/)
  return match ? `${color(90, match[1])}${color(35, match[2] || '/')}` : color(35, url)
}

const JSON_TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
const colorJsonLine = line =>
  line.replace(JSON_TOKEN, (token, string, colon, literal) => {
    if (string && colon) return `${color(34, string)}${colon}`
    if (string) return color(32, string)
    if (literal) return color(36, literal)
    return color(33, token)
  })

const prettyBody = body => {
  let lines
  try {
    lines = JSON.stringify(JSON.parse(body), null, 2).split('\n').map(colorJsonLine)
  } catch {
    lines = body.split('\n')
  }
  const shown = lines.slice(0, maxLines)
  if (lines.length > maxLines) shown.push(color(90, `… ${lines.length - maxLines} more lines`))
  return shown
}

// Recognizes an axios/apisauce request config (`method`, `url`, `headers` or `baseURL`) or a response
// (`config` plus `status`), so those dumps can be summarized like the request they belong to.
// Mirrors src/utils/api-call.ts.
const apiCall = json => {
  if (typeof json !== 'object' || json === null) return null
  const isResponse = json.config && typeof json.config === 'object' && 'status' in json
  const config = isResponse ? json.config : json
  const isConfig =
    typeof config.method === 'string' &&
    typeof config.url === 'string' &&
    ('headers' in config || 'baseURL' in config)
  if (!isConfig) return null
  return {
    method: config.method.toUpperCase(),
    url: config.url,
    status: isResponse ? json.status : undefined,
  }
}

const printSection = (gutter, title, lines) => {
  if (lines.length === 0) return
  console.log(`${gutter}${color('1;35', title)}`)
  lines.forEach(line => console.log(`${gutter}  ${line}`))
}

const headerLines = headers =>
  Object.entries(headers ?? {}).map(([key, value]) => `${color(34, key)}: ${value}`)

let nextDevice = 1

new WebSocket.Server({ port }).on('connection', socket => {
  const tag = `#${nextDevice++}`
  socket.on('message', raw => {
    let entry
    try {
      entry = JSON.parse(raw)
    } catch {
      return
    }
    const prefix = color(90, `${tag} ${time(entry.timestamp ?? entry.endTime ?? Date.now())}`)

    if (entry.type === 'hello') {
      console.log(color(32, `● ${tag} connected: ${entry.device}`))
      return
    }
    if (entry.type === 'log') {
      // Objects arrive apart from the text (`objects`), so each one is printed as data
      const objects = entry.objects ?? []
      const text = entry.objects ? entry.text : entry.message
      const api = objects.length > 0 && apiCall(objects[0])
      const isApiLog = api && entry.level !== 'warn' && entry.level !== 'error'
      const level = isApiLog ? API_LOG : LEVELS[entry.level] ?? LEVELS.log
      const jsonLines = objects.map(object => JSON.stringify(object))
      // API dumps get a summary line; the full dump goes below it, or is dropped with --compact
      const block =
        objects.length > 0 && !compact && (api || jsonLines.join(' ').length > INLINE_JSON_MAX)
      const head = api
        ? [
            color(level.text, `↳ ${text}`),
            color(`1;${METHOD_COLORS[api.method] ?? 37}`, api.method),
            api.status !== undefined && color(`1;${statusColor(api.status)}`, api.status),
            color(level.text, api.url),
          ]
            .filter(Boolean)
            .join(' ')
        : color(level.text, text)
      const tail =
        objects.length > 0 && !block && !api ? ` ${jsonLines.map(colorJsonLine).join(' ')}` : ''
      console.log(`${prefix} ${badge(level.badge, entry.level.toUpperCase())} ${head}${tail}`)

      if (block) {
        const gutter = `${' '.repeat(tag.length + 17)}${color(level.text || 90, '│')} `
        jsonLines.forEach(line => prettyBody(line).forEach(row => console.log(`${gutter}  ${row}`)))
      }
      return
    }
    if (entry.type === 'network') {
      const failed = entry.error || !entry.status || entry.status >= 400
      const status = [entry.status ?? 'ERR', entry.statusText].filter(Boolean).join(' ')
      console.log(
        [
          prefix,
          badge(failed ? '41;97' : '45;97', 'NET'),
          color(`1;${METHOD_COLORS[entry.method] ?? 37}`, entry.method),
          color(`1;${statusColor(entry.status)}`, status),
          colorUrl(entry.url),
          color(90, `${entry.duration ?? '?'}ms${size(entry.responseSize)}`),
        ].join(' '),
      )
      if (compact && !failed) return

      // A magenta rule down from the NET badge ("#1 15:57:42.282 " + 3) ties the details to their request.
      const gutter = `${' '.repeat(tag.length + 17)}${color(failed ? 31 : 35, '│')} `
      if (entry.error) console.log(`${gutter}${color(31, entry.error)}`)
      printSection(gutter, 'Request headers', headerLines(entry.requestHeaders))
      printSection(gutter, 'Request body', entry.requestBody ? prettyBody(entry.requestBody) : [])
      printSection(gutter, 'Response headers', headerLines(entry.responseHeaders))
      printSection(
        gutter,
        'Response body',
        entry.responseBody ? prettyBody(entry.responseBody) : [],
      )
    }
  })
  socket.on('close', () => console.log(color(33, `○ ${tag} disconnected`)))
})

console.log(`Log host listening on ws://localhost:${port}`)
