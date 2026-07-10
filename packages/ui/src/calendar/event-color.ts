import type { CalendarEventColor } from "./types"

/**
 * Themed class sets for each preset color token. Kept out of the components so
 * both the month "pill" and the time-grid "block" share one source of truth and
 * stay legible in light and dark mode.
 *
 * - `block` — filled block used in week/day/agenda (solid-ish background).
 * - `pill` — compact month-cell chip (softer background + colored dot).
 * - `dot` — the leading indicator dot in the month/agenda rows.
 */
export interface EventColorClasses {
  block: string
  pill: string
  dot: string
}

const COLORS: Record<CalendarEventColor, EventColorClasses> = {
  blue: {
    block:
      "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-200 dark:bg-blue-500/25",
    pill: "hover:bg-blue-500/10 text-blue-700 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  green: {
    block:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-200 dark:bg-emerald-500/25",
    pill: "hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  amber: {
    block:
      "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-200 dark:bg-amber-500/25",
    pill: "hover:bg-amber-500/10 text-amber-700 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    block:
      "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-200 dark:bg-red-500/25",
    pill: "hover:bg-red-500/10 text-red-700 dark:text-red-200",
    dot: "bg-red-500",
  },
  violet: {
    block:
      "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-200 dark:bg-violet-500/25",
    pill: "hover:bg-violet-500/10 text-violet-700 dark:text-violet-200",
    dot: "bg-violet-500",
  },
  pink: {
    block:
      "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-200 dark:bg-pink-500/25",
    pill: "hover:bg-pink-500/10 text-pink-700 dark:text-pink-200",
    dot: "bg-pink-500",
  },
  cyan: {
    block:
      "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-200 dark:bg-cyan-500/25",
    pill: "hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
    dot: "bg-cyan-500",
  },
  gray: {
    block: "bg-muted text-foreground border-border dark:bg-muted/60",
    pill: "hover:bg-muted text-foreground",
    dot: "bg-muted-foreground",
  },
}

const FALLBACK: CalendarEventColor = "blue"

/** Resolve the class set for a color token, defaulting to blue. */
export function eventColorClasses(
  color: CalendarEventColor | undefined
): EventColorClasses {
  return COLORS[color ?? FALLBACK] ?? COLORS[FALLBACK]
}

/** All available color tokens, in a stable presentation order. */
export const EVENT_COLORS: CalendarEventColor[] = [
  "blue",
  "green",
  "amber",
  "red",
  "violet",
  "pink",
  "cyan",
  "gray",
]
