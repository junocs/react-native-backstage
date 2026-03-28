/**
 * Formats a timestamp (Date.now()) into a human-readable local time string.
 * Format: "h:mm:ss.SSS AM/PM"
 * No external dependencies — uses native Date API.
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()
  const ampm = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12
  hours = hours || 12

  const mm = minutes.toString().padStart(2, '0')
  const ss = seconds.toString().padStart(2, '0')
  const ms = milliseconds.toString().padStart(3, '0')

  return `${hours}:${mm}:${ss}.${ms} ${ampm}`
}
