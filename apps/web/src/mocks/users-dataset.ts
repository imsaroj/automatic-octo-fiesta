import type { ServerFilter, ServerSort } from "@workspace/ui/data-grid"
import type { UserRow } from "@/api/users"

const FIRST = [
  "Ada",
  "Alan",
  "Grace",
  "Linus",
  "Edsger",
  "Barbara",
  "Ken",
  "Margaret",
  "Donald",
  "Katherine",
]
const LAST = [
  "Lovelace",
  "Turing",
  "Hopper",
  "Torvalds",
  "Dijkstra",
  "Liskov",
  "Thompson",
  "Hamilton",
  "Knuth",
  "Johnson",
]
const ROLES = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA Engineer",
  "Support",
]
const STATUSES: UserRow["status"][] = ["Active", "Inactive", "Pending"]

/** 300 deterministic rows. */
export const USERS: UserRow[] = Array.from({ length: 300 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 3) % LAST.length]
  const id = i + 1
  return {
    id,
    name: `${first} ${last}`,
    email: `${first}.${last}${id}`.toLowerCase() + "@example.com",
    role: ROLES[i % ROLES.length],
    status: STATUSES[i % STATUSES.length],
    mrr: 400 + ((i * 53) % 2200),
  }
})

function matchFilter(row: UserRow, filter: ServerFilter): boolean {
  const raw = row[filter.field as keyof UserRow]
  const text = String(raw).toLowerCase()
  const value = String(filter.value).toLowerCase()
  switch (filter.type) {
    case "contains":
      return text.includes(value)
    case "notContains":
      return !text.includes(value)
    case "equals":
      return text === value
    case "notEqual":
      return text !== value
    case "startsWith":
      return text.startsWith(value)
    case "endsWith":
      return text.endsWith(value)
    case "greaterThan":
      return Number(raw) > Number(filter.value)
    case "greaterThanOrEqual":
      return Number(raw) >= Number(filter.value)
    case "lessThan":
      return Number(raw) < Number(filter.value)
    case "lessThanOrEqual":
      return Number(raw) <= Number(filter.value)
    case "inRange":
      return (
        Number(raw) >= Number(filter.value) &&
        Number(raw) <= Number(filter.valueTo)
      )
    case "set":
      return (
        Array.isArray(filter.value) &&
        filter.value.map(String).includes(String(raw))
      )
    default:
      return true
  }
}

function compareBySorts(a: UserRow, b: UserRow, sorts: ServerSort[]): number {
  for (const sort of sorts) {
    const av = a[sort.field as keyof UserRow]
    const bv = b[sort.field as keyof UserRow]
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))
    if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp
  }
  return 0
}

export interface UsersQuery {
  page: number
  size: number
  sorts: ServerSort[]
  filters: ServerFilter[]
}

/** Apply filters → sort → page, returning the page slice plus the filtered total. */
export function queryUsers(query: UsersQuery): {
  content: UserRow[]
  total: number
} {
  let rows = USERS.filter((row) =>
    query.filters.every((f) => matchFilter(row, f))
  )
  if (query.sorts.length > 0) {
    rows = [...rows].sort((a, b) => compareBySorts(a, b, query.sorts))
  }
  const total = rows.length
  const start = query.page * query.size
  return { content: rows.slice(start, start + query.size), total }
}
