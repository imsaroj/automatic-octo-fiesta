import { z } from "zod"
import {
  pageResponseSchema,
  buildPageQuery,
  type ServerFetchParams,
  type ServerFetchResult,
  type PageResponse,
} from "./pagination"

/**
 * A `fetchRows` implementation for {@link SmartServerGrid}: takes the
 * normalized grid request plus an abort signal and resolves to a block of rows
 * and the total count. An optional third argument carries per-call query params
 * (e.g. a demo `simulateError` toggle) merged on top of the built query.
 */
export type PageFetcher<TItem> = (
  params: ServerFetchParams,
  signal: AbortSignal,
  extraParams?: Record<string, string>
) => Promise<ServerFetchResult<TItem>>

/**
 * A transport for {@link createPageFetcher}: given the built request URL and an
 * abort signal, resolve to the **parsed response body**. This is the seam that
 * makes the fetcher transport-agnostic — supply an axios/ky/fetch-based function
 * that carries your auth headers, base URL, and status-error handling:
 *
 * ```ts
 * request: (url, { signal }) => http.get(url, { signal }).then((r) => r.data)
 * ```
 *
 * The default (used when `request` is omitted) is a `fetch` call that checks the
 * HTTP status via `mapError` and returns `response.json()`.
 */
export type ServerRequest = (
  url: string,
  context: { signal: AbortSignal }
) => Promise<unknown>

export interface CreatePageFetcherOptions<TItem> {
  /** Endpoint to fetch from. The built query string is appended after `?`. */
  url: string
  /**
   * Zod schema for a single row. When provided, the (unwrapped) response is
   * validated against `pageResponseSchema(itemSchema)` — the `PageResponse<T>`
   * envelope — so malformed responses fail loudly instead of silently rendering
   * garbage. **Optional**: omit it to skip validation when the source is trusted
   * (the response is then read structurally as a `PageResponse<T>`).
   */
  itemSchema?: z.ZodType<TItem>
  /**
   * Serialize grid params into a query string (without the leading `?`).
   * Defaults to {@link buildPageQuery} (the operator dialect); pass
   * {@link buildFlatQuery} for bare `field=value` params, or a custom encoder for
   * any other backend contract.
   */
  encodeQuery?: (params: ServerFetchParams) => string
  /**
   * Page-number base the backend expects. `0` (default) sends the grid's native
   * zero-based page index; `1` sends `page + 1` for 1-indexed APIs — so the
   * off-by-one lives here once instead of in every consumer.
   */
  pageIndexBase?: 0 | 1
  /**
   * Peel a response envelope down to the `PageResponse<T>` shape before it is
   * validated / read. Default is identity. For a global `{ data: PageResponse<T> }`
   * wrapper: `unwrap: (body) => (body as { data: unknown }).data`.
   */
  unwrap?: (body: unknown) => unknown
  /**
   * Transport used to fetch the URL — see {@link ServerRequest}. Defaults to a
   * `fetch` call guarded by `mapError`. When supplied, `mapError` / `fetchImpl`
   * (which only configure the default transport) are ignored.
   */
  request?: ServerRequest
  /**
   * Turn a non-OK response into the error thrown to the grid. Receives the
   * `Response` so callers can read a status-specific message. Defaults to
   * `Error("Server error: <status>")`. Only used by the default transport.
   */
  mapError?: (response: Response) => Error
  /**
   * Injected `fetch` implementation for the default transport. Defaults to the
   * global `fetch`. Provided so this module stays testable (fake transport) and
   * usable outside the browser (SSR / node with a polyfill) without reaching for
   * the global. Ignored when a `request` is supplied.
   */
  fetchImpl?: typeof fetch
}

const mergeQuery = (query: string, extra?: Record<string, string>): string => {
  if (!extra) return query
  const sp = new URLSearchParams(query)
  for (const [key, value] of Object.entries(extra)) sp.set(key, value)
  return sp.toString()
}

/** The default `fetch`-based transport: status-check via `mapError`, then JSON. */
const fetchRequest =
  (
    mapError: (response: Response) => Error,
    fetchImpl?: typeof fetch
  ): ServerRequest =>
  async (url, { signal }) => {
    const doFetch = fetchImpl ?? fetch
    const response = await doFetch(url, { signal })
    if (!response.ok) throw mapError(response)
    return (await response.json()) as unknown
  }

/**
 * Build a `fetchRows` adapter for {@link SmartServerGrid}: it serializes
 * normalized grid params to a query string, requests `url` through the
 * (pluggable) transport, optionally peels a response envelope, and returns
 * `{ rows, total }` — validating against the `PageResponse<T>` envelope when
 * an `itemSchema` is given.
 *
 * Every server-grid page shares this encode → request → unwrap → parse pipeline,
 * so it lives here once instead of being re-hand-rolled per page. The four
 * transport knobs (`request`, `pageIndexBase`, `unwrap`, `encodeQuery`) all
 * default to today's behavior — a plain `fetch` against a 0-indexed, un-enveloped
 * endpoint — so existing callers are unaffected.
 *
 * @example default
 * ```ts
 * const fetchUsers = createPageFetcher({ url: "/api/users", itemSchema: userRowSchema })
 * ```
 *
 * @example axios + `{ data: PageResponse<T> }` envelope, 1-indexed, flat params
 * ```ts
 * const fetchUsers = createPageFetcher({
 *   url: "/users",
 *   request: (url, { signal }) => http.get(url, { signal }).then((r) => r.data),
 *   unwrap: (body) => (body as { data: unknown }).data,
 *   pageIndexBase: 1,
 *   encodeQuery: buildFlatQuery,
 *   itemSchema: userRowSchema,
 * })
 * ```
 */
export const createPageFetcher = <TItem>({
  url,
  itemSchema,
  encodeQuery,
  pageIndexBase = 0,
  unwrap,
  request,
  mapError = (response) => new Error(`Server error: ${response.status}`),
  fetchImpl,
}: CreatePageFetcherOptions<TItem>): PageFetcher<TItem> => {
  const encode = encodeQuery ?? buildPageQuery
  const doRequest = request ?? fetchRequest(mapError, fetchImpl)
  const envelope = itemSchema ? pageResponseSchema(itemSchema) : undefined

  return async (params, signal, extraParams) => {
    // Shift only the page index for 1-indexed backends; the rest of the params
    // (startRow/endRow, sort, filters) reach the encoder untouched.
    const encodeParams =
      pageIndexBase === 0
        ? params
        : { ...params, page: params.page + pageIndexBase }
    const query = mergeQuery(encode(encodeParams), extraParams)
    const body = await doRequest(`${url}?${query}`, { signal })
    const unwrapped = unwrap ? unwrap(body) : body
    const page = envelope
      ? envelope.parse(unwrapped)
      : (unwrapped as PageResponse<TItem>)
    return { rows: page.content, total: page.totalElements }
  }
}
