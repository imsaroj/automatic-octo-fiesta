import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import type { CalendarEvent, CalendarView, Weekday } from "./types"

// ── Ranges ───────────────────────────────────────────────────────────────────

/** Inclusive `[start, end]` day range covered by a view anchored at `date`. */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * The 6×7 grid of days shown in the month view: the weeks spanning the month,
 * padded to complete weeks so leading/trailing days of adjacent months fill the
 * grid. Always 6 rows so the grid height doesn't jump between months.
 */
export function buildMonthGrid(date: Date, weekStartsOn: Weekday): Date[][] {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn })
  const weeks: Date[][] = []
  let cursor = gridStart
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** The 7 days of the week containing `date`. */
export function buildWeekDays(date: Date, weekStartsOn: Weekday): Date[] {
  const start = startOfWeek(date, { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** The visible day range for a view (used to filter events cheaply). */
export function viewRange(
  date: Date,
  view: CalendarView,
  weekStartsOn: Weekday
): DateRange {
  switch (view) {
    case "month": {
      const grid = buildMonthGrid(date, weekStartsOn)
      return { start: grid[0]![0]!, end: endOfDay(grid[5]![6]!) }
    }
    case "week": {
      const days = buildWeekDays(date, weekStartsOn)
      return { start: startOfDay(days[0]!), end: endOfDay(days[6]!) }
    }
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) }
    case "agenda":
      return { start: startOfDay(date), end: endOfDay(addDays(date, 30)) }
  }
}

/** Advance/rewind the anchor date by one page of `view`. `dir` is +1 or -1. */
export function stepDate(date: Date, view: CalendarView, dir: 1 | -1): Date {
  switch (view) {
    case "month":
      return addMonths(date, dir)
    case "week":
      return addWeeks(date, dir)
    case "day":
      return addDays(date, dir)
    case "agenda":
      return addDays(date, dir * 30)
  }
}

// ── Event helpers ────────────────────────────────────────────────────────────

/** Resolved end for an event, applying a default duration when `end` is absent. */
export function eventEnd(
  event: CalendarEvent,
  defaultDurationMinutes = 60
): Date {
  if (event.end && event.end > event.start) return event.end
  return addMinutes(event.start, defaultDurationMinutes)
}

/** Whether an event covers more than one calendar day. */
export function isMultiDay(event: CalendarEvent): boolean {
  if (event.allDay)
    return differenceInCalendarDays(eventEnd(event, 0), event.start) >= 1
  return !isSameDay(event.start, eventEnd(event))
}

/** Chronological sort: earlier start first, longer event first on ties. */
export function sortEvents<T>(events: CalendarEvent<T>[]): CalendarEvent<T>[] {
  return [...events].sort((a, b) => {
    const s = a.start.getTime() - b.start.getTime()
    if (s !== 0) return s
    return eventEnd(b).getTime() - eventEnd(a).getTime()
  })
}

/**
 * Events that intersect a given day, in sorted order. Handles multi-day and
 * all-day events (they appear on every day they span).
 */
export function eventsForDay<T>(
  events: CalendarEvent<T>[],
  day: Date
): CalendarEvent<T>[] {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return sortEvents(
    events.filter((e) => {
      const start = e.start
      const end = eventEnd(e)
      // Overlap test: event starts before day ends AND ends after day starts.
      return start <= dayEnd && end >= dayStart
    })
  )
}

/** Split events for a day into all-day/multi-day banners vs timed blocks. */
export function partitionDayEvents<T>(events: CalendarEvent<T>[]): {
  allDay: CalendarEvent<T>[]
  timed: CalendarEvent<T>[]
} {
  const allDay: CalendarEvent<T>[] = []
  const timed: CalendarEvent<T>[] = []
  for (const e of events) {
    if (e.allDay || isMultiDay(e)) allDay.push(e)
    else timed.push(e)
  }
  return { allDay, timed }
}

// ── Time-grid geometry ───────────────────────────────────────────────────────

/** Minutes since midnight for a date. */
export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * A timed event positioned within a day column. `top`/`height` are percentages
 * of the visible `[minHour, maxHour)` window; `left`/`width` are percentages of
 * the column, computed by packing overlapping events into side-by-side lanes.
 */
export interface PositionedEvent<T = unknown> {
  event: CalendarEvent<T>
  top: number
  height: number
  left: number
  width: number
  /** Lane index within its overlap cluster (for stable keys / z-order). */
  lane: number
  lanes: number
}

/**
 * Lay out a day's timed events into non-overlapping lanes and convert their
 * times into top/height/left/width percentages for the given hour window.
 *
 * Overlapping events (by clock time) are grouped into a cluster and split into
 * as many lanes as the max concurrency of that cluster, so simultaneous events
 * sit side by side and never visually collide.
 */
export function layoutDayEvents<T>(
  events: CalendarEvent<T>[],
  day: Date,
  minHour: number,
  maxHour: number,
  defaultDurationMinutes = 60
): PositionedEvent<T>[] {
  const dayStart = startOfDay(day)
  const windowStart = minHour * 60
  const windowEnd = maxHour * 60
  const windowSpan = Math.max(1, windowEnd - windowStart)

  // Normalize each event to clamped [start, end] minutes within the window.
  type Span = {
    event: CalendarEvent<T>
    startMin: number
    endMin: number
  }
  const spans: Span[] = sortEvents(events).map((event) => {
    const rawStart = differenceInMinutes(event.start, dayStart)
    const rawEnd = differenceInMinutes(
      eventEnd(event, defaultDurationMinutes),
      dayStart
    )
    const startMin = Math.max(windowStart, Math.min(rawStart, windowEnd))
    // Keep a minimum visible height of 15 minutes.
    const endMin = Math.max(startMin + 15, Math.min(rawEnd, windowEnd))
    return { event, startMin, endMin }
  })

  // Group into clusters of transitively-overlapping spans.
  const positioned: PositionedEvent<T>[] = []
  let cluster: Span[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    // Greedy lane assignment within the cluster.
    const laneEnds: number[] = []
    const laneOf = new Map<Span, number>()
    for (const span of cluster) {
      let lane = laneEnds.findIndex((end) => end <= span.startMin)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(span.endMin)
      } else {
        laneEnds[lane] = span.endMin
      }
      laneOf.set(span, lane)
    }
    const lanes = laneEnds.length
    for (const span of cluster) {
      const lane = laneOf.get(span)!
      positioned.push({
        event: span.event,
        top: ((span.startMin - windowStart) / windowSpan) * 100,
        height: ((span.endMin - span.startMin) / windowSpan) * 100,
        left: (lane / lanes) * 100,
        width: (1 / lanes) * 100,
        lane,
        lanes,
      })
    }
    cluster = []
    clusterEnd = -Infinity
  }

  for (const span of spans) {
    if (cluster.length > 0 && span.startMin >= clusterEnd) flush()
    cluster.push(span)
    clusterEnd = Math.max(clusterEnd, span.endMin)
  }
  flush()

  return positioned
}

