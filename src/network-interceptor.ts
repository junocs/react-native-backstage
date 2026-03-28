import { NetworkState } from './types'
import type { NetworkEntry } from './types'
import { DEFAULT_MAX_NETWORK_ENTRIES, DEFAULT_MAX_NETWORK_BODY_SIZE } from './constants'

// ─── Types ───────────────────────────────────────────────────────────────────

type NetworkCallback = (entry: NetworkEntry) => void

interface NetworkInterceptorOptions {
  filters?: string[]
  maxBodySize?: number
}

// ─── State ───────────────────────────────────────────────────────────────────

let activeCallback: NetworkCallback | null = null
let isInstalled = false
let interceptorOptions: NetworkInterceptorOptions = {}

// Track if we're inside a network callback context.
// Used by the log interceptor to auto-filter network-related console.logs.
let _activeNetworkCallbacks = 0

/**
 * Returns true if the current call stack originated from within a network
 * response handler (XHR load/error, fetch .then()). Used by the log
 * interceptor to suppress network-related console.logs from the Logs tab.
 */
export function isInsideNetworkCallback(): boolean {
  return _activeNetworkCallbacks > 0
}

function enterNetworkContext(): void {
  _activeNetworkCallbacks++
}

function exitNetworkContext(): void {
  // Defer decrement through microtask queue so developer's .then() chains
  // that fire after our return are also covered.
  queueMicrotask(() => {
    _activeNetworkCallbacks--
  })
}

