/**
 * Query building for the search engine: collapse a raw form-state object (which
 * carries a value for *every* field, most of them blank) down to only the
 * meaningful filters, so the object handed to the API is clean.
 *
 *   { name: "", email: "a@b.com", role: null, status: [] }  →  { email: "a@b.com" }
 */

/**
 * Whether a value carries no filter intent and should be dropped from the query.
 *
 * - `null` / `undefined` → empty
 * - empty or whitespace-only string → empty
 * - empty array → empty
 * - `false` boolean → empty (a checkbox/switch filters only when *on*; an
 *   explicit "no" filter should model its two states as a string/enum instead)
 * - `Date` → never empty
 * - object (e.g. a date range) → empty only when every own value is empty
 * - numbers (incl. `0`) → never empty
 */
export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "boolean") return !value
  if (value instanceof Date) return false
  if (typeof value === "object")
    return Object.values(value as Record<string, unknown>).every(isEmptyValue)
  return false
}

/**
 * Prune a raw search-state object to only its meaningful values, trimming
 * strings along the way. The result is a `Partial<T>` suitable for sending to an
 * API or serializing into a URL — empty fields simply aren't present.
 */
export function buildSearchQuery<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (isEmptyValue(value)) continue
    out[key] = typeof value === "string" ? value.trim() : value
  }
  return out as Partial<T>
}

/** Number of active (non-empty) filters in a raw search-state object. */
export function countActiveFilters(data: Record<string, unknown>): number {
  return Object.keys(buildSearchQuery(data)).length
}
