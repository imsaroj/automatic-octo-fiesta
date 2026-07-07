import type * as React from "react"

/**
 * A single calendar event / booking. Generic over an arbitrary `data` payload so
 * the calendar can carry domain objects (meetings, reservations, shifts…) without
 * losing type information in the callbacks.
 *
 * `start`/`end` are plain `Date`s. When `end` is omitted the event is treated as a
 * point in time (a default duration is applied in the time-grid views). When
 * `allDay` is set the times are ignored and the event spans whole day cells.
 */
export interface CalendarEvent<T = unknown> {
  /** Stable, unique identifier across the whole calendar. */
  id: string
  /** Text or node rendered as the event title. */
  title: React.ReactNode
  /** Event start. */
  start: Date
  /** Event end. Defaults to `start + defaultDurationMinutes` when omitted. */
  end?: Date
  /** Render as an all-day / multi-day banner instead of a timed block. */
  allDay?: boolean
  /** One of the preset color tokens. @default "blue" */
  color?: CalendarEventColor
  /** Optional secondary line (location, attendee, room…). */
  location?: React.ReactNode
  /** Prevent selection/drag interaction for this event. */
  disabled?: boolean
  /**
   * Allow drag-to-move and edge-resize for this event. Only takes effect when
   * the calendar is `editable`. @default true (when the calendar is editable)
   */
  editable?: boolean
  /**
   * Repeat rule. When set, the event is a *template*: the calendar expands it
   * into concrete instances across the visible range (the template itself is
   * never rendered directly). Instances carry an id of `"<id>::<ISO-date>"`.
   */
  recurrence?: RecurrenceRule
  /**
   * Present only on an expanded recurrence instance — the template's `id` and
   * the instance's own start date. Absent on plain events.
   */
  occurrence?: { templateId: string; date: Date }
  /** Arbitrary payload returned in callbacks. */
  data?: T
}

/** How often a recurring event repeats. */
export type RecurrenceFreq = "daily" | "weekly" | "monthly"

/**
 * A compact, RRULE-inspired recurrence rule. Intentionally a small subset:
 * daily/weekly/monthly with an interval, optional weekday restriction (weekly),
 * a stop condition (`count` or `until`), and explicit skip dates (`exceptions`).
 */
export interface RecurrenceRule {
  freq: RecurrenceFreq
  /** Repeat every `interval` units (e.g. every 2 weeks). @default 1 */
  interval?: number
  /** For weekly rules: which weekdays repeat. Defaults to the start's weekday. */
  byWeekday?: Weekday[]
  /** Stop after this many occurrences (inclusive of the first). */
  count?: number
  /** Stop on/after this date (inclusive). */
  until?: Date
  /** Dates to skip (compared by calendar day). */
  exceptions?: Date[]
}

/** A weekly availability window used by booking mode. */
export interface AvailabilityWindow {
  /** Which weekday this window applies to. */
  weekday: Weekday
  /** Window open, minutes since midnight. */
  startMinutes: number
  /** Window close, minutes since midnight. */
  endMinutes: number
}

/** A single bookable slot produced from availability minus existing events. */
export interface FreeSlot {
  start: Date
  end: Date
  /** Remaining capacity for the slot (>= 1). */
  capacity: number
}

/** Detail handed to `onEventChange` after a drag-move or resize. */
export interface EventChangeMeta<T = unknown> {
  event: CalendarEvent<T>
  start: Date
  end: Date
  /** What the gesture changed. */
  kind: "move" | "resize"
}

/**
 * Preset color tokens. Each maps to a themed set of Tailwind classes in
 * `event-color.ts`; callers pick a name rather than raw classes so events read
 * consistently in light and dark mode.
 */
export type CalendarEventColor =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "pink"
  | "cyan"
  | "gray"

/** The available calendar views. */
export type CalendarView = "month" | "week" | "day" | "agenda"

/** Row/text density. */
export type CalendarSize = "sm" | "md" | "lg"

/** 0 = Sunday … 6 = Saturday (matches `date-fns` `weekStartsOn`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * A contiguous time window inside a day, expressed as minutes since midnight.
 * Used for business-hours shading and slot selection.
 */
export interface TimeRange {
  /** Minutes since midnight, inclusive. */
  startMinutes: number
  /** Minutes since midnight, exclusive. */
  endMinutes: number
}

/** Detail handed to `onSlotSelect` when an empty time slot is chosen. */
export interface CalendarSlot {
  start: Date
  end: Date
  /** True when the slot came from an all-day / month cell. */
  allDay: boolean
}

/** Imperative handle exposed via `ref`. */
export interface SmartCalendarHandle {
  /** Advance one page in the current view (month/week/day). */
  next: () => void
  /** Go back one page in the current view. */
  prev: () => void
  /** Jump to today, keeping the current view. */
  today: () => void
  /** Navigate to an arbitrary date, keeping the current view. */
  goToDate: (date: Date) => void
  /** Switch the active view. */
  setView: (view: CalendarView) => void
  getDate: () => Date
  getView: () => CalendarView
}
