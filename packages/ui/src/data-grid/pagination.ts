import { z } from "zod"

/* -------------------------------------------------------------------------- */
/*                          Spring Data `Page<T>` shape                        */
/* -------------------------------------------------------------------------- */

/**
 * Wrap an item schema in the Spring Data `Page<T>` envelope, the response shape
 * produced by a Spring `Page`/`Pageable` controller (and a common pagination
 * contract generally):
 *
 * ```jsonc
 * { "content": [...], "totalElements": 20, "totalPages": 4, "number": 0, "size": 5, ... }
 * ```
 *
 * Validate a paged response with `pageSchema(itemSchema).parse(data)`, mirroring
 * the `schema.parse` convention used by every other hook in this layer.
 *
 * @example
 * ```ts
 * const usersPageSchema = pageSchema(userRowSchema);
 * const page = usersPageSchema.parse(await api.get("/users", { params }));
 * ```
 */
export const pageSchema = <TItem extends z.ZodTypeAny>(item: TItem) =>
  z.object({
    /** The rows for this page. */
    content: z.array(item),
    /** Total rows across every page (drives the infinite-scroll row count). */
    totalElements: z.number(),
    /** Total number of pages. */
    totalPages: z.number(),
    /** Zero-based index of the current page. */
    number: z.number(),
    /** Page size used for this response. */
    size: z.number(),
    /** Whether this is the first page. */
    first: z.boolean().optional(),
    /** Whether this is the last page. */
    last: z.boolean().optional(),
    /** Number of rows actually present in `content`. */
    numberOfElements: z.number().optional(),
    /** Whether the page is empty. */
    empty: z.boolean().optional(),
  })

/**
 * Convenience type mirroring what {@link pageSchema} parses into — the Spring
 * Data `Page<T>` response envelope.
 *
 * (Named `SPageResponse` rather than `SPage` so it doesn't collide with the
 * `SPage` page-layout component.)
 */
export interface SPageResponse<TItem> {
  content: TItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first?: boolean
  last?: boolean
  numberOfElements?: number
  empty?: boolean
}

/* -------------------------------------------------------------------------- */
/*                  Normalized server request / response shapes               */
/* -------------------------------------------------------------------------- */

/** A single sort instruction. */
export interface ServerSort {
  field: string
  dir: "asc" | "desc"
}

/**
 * A single normalized filter — a flat, transport-agnostic shape an app can
 * serialize however its backend expects. Produced from a search-query object by
 * {@link toServerFilters}.
 */
export interface ServerFilter {
  /** Column field the filter applies to. */
  field: string
  /** AG Grid filter family: `"text" | "number" | "date" | "set"`. */
  filterType: string
  /** Operator, e.g. `"contains" | "equals" | "greaterThan" | "inRange" | "set"`. */
  type: string
  /** Primary value (or the array of selected values for a set filter). */
  value: unknown
  /** Upper bound for range operators (`inRange`). */
  valueTo?: unknown
}

/**
 * What {@link SmartServerGrid}'s `fetchRows` receives — everything the server
 * needs to return one block of rows, in a framework-agnostic form. Both the AG
 * Grid block coordinates (`startRow`/`endRow`) and the page-oriented equivalents
 * (`page`/`pageSize`) are provided so callers can use whichever their API speaks.
 */
export interface ServerFetchParams {
  /** Zero-based index of the first requested row (inclusive). */
  startRow: number
  /** Index of the row after the last requested row (exclusive). */
  endRow: number
  /** Zero-based page index — `floor(startRow / pageSize)`. */
  page: number
  /** Rows per page/block — `endRow - startRow`. */
  pageSize: number
  /** Active sort instructions, in priority order. */
  sort: ServerSort[]
  /** Active filters. */
  filters: ServerFilter[]
}

/** What `fetchRows` resolves to: the block of rows plus the total row count. */
export interface ServerFetchResult<TRow> {
  rows: TRow[]
  /** Total rows on the server for the current filters (e.g. `Page.totalElements`). */
  total: number
}

/* -------------------------------------------------------------------------- */
/*                    Search-query → ServerFilter translation                 */
/* -------------------------------------------------------------------------- */

