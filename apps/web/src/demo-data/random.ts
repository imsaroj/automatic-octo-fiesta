/**
 * Deterministic pseudo-random helpers for demo data.
 *
 * Demo pages must render the same numbers on every reload (stable screenshots,
 * predictable E2E assertions), so all "random" demo data flows through a seeded
 * generator rather than `Math.random()`.
 */

/** Mulberry32 — a tiny, fast, seedable PRNG returning floats in `[0, 1)`. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface SeriesOptions {
  /** Number of points to generate. */
  length: number
  /** Seed for reproducibility. @default 1 */
  seed?: number
  /** Lower bound of generated values. @default 20 */
  min?: number
  /** Upper bound of generated values. @default 100 */
  max?: number
  /**
   * Upward drift applied across the series, as a fraction of the range
   * (`0` = flat noise, `1` = strong rising trend). @default 0
   */
  trend?: number
}

/**
 * Generate a deterministic numeric series for sparklines, bar charts, and other
 * demo visualisations. Values stay within `[min, max]`; a positive `trend`
 * biases later points upward.
 */
export function series({
  length,
  seed = 1,
  min = 20,
  max = 100,
  trend = 0,
}: SeriesOptions): number[] {
  const rand = mulberry32(seed)
  const range = max - min
  return Array.from({ length }, (_, i) => {
    const drift = length > 1 ? (i / (length - 1)) * trend * range : 0
    const value = min + rand() * range * (1 - trend) + drift
    return Math.round(Math.min(max, Math.max(min, value)))
  })
}
