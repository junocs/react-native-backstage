import { LogLevel } from './types'
import type { LogEntry } from './types'
import { formatLogMessage } from './utils/stringify'
import { DEFAULT_MAX_LOGS } from './constants'

// ─── Original Console Methods ────────────────────────────────────────────────

const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

type LogCallback = (entry: LogEntry) => void

let activeCallback: LogCallback | null = null
let isInstalled = false

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function createLogEntry(level: LogLevel, message: unknown, optionalParams: unknown[]): LogEntry {
  const formattedMessage = formatLogMessage(message, optionalParams)
  const hasObjectData =
    (typeof message === 'object' && message !== null) ||
    optionalParams.some(p => typeof p === 'object' && p !== null)

  return {
    id: generateId(),
    level,
    message: formattedMessage,
    data: hasObjectData ? { message, params: optionalParams } : undefined,
    timestamp: Date.now(),
  }
}

function shouldLog(message: unknown, filters: string[]): boolean {
  if (filters.length === 0) return true

  const messageStr =
    typeof message === 'string'
      ? message.toLowerCase()
      : typeof message === 'object' && message !== null
        ? JSON.stringify(message).toLowerCase()
        : String(message).toLowerCase()

  return !filters.some(filter => messageStr.includes(filter.toLowerCase()))
}

// ─── Install / Uninstall ─────────────────────────────────────────────────────

export function installInterceptor(callback: LogCallback, filters: string[] = []): void {
  if (isInstalled) {
    // Just update callback if already installed
    activeCallback = callback
    return
  }

  activeCallback = callback
  isInstalled = true

  const levels: Array<[LogLevel, keyof typeof originalConsole]> = [
    [LogLevel.log, 'log'],
    [LogLevel.debug, 'debug'],
    [LogLevel.info, 'info'],
    [LogLevel.warn, 'warn'],
    [LogLevel.error, 'error'],
  ]

  for (const [level, method] of levels) {
    console[method] = (message?: unknown, ...optionalParams: unknown[]) => {
      // Always forward to original console
      originalConsole[method](message, ...optionalParams)

      // Check filters
      if (!shouldLog(message, filters)) return

      // Create log entry and notify
      if (activeCallback) {
        const entry = createLogEntry(level, message, optionalParams)
        activeCallback(entry)
      }
    }
  }
}

export function uninstallInterceptor(): void {
  if (!isInstalled) return

  console.log = originalConsole.log
  console.debug = originalConsole.debug
  console.info = originalConsole.info
  console.warn = originalConsole.warn
  console.error = originalConsole.error

  activeCallback = null
  isInstalled = false
}

// ─── Log Buffer ──────────────────────────────────────────────────────────────

export class LogBuffer {
  private logs: LogEntry[] = []
  private maxSize: number

  constructor(maxSize = DEFAULT_MAX_LOGS) {
    this.maxSize = maxSize
  }

  push(entry: LogEntry): void {
    this.logs.unshift(entry)
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(0, this.maxSize)
    }
  }

  getAll(): LogEntry[] {
    return [...this.logs]
  }

  clear(): void {
    this.logs = []
  }

  get hasErrors(): boolean {
    return this.logs.some(log => log.level === LogLevel.error)
  }

  get size(): number {
    return this.logs.length
  }
}