/**
 * Per-field overrides for {@link toServerFilters} — merged over the inferred
 * filter for that field, e.g. `{ name: { type: "contains" } }`.
 */
export type ToServerFiltersOverrides = Record<
  string,
  Partial<Omit<ServerFilter, "field">>
>

/** Presence check: `undefined` / `null` / `""` / `[]` carry no filter intent. */
const isAbsent = (value: unknown): boolean =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0)

/**
 * Read the bounds of a range-shaped object. Covers both range value shapes the
 * form layer produces: `{ from, to }` (`daterange`) and `{ start, end }`
 * (`timerange`).
 */
const rangeBounds = (
  value: Record<string, unknown>
): { from: unknown; to: unknown } | null => {
  if ("from" in value || "to" in value)
    return { from: value.from, to: value.to }
  if ("start" in value || "end" in value)
    return { from: value.start, to: value.end }
  return null
}

const inferRangeFilter = (
  field: string,
  bounds: { from: unknown; to: unknown }
): ServerFilter => {
  const sample = bounds.from ?? bounds.to
  const filterType = typeof sample === "number" ? "number" : "date"
  // A single bound degrades to an open-ended comparison instead of an
  // `inRange` with an undefined side.
  if (isAbsent(bounds.to))
    return { field, filterType, type: "greaterThanOrEqual", value: bounds.from }
  if (isAbsent(bounds.from))
    return { field, filterType, type: "lessThanOrEqual", value: bounds.to }
  return {
    field,
    filterType,
    type: "inRange",
    value: bounds.from,
    valueTo: bounds.to,
  }
}

/**
 * Convert a plain search-query object (e.g. the pruned `Partial<T>` emitted by
 * `SmartSearchForm`'s `onSearch`) into the {@link ServerFilter} list a grid's
 * `fetchRows` receives — so search forms and server grids compose without
 * per-page glue.
 *
 * Inference per value:
 * - `undefined` / `null` / `""` / `[]` → dropped (no filter intent)
 * - array → `filterType: "set", type: "set"`
 * - number → `filterType: "number", type: "equals"`
 * - `Date` → `filterType: "date", type: "equals"`
 * - range object (`{ from, to }` or `{ start, end }`) → `inRange` (or an
 *   open-ended `greaterThanOrEqual` / `lessThanOrEqual` when one side is empty)
 * - everything else (strings, booleans) → `filterType: "text", type: "equals"`
 *
 * Pass `overrides` to adjust individual fields, e.g.
 * `toServerFilters(query, { name: { type: "contains" } })`.
 */
export const toServerFilters = (
  query: Record<string, unknown>,
  overrides?: ToServerFiltersOverrides
): ServerFilter[] => {
  const filters: ServerFilter[] = []
  for (const [field, value] of Object.entries(query)) {
    if (isAbsent(value)) continue

    let inferred: ServerFilter
    if (Array.isArray(value)) {
      inferred = { field, filterType: "set", type: "set", value }
    } else if (typeof value === "number") {
      inferred = { field, filterType: "number", type: "equals", value }
    } else if (value instanceof Date) {
      inferred = { field, filterType: "date", type: "equals", value }
    } else if (typeof value === "object") {
      const bounds = rangeBounds(value as Record<string, unknown>)
      if (!bounds || (isAbsent(bounds.from) && isAbsent(bounds.to))) continue
      inferred = inferRangeFilter(field, bounds)
    } else {
      inferred = { field, filterType: "text", type: "equals", value }
    }

    filters.push({ ...inferred, ...overrides?.[field] })
  }
  return filters
}

/* -------------------------------------------------------------------------- */
/*                    AG Grid block → normalized params                       */
/* -------------------------------------------------------------------------- */

/**
 * Translate one AG Grid Infinite-Row-Model `getRows` request into the
 * normalized {@link ServerFetchParams} passed to a grid's `fetchRows`. Pure and
 * framework-agnostic (AG Grid's `sortModel` is accepted by structural shape, so
 * this module never imports AG Grid). Filters are not derived from the grid —
 * they come from the `filters`/`query` props and are applied by the datasource.
 */
