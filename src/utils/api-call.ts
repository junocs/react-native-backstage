export interface ApiCall {
  method: string
  url: string
  status?: number
}

/**
 * Recognizes an axios/apisauce request config (`method`, `url`, `headers` or `baseURL`) or a response
 * (`config` plus `status`) logged by an app's own interceptors, so it can be summarized like the request
 * it belongs to. Mirrored by `bin/log-host.mjs`.
 */
export function describeApiCall(value: unknown): ApiCall | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const isResponse =
    typeof record.config === 'object' && record.config !== null && 'status' in record
  const config = (isResponse ? record.config : record) as Record<string, unknown>
  const isConfig =
    typeof config.method === 'string' &&
    typeof config.url === 'string' &&
    ('headers' in config || 'baseURL' in config)
  if (!isConfig) return null

  return {
    method: (config.method as string).toUpperCase(),
    url: config.url as string,
    status: isResponse && typeof record.status === 'number' ? record.status : undefined,
  }
}
