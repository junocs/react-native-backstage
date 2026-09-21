import { useEffect, useState } from 'react'
import { DEFAULT_QUERY_STATE_THROTTLE_MS } from './constants'
import type { QueryClientLike, QueryLike } from './types'
import { formatTimestamp } from './utils/formatTimestamp'
import { safeStringify } from './utils/stringify'

// ─── Types ───────────────────────────────────────────────────────────────────

/** A snapshot of the query cache, shaped for the State Tree. */
export type ReactQueryState = Record<string, unknown>

// ─── Labels ──────────────────────────────────────────────────────────────────

/**
 * Where a resource's bare `[resource]` payload goes when it also has keyed siblings — `['me']` and
 * `['me', 'preferences']` both being cached, say. Reporting the bare value alone would hide the
 * siblings and reporting only the map would hide the bare value.
 */
const ROOT_ENTRY_LABEL = '(root)'

/** Reported in place of the tree when the passed client does not behave like a QueryClient. */
const ERROR_LABEL = '(error)'

/**
 * `'site-zones'` becomes `siteZones`, so a node reads like the rest of the state tree rather than
 * like a URL path. Already-camelCase resources pass through untouched.
 */
const toCamelCase = (resource: string) =>
  resource
    .replace(/[-_\s]+(.)?/g, (_match, char: string | undefined) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, char => char.toLowerCase())

/**
 * Query keys are conventionally `['resource', ...ids]`, but react-query allows any serializable
 * value in any position — object-first keys like `[{ scope: 'todos', id: 1 }]` are a documented
 * pattern. Rendering whatever is there compactly means those apps get a usable tree instead of a
 * silently empty one.
 */
const keyPartLabel = (part: unknown): string =>
  typeof part === 'string' ? part : typeof part === 'object' ? safeStringify(part, 0) : String(part)

const sliceNameFor = (resource: unknown) =>
  typeof resource === 'string' ? toCamelCase(resource) : keyPartLabel(resource)

// ─── Entry Filtering ─────────────────────────────────────────────────────────

/**
 * A `null`/`undefined` key part is a query that was mounted before its input was known —
 * `['sites', undefined]` while the current site id is still null — which is a disabled observer
 * holding a placeholder, not state. Pure noise in a tree someone is scrolling to find one entry.
 */
const hasResolvedKey = (parts: readonly unknown[]) => parts.every(part => part != null)

/**
 * `data == null` covers both "the key exists but has never resolved" and the `null` some apps write
 * from a 404 handler — neither is worth a row. An errored query is the exception: it has no data by
 * definition, and it is usually the exact thing the panel was opened to look at.
 */
const isWorthShowing = (query: QueryLike) =>
  query.state.data != null || query.state.status === 'error'

// ─── Meta ────────────────────────────────────────────────────────────────────

const errorLabel = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : safeStringify(error, 0)

/**
 * The questions a payload alone cannot answer: is this stale, is it refetching right now, how old
 * is it, did the last attempt fail. Every field is optional because this is read off a duck-typed
 * client — react-query v4 and v5 disagree on some of these names, and a missing one should drop out
 * of the node rather than show up as `undefined`.
 */
const buildMeta = (query: QueryLike): Record<string, unknown> => {
  const { status, fetchStatus, dataUpdatedAt, errorUpdateCount, error } = query.state
  const meta: Record<string, unknown> = {}

  if (status !== undefined) meta.status = status
  if (fetchStatus !== undefined) meta.fetchStatus = fetchStatus
  if (typeof query.isStale === 'function') meta.isStale = query.isStale()
  if (dataUpdatedAt) meta.updatedAt = formatTimestamp(dataUpdatedAt)
  if (error != null) meta.error = errorLabel(error)
  if (errorUpdateCount) meta.errorUpdateCount = errorUpdateCount

  return meta
}

/**
 * `data` is omitted rather than reported as `undefined`, which is the shape an errored or
 * never-resolved query has. `_meta` sorts first and JsonTreeView renders every node collapsed, so
 * the tree reads as payloads at a glance and the meta is one tap away when it matters.
 */
const buildEntry = (query: QueryLike) => {
  const meta = buildMeta(query)
  return query.state.data === undefined ? { _meta: meta } : { _meta: meta, data: query.state.data }
}

// ─── Snapshot ────────────────────────────────────────────────────────────────