export const buildServerFetchParams = (input: {
  startRow: number
  endRow: number
  sortModel: ReadonlyArray<{ colId: string; sort: "asc" | "desc" }>
}): ServerFetchParams => {
  const pageSize = Math.max(input.endRow - input.startRow, 1)
  return {
    startRow: input.startRow,
    endRow: input.endRow,
    pageSize,
    page: Math.floor(input.startRow / pageSize),
    sort: input.sortModel.map((s) => ({ field: s.colId, dir: s.sort })),
    filters: [],
  }
}

/**
 * Serialize sort instructions into Spring's `sort=field,dir` strings (one per
 * sorted column, in priority order). The page (`page`/`size`) and filter dialect
 * vary per backend, so those stay app-owned — only the unambiguous sort encoding
 * is provided here.
 *
 * @example `toSpringSort([{ field: "mrr", dir: "desc" }])` → `["mrr,desc"]`
 */
export const toSpringSort = (sort: ReadonlyArray<ServerSort>): string[] =>
  sort.map((s) => `${s.field},${s.dir}`)

/**
 * Serialize a single {@link ServerFilter} into the `<op>:<value>` value used by
 * the Spring query dialect below:
 *
 * - `inRange` → `inRange:<from>:<to>`
 * - set (array value) → `set:<a>,<b>,<c>`
 * - everything else → `<op>:<value>`
 */
export const encodeSpringFilter = (filter: ServerFilter): string => {
  if (filter.type === "inRange") {
    return `inRange:${String(filter.value)}:${String(filter.valueTo)}`
  }
  if (Array.isArray(filter.value)) {
    return `set:${filter.value.map(String).join(",")}`
  }
  return `${filter.type}:${String(filter.value)}`
}

/**
 * Serialize normalized {@link ServerFetchParams} into a Spring Data query string
 * (without the leading `?`) — the encoder half of the query contract:
 *
 * - paging  → `page=0&size=20`
 * - sorting → `sort=name,asc&sort=mrr,desc`  (repeatable, Spring style)
 * - filters → `<field>=<op>:<value>`, e.g. `name=contains:ada`,
 *             `mrr=inRange:1000:2000`, `status=set:Active,Pending`
 *
 * This is the default `encodeQuery` for {@link createPageFetcher}. The matching
 * *decoder* stays server/app-side (backends parse however they like), so it is
 * intentionally not shipped here.
 */
export const buildSpringQuery = (params: ServerFetchParams): string => {
  const sp = new URLSearchParams()
  sp.set("page", String(params.page))
  sp.set("size", String(params.pageSize))
  for (const sort of toSpringSort(params.sort)) sp.append("sort", sort)
  for (const filter of params.filters)
    sp.append(filter.field, encodeSpringFilter(filter))
  return sp.toString()
}

/**
 * Serialize normalized {@link ServerFetchParams} into a **flat** query string
 * (without the leading `?`) — for backends that expect bare `field=value` params
 * with no operator dialect (the shape many REST APIs accept):
 *
 * - paging  → `page=0&size=20`
 * - sorting → `sort=name,asc&sort=mrr,desc`  (repeatable)
 * - filters → `<field>=<value>`, e.g. `name=ada`; a set repeats the key
 *             (`status=Active&status=Pending`); an `inRange` splits into
 *             `<field>From` / `<field>To` (`mrr From=1000`, `mrrTo=2000`)
 *
 * Pass as {@link createPageFetcher}'s `encodeQuery` for a flat-param backend.
 * Paging is 0-based here too — set `pageIndexBase: 1` on the fetcher for
 * 1-indexed servers rather than re-encoding.
 */
export const buildFlatQuery = (params: ServerFetchParams): string => {
  const sp = new URLSearchParams()
  sp.set("page", String(params.page))
  sp.set("size", String(params.pageSize))
  for (const sort of toSpringSort(params.sort)) sp.append("sort", sort)
  for (const filter of params.filters) {
    if (filter.type === "inRange") {
      sp.append(`${filter.field}From`, String(filter.value))
      sp.append(`${filter.field}To`, String(filter.valueTo))
    } else if (Array.isArray(filter.value)) {
      for (const value of filter.value) sp.append(filter.field, String(value))
    } else {
      sp.append(filter.field, String(filter.value))
    }
  }
  return sp.toString()
}
