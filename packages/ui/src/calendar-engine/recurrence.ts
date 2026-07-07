import { addDays, addMonths, isSameDay, startOfDay } from "date-fns"
import type { CalendarEvent, Weekday } from "./types"
import type { DateRange } from "./calendar-utils"

/** Copy the clock time (h/m/s/ms) of `source` onto the calendar day of `day`. */
function withTimeOf(day: Date, source: Date): Date {
  const d = new Date(day)
  d.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  )
  return d
}

/** Duration of an event in ms, using an explicit end or a default duration. */
function durationMs(
  event: CalendarEvent,
  defaultDurationMinutes: number
): number {
  if (event.end && event.end > event.start)
    return event.end.getTime() - event.start.getTime()
  return defaultDurationMinutes * 60_000
}

/**
 * Expand a single recurring template into concrete instances that intersect
 * `range`. Non-recurring events are handled by `expandEvents`; this assumes
 * `event.recurrence` is set.
 *
 * The walk is bounded three ways so it always terminates: the rule's `count`,
 * its `until`, and a hard safety cap. Occurrences are generated from the
 * template start forward; only those overlapping the range are emitted.
 */
export function expandRecurring<T>(
  event: CalendarEvent<T>,
  range: DateRange,
  defaultDurationMinutes = 60
): CalendarEvent<T>[] {
  const rule = event.recurrence
  if (!rule) return [event]

  const interval = Math.max(1, rule.interval ?? 1)
  const dur = durationMs(event, defaultDurationMinutes)
  const exceptions = rule.exceptions ?? []
  const isException = (d: Date) => exceptions.some((ex) => isSameDay(ex, d))

  const byWeekday: Weekday[] =
    rule.freq === "weekly" && rule.byWeekday && rule.byWeekday.length > 0
      ? [...rule.byWeekday].sort((a, b) => a - b)
      : [event.start.getDay() as Weekday]

  const out: CalendarEvent<T>[] = []
  let emitted = 0
  const cap = 1000 // hard safety bound on iterations

  const pushIf = (day: Date) => {
    const start = withTimeOf(day, event.start)
    const end = new Date(start.getTime() + dur)
    // Stop conditions evaluated per-occurrence.
    if (rule.until && startOfDay(start) > startOfDay(rule.until)) return
    // Count is by generated occurrence, regardless of range visibility.
    if (rule.count != null && emitted >= rule.count) return
    // An excepted date still consumes a count (RFC 5545 EXDATE semantics) but
    // is not emitted.
    emitted++
    if (isException(day)) return
    // Only keep occurrences that overlap the requested range.
    if (start <= range.end && end >= range.start) {
      out.push({
        ...event,
        id: `${event.id}::${start.toISOString().slice(0, 10)}`,
        start,
        end,
        recurrence: undefined,
        occurrence: { templateId: event.id, date: start },
      })
    }
  }

  const reachedLimit = () =>
    (rule.count != null && emitted >= rule.count) || out.length > cap

  if (rule.freq === "weekly") {
    // Walk week by week from the week of the start; within each active week,
    // emit the configured weekdays in order.
    let weekAnchor = startOfDay(event.start)
    // Back up to the template's weekday-0 reference for stable stepping.
    let iterations = 0
    while (iterations < cap && !reachedLimit()) {
      for (const wd of byWeekday) {
        const delta = (wd - weekAnchor.getDay() + 7) % 7
        const day = addDays(weekAnchor, delta)
        if (day < startOfDay(event.start)) continue // don't emit before start
        if (rule.until && startOfDay(day) > startOfDay(rule.until)) {
          return out
        }
        pushIf(day)
        if (reachedLimit()) break
      }
      weekAnchor = addDays(weekAnchor, 7 * interval)
      if (rule.until && startOfDay(weekAnchor) > startOfDay(rule.until)) break
      if (weekAnchor > range.end && emitted > 0) break
      iterations++
    }
    return out
  }

  // daily / monthly: single cursor stepped by interval.
  let cursor = startOfDay(event.start)
  let iterations = 0
  while (iterations < cap && !reachedLimit()) {
    if (rule.until && startOfDay(cursor) > startOfDay(rule.until)) break
    pushIf(cursor)
    if (cursor > range.end && emitted > 0) break
    cursor =
      rule.freq === "daily"
        ? addDays(cursor, interval)
        : addMonths(cursor, interval)
    iterations++
  }
  return out
}

/**
 * Expand every event against a range: recurring templates become instances,
 * plain events pass through when they overlap the range. The single entry point
 * the calendar uses before rendering a view.
 */
