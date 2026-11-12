import { Platform } from 'react-native'
import { addLogListener } from './log-interceptor'
import { addNetworkListener } from './network-interceptor'
import { NetworkState } from './types'
import type { LogEntry, NetworkEntry } from './types'
import { safeStringify, splitLogParts } from './utils/stringify'

// ─── Log Stream ──────────────────────────────────────────────────────────────
//
// Streams every console call and fetch/XHR request to `backstage-log-host` over a WebSocket, so a
// remote device can be followed live. It taps the interceptors directly, ahead of the Logs tab's
// `logFilters` / `autoFilterNetworkLogs`. WebSocket rather than fetch: fetch/XHR are intercepted, so
// every POST would be captured and streamed again.

export type LogStreamStatus = 'off' | 'connecting' | 'connected'

const MAX_QUEUE = 2000
const RETRY_MS = 3000

// Apps log their own request configs and login responses, so credentials turn up in messages and
// bodies, not only in the Authorization header. Redacted from every payload before it leaves the device.
const JWT = /eyJ[\w-]*\.[\w-]+\.[\w-]+/g
const BEARER = /(Bearer\s+)[\w.~+/=-]+/gi

const platformConstants = Platform.constants as { Model?: string }

let url = ''
let label = [platformConstants.Model, `${Platform.OS} ${Platform.Version}`]
  .filter(Boolean)
  .join(' · ')
let socket: WebSocket | null = null
let queue: string[] = []
let retryTimer: ReturnType<typeof setTimeout> | undefined
let status: LogStreamStatus = 'off'
let removeTaps: (() => void) | undefined
const statusListeners = new Set<(status: LogStreamStatus) => void>()

function setStatus(next: LogStreamStatus): void {
  status = next
  statusListeners.forEach(listener => listener(next))
}

function send(message: object): void {
  const payload = JSON.stringify(message).replace(JWT, '[redacted]').replace(BEARER, '$1[redacted]')
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(payload)
  } else {
    queue.push(payload)
    if (queue.length > MAX_QUEUE) queue.shift()
  }
}

// Plain JSON for the wire: drops functions and cycles the way the Logs tab's stringify does
function toJson(value: unknown): unknown {
  try {
    return JSON.parse(safeStringify(value, 0))
  } catch {
    return String(value)
  }
}

// Objects travel apart from the text, so the host can pretty-print them instead of parsing the message
function streamLog({ level, message, timestamp, data }: LogEntry): void {
  const parts = data
    ? splitLogParts((data as { message: unknown }).message, (data as { params: unknown[] }).params)
    : null
  const objects = parts?.objects.length
    ? { text: parts.text, objects: parts.objects.map(toJson) }
    : {}
  send({ type: 'log', level, message, timestamp, ...objects })
}

function streamNetworkEntry(entry: NetworkEntry): void {
  if (entry.state === NetworkState.pending) return
  const requestHeaders = Object.fromEntries(
    Object.entries(entry.requestHeaders ?? {}).filter(
      ([key]) => key.toLowerCase() !== 'authorization',
    ),
  )
  send({ type: 'network', ...entry, requestHeaders })
}

function connect(): void {
  clearTimeout(retryTimer)
  const previous = socket
  socket = null
  previous?.close()

  if (!url) {
    removeTaps?.()
    removeTaps = undefined
    queue = []
    setStatus('off')
    return
  }

  if (!removeTaps) {
    const removeLogTap = addLogListener(streamLog)
    const removeNetworkTap = addNetworkListener(streamNetworkEntry)
    removeTaps = () => {
      removeLogTap()
      removeNetworkTap()
    }
  }

  setStatus('connecting')
  const ws = new WebSocket(url)
  socket = ws
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'hello', device: label }))
    queue.forEach(message => ws.send(message))
    queue = []
    setStatus('connected')
  }
  ws.onclose = () => {
    if (socket !== ws) return
    socket = null
    setStatus('connecting')
    retryTimer = setTimeout(connect, RETRY_MS)
  }
}

/**
 * Starts streaming to `url` (a no-op while it's empty). Call it at the top of `index.js`, before the app
 * is imported, so logs and requests are captured from JS startup; `label` names the device in the host.
 */
export function startLogStream(initialUrl?: string | null, options: { label?: string } = {}): void {
  if (options.label) label = options.label
  setLogStreamUrl(initialUrl ?? '')
}

/** Changes the stream URL at runtime; an empty string stops streaming and drops anything queued. */
export function setLogStreamUrl(next: string): void {
  url = next.trim()
  connect()
}

export function getLogStreamUrl(): string {
  return url
}

export function getLogStreamStatus(): LogStreamStatus {
  return status
}

export function subscribeLogStreamStatus(listener: (status: LogStreamStatus) => void): () => void {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}
