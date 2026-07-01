import type {
  ServerFetchParams,
  ServerFilter,
  ServerSort,
} from "@workspace/ui/data-grid"

/**
 * Query contract shared by the client and the MSW mock:
 *
 * - paging  → `?page=0&size=20`
 * - sorting → `?sort=name,asc&sort=mrr,desc`  (repeatable, Spring style)
 * - filters → `?<field>=<op>:<value>`, e.g. `name=contains:ada`,
 *             `mrr=inRange:1000:2000`, `status=set:Active,Pending`
 */

const RESERVED = new Set(["page", "size", "sort"])

function encodeFilterValue(filter: ServerFilter): string {
  if (filter.type === "inRange") {
    return `inRange:${String(filter.value)}:${String(filter.valueTo)}`
  }
  if (Array.isArray(filter.value)) {
    return `set:${filter.value.map(String).join(",")}`
  }
  return `${filter.type}:${String(filter.value)}`
}

/** Serialize normalized grid params into a query string (without the leading `?`). */
export function buildUsersQuery(params: ServerFetchParams): string {
  const sp = new URLSearchParams()
  sp.set("page", String(params.page))
  sp.set("size", String(params.pageSize))
  for (const sort of params.sort) sp.append("sort", `${sort.field},${sort.dir}`)
  for (const filter of params.filters)
    sp.append(filter.field, encodeFilterValue(filter))
  return sp.toString()
}

export interface ParsedUsersQuery {
  page: number
  size: number
  sorts: ServerSort[]
  filters: ServerFilter[]
}

const NUMBER_OPS = new Set([
  "equals",
  "notEqual",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
])

function decodeFilter(field: string, raw: string): ServerFilter {
  const sep = raw.indexOf(":")
  const op = sep >= 0 ? raw.slice(0, sep) : "contains"
  const rest = sep >= 0 ? raw.slice(sep + 1) : raw

  if (op === "inRange") {
    const [from, to] = rest.split(":")
    return {
      field,
      filterType: "number",
      type: "inRange",
      value: from,
      valueTo: to,
    }
  }
  if (op === "set") {
    return { field, filterType: "set", type: "set", value: rest.split(",") }
  }
  return {
    field,
    filterType: NUMBER_OPS.has(op) ? "number" : "text",
    type: op,
    value: rest,
  }
}

/** Parse a request's search params back into normalized paging/sort/filter parts. */
export function parseUsersQuery(sp: URLSearchParams): ParsedUsersQuery {
  const page = Number(sp.get("page") ?? "0") || 0
  const size = Number(sp.get("size") ?? "20") || 20
  const sorts: ServerSort[] = sp.getAll("sort").map((raw) => {
    const [field, dir] = raw.split(",")
    return { field, dir: dir === "desc" ? "desc" : "asc" }
  })
  const filters: ServerFilter[] = []
  for (const [key, raw] of sp.entries()) {
    if (RESERVED.has(key)) continue
    filters.push(decodeFilter(key, raw))
  }
  return { page, size, sorts, filters }
}