export function expandEvents<T>(
  events: CalendarEvent<T>[],
  range: DateRange,
  defaultDurationMinutes = 60
): CalendarEvent<T>[] {
  const out: CalendarEvent<T>[] = []
  for (const event of events) {
    if (event.recurrence) {
      out.push(...expandRecurring(event, range, defaultDurationMinutes))
    } else {
      const end =
        event.end && event.end > event.start
          ? event.end
          : new Date(event.start.getTime() + defaultDurationMinutes * 60_000)
      if (event.start <= range.end && end >= range.start) out.push(event)
    }
  }
  return out
}

// ── Series editing ───────────────────────────────────────────────────────────
//
// Editing one occurrence of a recurring template raises the classic three-way
// choice: change *this event only*, *this and all following*, or *the whole
// series*. These pure helpers implement each branch by transforming the
// template(s); the UI decides which to call and supplies the concrete change.

/** A patch applied to an event when editing (times and/or presentational fields). */
export type EventPatch<T = unknown> = Partial<
  Pick<
    CalendarEvent<T>,
    "start" | "end" | "title" | "color" | "location" | "allDay" | "data"
  >
>

/** Apply a patch, dropping recurrence/occurrence markers to make a plain event. */
function asPlainEvent<T>(
  event: CalendarEvent<T>,
  patch: EventPatch<T>,
  id: string
): CalendarEvent<T> {
  return {
    ...event,
    ...patch,
    id,
    recurrence: undefined,
    occurrence: undefined,
  }
}

/**
 * **This event only.** Carve `occurrenceDate` out of the series (adding it to
 * `exceptions`) and return that exception-bearing template alongside a new
 * standalone event carrying the change. The series keeps repeating; this one
 * date becomes an independent event.
 */
export function detachOccurrence<T>(
  template: CalendarEvent<T>,
  occurrenceDate: Date,
  patch: EventPatch<T>,
  newId = `${template.id}::detached::${occurrenceDate.toISOString().slice(0, 10)}`
): { template: CalendarEvent<T>; event: CalendarEvent<T> } {
  const rule = template.recurrence
  const exceptions = [...(rule?.exceptions ?? []), startOfDay(occurrenceDate)]
  return {
    template: rule
      ? { ...template, recurrence: { ...rule, exceptions } }
      : template,
    event: asPlainEvent(template, patch, newId),
  }
}

/**
 * **This and following.** End the existing series the day before `fromDate`
 * (via `until`) and return a *new* template that starts at `fromDate` with the
 * change applied — carrying the same recurrence pattern forward. Splits one
 * series into two. Any original `count` is converted to an `until` boundary.
 */
export function splitSeries<T>(
  template: CalendarEvent<T>,
  fromDate: Date,
  patch: EventPatch<T>,
  newId = `${template.id}::from::${fromDate.toISOString().slice(0, 10)}`
): { previous: CalendarEvent<T>; following: CalendarEvent<T> } {
  const rule = template.recurrence
  const previous: CalendarEvent<T> = rule
    ? {
        ...template,
        recurrence: {
          ...rule,
          count: undefined,
          until: addDays(startOfDay(fromDate), -1),
        },
      }
    : template

  const start = patch.start ?? withTimeOf(fromDate, template.start)
  const end =
    patch.end ??
    new Date(
      start.getTime() +
        (template.end && template.end > template.start
          ? template.end.getTime() - template.start.getTime()
          : 60 * 60_000)
    )

  const following: CalendarEvent<T> = {
    ...template,
    ...patch,
    id: newId,
    start,
    end,
    occurrence: undefined,
    recurrence: rule
      ? { ...rule, count: undefined, until: rule.until }
      : undefined,
  }
  return { previous, following }
}

/**
 * **The whole series.** Merge a patch into the template itself. When the patch
 * moves `start`, the whole series shifts by the same delta (so every occurrence
 * keeps its relative offset); presentational fields are applied as-is.
 */
export function updateSeries<T>(
  template: CalendarEvent<T>,
  patch: EventPatch<T>
): CalendarEvent<T> {
  const next: CalendarEvent<T> = { ...template, ...patch }
  if (patch.start && !patch.end) {
    // Preserve duration when only the start moved.
    const dur =
      template.end && template.end > template.start
        ? template.end.getTime() - template.start.getTime()
        : 60 * 60_000
    next.end = new Date(patch.start.getTime() + dur)
  }
  return next
}
