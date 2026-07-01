/**
 * Small, dependency-free formatting helpers shared across data-display and
 * dashboard components. Pure functions — straightforward to unit test.
 */

/** Format a number with locale-aware grouping (e.g. `1234567` → `"1,234,567"`). */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(undefined, options).format(value)
}

/** Format a number as currency (defaults to USD). */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale?: string
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Compact notation for large numbers (e.g. `12500` → `"12.5K"`). */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

/** Format a 0–1 ratio (or arbitrary number) as a percentage string. */
export function formatPercent(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Truncate a string to `maxLength`, appending an ellipsis when shortened. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

/** Build initials from a name (e.g. `"Ada Lovelace"` → `"AL"`). */
export function getInitials(name: string, maxChars = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return ""

  return parts
    .slice(0, maxChars)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
