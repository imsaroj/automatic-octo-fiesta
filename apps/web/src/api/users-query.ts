import type { ServerFilter, ServerSort } from "@workspace/ui/data-grid"

/**
 * Decoder half of the query contract shared by the MSW mock (the encoder lives
 * in the library as `buildSpringQuery`). Parses the Spring dialect back into
 * normalized paging/sort/filter parts:
 *
 * - paging  → `?page=0&size=20`
 * - sorting → `?sort=name,asc&sort=mrr,desc`  (repeatable, Spring style)
 * - filters → `?<field>=<op>:<value>`, e.g. `name=contains:ada`,
 *             `mrr=inRange:1000:2000`, `status=set:Active,Pending`
 */

const RESERVED = new Set(["page", "size", "sort"])

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

const decodeFilter = (field: string, raw: string): ServerFilter => {
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
export const parseUsersQuery = (sp: URLSearchParams): ParsedUsersQuery => {
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