/**
 * Snapshots the server state an app holds in react-query, shaped for the State Tree.
 *
 * Reads the RAW cached payloads rather than anything a `select` builds on top of them. That is what
 * the cache actually holds, and what gets persisted, so this tree is the thing to look at when a
 * slice comes back wrong after a cold start. Reading the cache directly rather than mounting
 * observers also means the panel cannot make a query fetch just by being rendered.
 *
 * Empty slices are omitted along with empty entries, so the tree only ever shows resources that
 * actually hold something.
 *
 * One pass over the cache, bucketed by the key's first element, rather than a lookup per resource:
 * this reruns on a throttle for as long as the panel is open.
 */
export const snapshotReactQueryState = (queryClient: QueryClientLike): ReactQueryState => {
  const bareBySlice = new Map<string, unknown>()
  const entriesBySlice = new Map<string, Record<string, unknown>>()

  try {
    for (const query of queryClient.getQueryCache().getAll()) {
      const [resource, ...rest] = query.queryKey

      if (resource == null || !isWorthShowing(query)) continue

      const slice = sliceNameFor(resource)

      if (rest.length === 0) {
        bareBySlice.set(slice, buildEntry(query))
        continue
      }
      if (!hasResolvedKey(rest)) continue

      /**
       * The map key is every element after the resource, joined — not just the second one, because
       * resources do not all have two-part keys. `['sites', false]`, `['sites', true]` and
       * `['sites', siteId]` are three distinct shapes, so keying on one element would collapse
       * entries onto each other. Seeing the variants side by side is the point.
       */
      const entries = entriesBySlice.get(slice) ?? {}
      entries[rest.map(keyPartLabel).join(' | ')] = buildEntry(query)
      entriesBySlice.set(slice, entries)
    }
  } catch (error) {
    /**
     * A debug panel must never be the thing that takes an app down. The client is duck-typed, so a
     * shape this does not understand is possible; reporting it in the tree makes that
     * self-diagnosing instead of silent.
     */
    return { [ERROR_LABEL]: errorLabel(error) }
  }

  /**
   * Sorted rather than left in cache order, which shifts as queries mount and unmount: a node that
   * moves between snapshots is a node someone loses while scrolling. `(root)` is the exception and
   * stays pinned above its keyed siblings.
   */
  const snapshot: ReactQueryState = {}
  const slices = new Set([...bareBySlice.keys(), ...entriesBySlice.keys()])

  for (const slice of [...slices].sort()) {
    const entries = entriesBySlice.get(slice)
    const bare = bareBySlice.get(slice)

    // A resource cached only under its bare key reads better as the entry itself than as a
    // one-entry map.
    if (!entries) {
      snapshot[slice] = bare
      continue
    }

    const sorted: Record<string, unknown> = {}
    if (bare !== undefined) sorted[ROOT_ENTRY_LABEL] = bare
    for (const label of Object.keys(entries).sort()) sorted[label] = entries[label]

    snapshot[slice] = sorted
  }

  return snapshot
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Keeps a throttled snapshot of the query cache for as long as `enabled` is true.
 *
 * Backstage passes whether the panel is open, so a closed panel subscribes to nothing and builds no
 * snapshot: the cost of this feature is bounded to the time someone is actually looking at it.
 * Returns `undefined` when there is no client or nothing is enabled, which is what keeps the
 * `reactQuery` node out of the state tree entirely rather than showing it empty.
 */
export const useReactQueryState = (
  queryClient: QueryClientLike | undefined,
  enabled: boolean,
  throttleMs: number = DEFAULT_QUERY_STATE_THROTTLE_MS,
): ReactQueryState | undefined => {
  const [state, setState] = useState<ReactQueryState | undefined>(undefined)

  useEffect(() => {
    if (!queryClient || !enabled) {
      setState(undefined)
      return
    }

    setState(snapshotReactQueryState(queryClient))

    let timer: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      /**
       * Deliberately hand-rolled rather than a throttle helper: this callback must NEVER call
       * `setState` synchronously. `QueryCache.notify` fires inline from `QueryCache.add`, which
       * `build()` calls while some other component is rendering its first `useQuery` for a key — so
       * a synchronous update here is a cross-component render-phase update, and the "Cannot update
       * a component while rendering a different component" warning that goes with it.
       *
       * `lodash.throttle` cannot promise that, which is worth knowing before anyone swaps this out
       * for it: it is `debounce` with `maxWait`, and its maxing branch invokes inline as soon as a
       * call arrives more than `wait` after the last invoke while a timer is pending. Setting
       * `leading: false` does not disable that path. Scheduling every snapshot on a timer does.
       */
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        setState(snapshotReactQueryState(queryClient))
      }, throttleMs)
    })

    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [queryClient, enabled, throttleMs])

  return state
}
