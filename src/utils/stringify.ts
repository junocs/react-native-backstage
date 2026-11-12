/**
 * Safely stringifies a value, handling circular references and Error objects.
 */
export function safeStringify(value: unknown, indent = 2): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'

  if (value instanceof Error) {
    return JSON.stringify(
      {
        name: value.name,
        message: value.message,
        stack: value.stack,
      },
      null,
      indent,
    )
  }

  const seen = new WeakSet()

  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular]'
          }
          seen.add(val)
        }
        if (typeof val === 'bigint') {
          return val.toString()
        }
        if (typeof val === 'function') {
          return `[Function: ${val.name || 'anonymous'}]`
        }
        if (typeof val === 'symbol') {
          return val.toString()
        }
        return val
      },
      indent,
    )
  } catch {
    return String(value)
  }
}

/**
 * Formats a console message and its optional params into a single string.
 */
export function formatLogMessage(message: unknown, optionalParams?: unknown[]): string {
  const parts: string[] = []

  if (message instanceof Error) {
    parts.push(`${message.name}: ${message.message}`)
  } else if (typeof message === 'object' && message !== null) {
    parts.push(safeStringify(message, 0))
  } else if (typeof message === 'string') {
    // Strip console color formatting (%c)
    parts.push(message.replace(/%c/g, '').trim())
  } else {
    parts.push(String(message))
  }

  if (optionalParams && optionalParams.length > 0) {
    for (const param of optionalParams) {
      if (typeof param === 'string' && isColorString(param)) {
        continue // skip css color strings from console.log('%c ...', 'color: ...')
      }
      if (typeof param === 'object' && param !== null) {
        parts.push(safeStringify(param, 0))
      } else {
        parts.push(String(param))
      }
    }
  }

  return parts.join(' ')
}

/**
 * Splits a console call into its text and the objects logged with it, by the same rules as
 * `formatLogMessage`, so objects can be shown as structured data instead of inline JSON.
 */
export function splitLogParts(
  message: unknown,
  optionalParams: unknown[] = [],
): { text: string; objects: unknown[] } {
  const text: string[] = []
  const objects: unknown[] = []

  const add = (value: unknown, isMessage: boolean) => {
    if (typeof value === 'string') {
      if (isMessage) text.push(value.replace(/%c/g, '').trim())
      else if (!isColorString(value)) text.push(value)
    } else if (value instanceof Error) {
      if (isMessage) text.push(`${value.name}: ${value.message}`)
      else objects.push({ name: value.name, message: value.message, stack: value.stack })
    } else if (typeof value === 'object' && value !== null) {
      objects.push(value)
    } else {
      text.push(String(value))
    }
  }

  add(message, true)
  optionalParams.forEach(param => add(param, false))
  return { text: text.join(' '), objects }
}

function isColorString(str: string): boolean {
  return (
    str.includes('color:') ||
    str.includes('background:') ||
    str.includes('font-') ||
    /^#[0-9A-Fa-f]{3,8}$/.test(str.trim())
  )
}
