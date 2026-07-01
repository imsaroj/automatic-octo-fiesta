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
export function pageSchema<TItem extends z.ZodTypeAny>(item: TItem) {
  return z.object({
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
}

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
 * A single normalized filter, distilled from AG Grid's heterogeneous filter
 * model into a flat, transport-agnostic shape an app can serialize however its
 * backend expects.
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
 * What {@link SmartServerDataGrid}'s `fetchRows` receives — everything the server
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
/*                       AG Grid → normalized translation                     */
/* -------------------------------------------------------------------------- */

/** The subset of an AG Grid filter-model entry we read. Structurally matches AG Grid's model. */
interface AgFilterModelItem {
  filterType?: string
  type?: string
  filter?: unknown
  filterTo?: unknown
  dateFrom?: unknown
  dateTo?: unknown
  /** Set-filter selected values. */
  values?: unknown[]
  /** Combined (AND/OR) conditions. */
  operator?: "AND" | "OR"
  condition1?: AgFilterModelItem
  condition2?: AgFilterModelItem
}

function normalizeFilterItem(
  field: string,
  raw: AgFilterModelItem
): ServerFilter {
  // For combined conditions we take the first condition (a pragmatic v1 choice —
  // most server contracts accept a single predicate per field).
  const item = raw.condition1 ?? raw
  const isSet = Array.isArray(item.values)
  return {
    field,
    filterType: item.filterType ?? (isSet ? "set" : "text"),
    type: item.type ?? (isSet ? "set" : "contains"),
    value: isSet ? item.values : (item.filter ?? item.dateFrom),
    valueTo: item.filterTo ?? item.dateTo,
  }
}

/** Convert an AG Grid filter model into a flat list of {@link ServerFilter}. */
export function normalizeFilterModel(
  filterModel: Record<string, unknown> | null | undefined
): ServerFilter[] {
  if (!filterModel) return []
  return Object.entries(filterModel).map(([field, raw]) =>
    normalizeFilterItem(field, (raw ?? {}) as AgFilterModelItem)
  )
}

/**
 * Translate one AG Grid Infinite-Row-Model `getRows` request into the
 * normalized {@link ServerFetchParams} passed to a grid's `fetchRows`. Pure and
 * framework-agnostic (AG Grid's `sortModel`/`filterModel` are accepted by
 * structural shape, so this module never imports AG Grid).
 */
export function buildServerFetchParams(input: {
  startRow: number
  endRow: number
  sortModel: ReadonlyArray<{ colId: string; sort: "asc" | "desc" }>
  filterModel?: Record<string, unknown> | null
}): ServerFetchParams {
  const pageSize = Math.max(input.endRow - input.startRow, 1)
  return {
    startRow: input.startRow,
    endRow: input.endRow,
    pageSize,
    page: Math.floor(input.startRow / pageSize),
    sort: input.sortModel.map((s) => ({ field: s.colId, dir: s.sort })),
    filters: normalizeFilterModel(input.filterModel),
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
export function toSpringSort(sort: ReadonlyArray<ServerSort>): string[] {
  return sort.map((s) => `${s.field},${s.dir}`)
}
