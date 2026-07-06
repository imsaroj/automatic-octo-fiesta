import { z } from "zod"
import {
  pageSchema,
  buildSpringQuery,
  type ServerFetchParams,
  type ServerFetchResult,
} from "./pagination"

/**
 * A `fetchRows` implementation for {@link SmartServerDataGrid}: takes the
 * normalized grid request plus an abort signal and resolves to a block of rows
 * and the total count. An optional third argument carries per-call query params
 * (e.g. a demo `simulateError` toggle) merged on top of the built query.
 */
export type PageFetcher<TItem> = (
  params: ServerFetchParams,
  signal: AbortSignal,
  extraParams?: Record<string, string>
) => Promise<ServerFetchResult<TItem>>

export interface CreatePageFetcherOptions<TItem> {
  /** Endpoint to fetch from. The built query string is appended after `?`. */
  url: string
  /**
   * Zod schema for a single row. The response is validated against
   * `pageSchema(itemSchema)` (the Spring Data `Page<T>` envelope) so malformed
   * responses fail loudly instead of silently rendering garbage.
   */
  itemSchema: z.ZodType<TItem>
  /**
   * Serialize grid params into a query string (without the leading `?`).
   * Defaults to {@link buildSpringQuery} (the Spring Data dialect). Override to
   * speak a different backend contract.
   */
  buildQuery?: (params: ServerFetchParams) => string
  /**
   * Turn a non-OK response into the error thrown to the grid. Receives the
   * `Response` so callers can read a status-specific message. Defaults to
   * `Error("Server error: <status>")`.
   */
  mapError?: (response: Response) => Error
  /**
   * Injected `fetch` implementation. Defaults to the global `fetch`. Provided so
   * this module stays testable (fake transport) and usable outside the browser
   * (SSR / node with a polyfill) without reaching for the global.
   */
  fetchImpl?: typeof fetch
}

const mergeQuery = (query: string, extra?: Record<string, string>): string => {
  if (!extra) return query
  const sp = new URLSearchParams(query)
  for (const [key, value] of Object.entries(extra)) sp.set(key, value)
  return sp.toString()
}

/**
 * Build a validated `fetchRows` adapter for {@link SmartServerDataGrid}: it
 * serializes normalized grid params to a query string, calls `url`, checks the
 * HTTP status, and validates the response against the Spring Data `Page<T>`
 * envelope before returning `{ rows, total }`.
 *
 * Every server-grid page shares this fetch → status-check → Zod-parse pipeline,
 * so it lives here once instead of being re-hand-rolled per page.
 *
 * @example
 * ```ts
 * const fetchUsers = createPageFetcher({
 *   url: "/api/users",
 *   itemSchema: userRowSchema,
 * })
 * // <SmartServerGrid fetchRows={fetchUsers} … />
 * ```
 */
export const createPageFetcher = <TItem>({
  url,
  itemSchema,
  buildQuery = buildSpringQuery,
  mapError = (response) => new Error(`Server error: ${response.status}`),
  fetchImpl,
}: CreatePageFetcherOptions<TItem>): PageFetcher<TItem> => {
  const envelope = pageSchema(itemSchema)
  return async (params, signal, extraParams) => {
    const doFetch = fetchImpl ?? fetch
    const query = mergeQuery(buildQuery(params), extraParams)
    const response = await doFetch(`${url}?${query}`, { signal })
    if (!response.ok) throw mapError(response)
    const data: unknown = await response.json()
    const page = envelope.parse(data)
    return { rows: page.content, total: page.totalElements }
  }
}