// Store originals before patching
const originals: {
  fetch: typeof global.fetch | null
  XMLHttpRequest: typeof global.XMLHttpRequest | null
} = {
  fetch: null,
  XMLHttpRequest: null,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `net_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function shouldCapture(url: string, filters: string[]): boolean {
  if (filters.length === 0) return true
  const lower = url.toLowerCase()
  return !filters.some(f => lower.includes(f.toLowerCase()))
}

function truncateBody(body?: string, maxSize?: number): string | undefined {
  if (!body) return undefined
  const limit = maxSize ?? DEFAULT_MAX_NETWORK_BODY_SIZE
  if (body.length <= limit) return body
  return body.substring(0, limit) + '\n... [truncated]'
}

function parseHeaders(headers: Headers | undefined): Record<string, string> | undefined {
  if (!headers) return undefined
  const result: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    result[key] = value
  })
  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Generates a cURL command string from a NetworkEntry.
 */
export function toCurl(entry: NetworkEntry): string {
  const parts: string[] = ['curl']

  // Method
  if (entry.method && entry.method !== 'GET') {
    parts.push(`-X ${entry.method}`)
  }

  // Request headers
  if (entry.requestHeaders) {
    for (const [key, value] of Object.entries(entry.requestHeaders)) {
      parts.push(`-H '${key}: ${value}'`)
    }
  }

  // Request body
  if (entry.requestBody) {
    // Escape single quotes in body
    const escaped = entry.requestBody.replace(/'/g, "'\\''")
    parts.push(`-d '${escaped}'`)
  }

  // URL (must be last)
  parts.push(`'${entry.url}'`)

  return parts.join(' \\\n  ')
}

// ─── Fetch Interceptor ──────────────────────────────────────────────────────

function installFetchInterceptor(): void {
  const originalFetch = global.fetch
  if (!originalFetch) return
  originals.fetch = originalFetch

  global.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method =
      init?.method ??
      (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') ??
      'GET'

    // Check filters
    if (!shouldCapture(url, interceptorOptions.filters ?? [])) {
      return originalFetch(input, init)
    }

    // Build entry
    const entry: NetworkEntry = {
      id: generateId(),
      method: method.toUpperCase(),
      url,
      startTime: Date.now(),
      state: NetworkState.pending,
    }

    // Capture request headers
    if (init?.headers) {
      try {
        const h = new Headers(init.headers)
        entry.requestHeaders = parseHeaders(h)
      } catch {
        // Skip if headers can't be parsed
      }
    }

    // Capture request body
    if (init?.body) {
      try {
        entry.requestBody = truncateBody(
          typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
          interceptorOptions.maxBodySize,
        )
      } catch {
        entry.requestBody = '[unable to serialize body]'
      }
    }

    // Notify: request started
    activeCallback?.(entry)

    try {
      const response = await originalFetch(input, init)

      entry.endTime = Date.now()
      entry.duration = entry.endTime - entry.startTime
      entry.status = response.status
      entry.statusText = response.statusText
      entry.responseHeaders = parseHeaders(response.headers)
      entry.state = NetworkState.completed

      // Clone response to read body without consuming it
      try {
        const clone = response.clone()
        const text = await clone.text()
        entry.responseSize = text.length
        entry.responseBody = truncateBody(text, interceptorOptions.maxBodySize)
      } catch {
        // Body may not be readable (e.g., stream already consumed)
      }

      // Notify: request completed
      activeCallback?.(entry)

      // Mark network context so developer's .then() console.logs are filtered
      enterNetworkContext()

      // Return the ORIGINAL response untouched
      // Developer's .then() runs in the next microtask — exitNetworkContext
      // defers via queueMicrotask to cover it.
      const result = response
      exitNetworkContext()
      return result
    } catch (err) {
      entry.endTime = Date.now()
      entry.duration = entry.endTime - entry.startTime
      entry.state = NetworkState.error
      entry.error = err instanceof Error ? err.message : String(err)

      // Notify: request failed
      activeCallback?.(entry)

      // Re-throw the original error
      throw err
    }
  }
}

// ─── XMLHttpRequest Interceptor ──────────────────────────────────────────────

function installXHRInterceptor(): void {
  const OriginalXHR = global.XMLHttpRequest
  if (!OriginalXHR) return
  originals.XMLHttpRequest = OriginalXHR

  global.XMLHttpRequest = function InterceptedXHR() {
    const xhr = new OriginalXHR()
    const entry: NetworkEntry = {
      id: generateId(),
      method: 'GET',
      url: '',
      startTime: Date.now(),
      state: NetworkState.pending,
      requestHeaders: {},
    }

    let shouldTrack = true

    // Intercept open()
    const originalOpen = xhr.open.bind(xhr)
    xhr.open = function (method: string, url: string, ...rest: unknown[]) {
      entry.method = method.toUpperCase()
      entry.url = url
      shouldTrack = shouldCapture(url, interceptorOptions.filters ?? [])
      // @ts-expect-error — forwarding args to original
      return originalOpen(method, url, ...rest)
    }

    // Intercept setRequestHeader()
    const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr)
    xhr.setRequestHeader = function (name: string, value: string) {
      if (shouldTrack && entry.requestHeaders) {
        entry.requestHeaders[name] = value
      }
      return originalSetRequestHeader(name, value)
    }

    // Intercept send()
    const originalSend = xhr.send.bind(xhr)
    xhr.send = function (
      body?:
        | string
        | Document
        | Blob
        | ArrayBufferView
        | ArrayBuffer
        | FormData
        | URLSearchParams
        | null,
    ) {
      if (!shouldTrack) {
        return originalSend(body)
      }

      entry.startTime = Date.now()

      // Capture request body
      if (body) {
        try {
          entry.requestBody = truncateBody(
            typeof body === 'string' ? body : JSON.stringify(body),
            interceptorOptions.maxBodySize,
          )
        } catch {
          entry.requestBody = '[unable to serialize body]'
        }
      }

      // Clean up empty request headers
      if (entry.requestHeaders && Object.keys(entry.requestHeaders).length === 0) {
        entry.requestHeaders = undefined
      }

      // Notify: request started
      activeCallback?.(entry)

      // Listen for completion
      xhr.addEventListener('load', () => {
        enterNetworkContext()

        entry.endTime = Date.now()
        entry.duration = entry.endTime - entry.startTime
        entry.status = xhr.status
        entry.statusText = xhr.statusText
        entry.state = NetworkState.completed

        // Parse response headers
        const rawHeaders = xhr.getAllResponseHeaders()
        if (rawHeaders) {
          const parsed: Record<string, string> = {}
          rawHeaders
            .trim()
            .split(/[\r\n]+/)
            .forEach(line => {
              const idx = line.indexOf(': ')
              if (idx > 0) {
                parsed[line.substring(0, idx).toLowerCase()] = line.substring(idx + 2)
              }
            })
          entry.responseHeaders = Object.keys(parsed).length > 0 ? parsed : undefined
        }

        // Capture response body
        try {
          const responseText =
            xhr.responseType === '' || xhr.responseType === 'text'
              ? xhr.responseText
              : JSON.stringify(xhr.response)
          entry.responseSize = responseText?.length
          entry.responseBody = truncateBody(responseText, interceptorOptions.maxBodySize)
        } catch {
          // Response may not be text-readable
        }

        activeCallback?.(entry)
        exitNetworkContext()
      })

      xhr.addEventListener('error', () => {
        enterNetworkContext()
        entry.endTime = Date.now()
        entry.duration = entry.endTime - entry.startTime
        entry.state = NetworkState.error
        entry.error = 'Network request failed'
        activeCallback?.(entry)
        exitNetworkContext()
      })

      xhr.addEventListener('timeout', () => {
        enterNetworkContext()
        entry.endTime = Date.now()
        entry.duration = entry.endTime - entry.startTime
        entry.state = NetworkState.error
        entry.error = 'Request timed out'
        activeCallback?.(entry)
        exitNetworkContext()
      })

      xhr.addEventListener('abort', () => {
        enterNetworkContext()
        entry.endTime = Date.now()
        entry.duration = entry.endTime - entry.startTime
        entry.state = NetworkState.error
        entry.error = 'Request aborted'
        activeCallback?.(entry)
        exitNetworkContext()
      })

      return originalSend(body)
    }

    return xhr
  } as unknown as typeof XMLHttpRequest

  // Copy static properties and prototype
  Object.defineProperty(global.XMLHttpRequest, 'UNSENT', { value: 0 })
  Object.defineProperty(global.XMLHttpRequest, 'OPENED', { value: 1 })
  Object.defineProperty(global.XMLHttpRequest, 'HEADERS_RECEIVED', { value: 2 })
  Object.defineProperty(global.XMLHttpRequest, 'LOADING', { value: 3 })
  Object.defineProperty(global.XMLHttpRequest, 'DONE', { value: 4 })
  global.XMLHttpRequest.prototype = OriginalXHR.prototype
}

// ─── Install / Uninstall ─────────────────────────────────────────────────────

export function installNetworkInterceptor(
  callback: NetworkCallback,
  options: NetworkInterceptorOptions = {},
): void {
  if (isInstalled) {
    // Update callback and options if already installed
    activeCallback = callback
    interceptorOptions = options
    return
  }

  activeCallback = callback
  interceptorOptions = options
  isInstalled = true

  installFetchInterceptor()
  installXHRInterceptor()
}

export function uninstallNetworkInterceptor(): void {
  if (!isInstalled) return

  // Restore originals
  if (originals.fetch) {
    global.fetch = originals.fetch
    originals.fetch = null
  }
  if (originals.XMLHttpRequest) {
    global.XMLHttpRequest = originals.XMLHttpRequest
    originals.XMLHttpRequest = null
  }

  activeCallback = null
  isInstalled = false
}

// ─── Network Buffer ──────────────────────────────────────────────────────────

export class NetworkBuffer {
  private entries: Map<string, NetworkEntry> = new Map()
  private order: string[] = []
  private maxSize: number

  constructor(maxSize = DEFAULT_MAX_NETWORK_ENTRIES) {
    this.maxSize = maxSize
  }

  /**
   * Upsert a network entry. If the entry already exists (same id),
   * update it in place (e.g., pending → completed). Otherwise add new.
   */
  upsert(entry: NetworkEntry): void {
    if (this.entries.has(entry.id)) {
      // Update existing entry (pending → completed/error)
      this.entries.set(entry.id, entry)
    } else {
      // Add new entry at the front
      this.order.unshift(entry.id)
      this.entries.set(entry.id, entry)

      // Evict oldest if over capacity
      while (this.order.length > this.maxSize) {
        const oldId = this.order.pop()
        if (oldId) this.entries.delete(oldId)
      }
    }
  }

  getAll(): NetworkEntry[] {
    return this.order.map(id => this.entries.get(id)!).filter(Boolean)
  }

  clear(): void {
    this.entries.clear()
    this.order = []
  }

  get hasErrors(): boolean {
    return this.order.some(id => this.entries.get(id)?.state === NetworkState.error)
  }

  get size(): number {
    return this.order.length
  }
}