/** The hour labels (integers) for a `[minHour, maxHour]` window. */
export function hourLabels(minHour: number, maxHour: number): number[] {
  const out: number[] = []
  for (let h = minHour; h <= maxHour; h++) out.push(h)
  return out
}

// ── Formatting ───────────────────────────────────────────────────────────────

/** Title-bar label for the current view, e.g. "July 2026" or "Jul 7 – 13, 2026". */
export function viewTitle(
  date: Date,
  view: CalendarView,
  weekStartsOn: Weekday
): string {
  switch (view) {
    case "month":
      return format(date, "MMMM yyyy")
    case "day":
      return format(date, "EEEE, MMMM d, yyyy")
    case "agenda":
      return `${format(date, "MMM d")} – ${format(addDays(date, 30), "MMM d, yyyy")}`
    case "week": {
      const days = buildWeekDays(date, weekStartsOn)
      const a = days[0]!
      const b = days[6]!
      if (isSameMonth(a, b))
        return `${format(a, "MMM d")} – ${format(b, "d, yyyy")}`
      return `${format(a, "MMM d")} – ${format(b, "MMM d, yyyy")}`
    }
  }
}

/** Compact time range label, e.g. "9:00 – 10:30 AM". */
export function formatEventTime(
  event: CalendarEvent,
  defaultDurationMinutes = 60
): string {
  if (event.allDay) return "All day"
  const end = eventEnd(event, defaultDurationMinutes)
  return `${format(event.start, "h:mm a")} – ${format(end, "h:mm a")}`
}

/** Group events by day (YYYY-MM-DD key), sorted, for the agenda view. */
export function groupEventsByDay<T>(
  events: CalendarEvent<T>[],
  range: DateRange
): { day: Date; events: CalendarEvent<T>[] }[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end })
  return days
    .map((day) => ({ day, events: eventsForDay(events, day) }))
    .filter((g) => g.events.length > 0)
}

/** Whether a date falls inside an inclusive range. */
export function isInRange(date: Date, range: DateRange): boolean {
  return isWithinInterval(date, { start: range.start, end: range.end })
}
