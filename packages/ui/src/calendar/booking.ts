import { addMinutes, startOfDay } from "date-fns"
import type {
  AvailabilityWindow,
  CalendarEvent,
  FreeSlot,
  Weekday,
} from "./types"
import { eventEnd } from "./calendar-utils"

/** Availability windows that apply to a given weekday. */
export function windowsForDay(
  windows: AvailabilityWindow[],
  day: Date
): AvailabilityWindow[] {
  const wd = day.getDay() as Weekday
  return windows.filter((w) => w.weekday === wd)
}

/**
 * Generate the bookable slots for a single day: walk each availability window in
 * `slotMinutes` steps, and keep a slot only if its remaining capacity (after
 * subtracting overlapping events) is at least 1. Past slots are dropped when
 * `now` is supplied.
 *
 * Pure and range-free — the calendar calls it per visible day.
 */
export function generateFreeSlots<T>(
  day: Date,
  windows: AvailabilityWindow[],
  events: CalendarEvent<T>[],
  slotMinutes: number,
  slotCapacity = 1,
  now?: Date
): FreeSlot[] {
  const base = startOfDay(day)
  const dayWindows = windowsForDay(windows, day)
  if (dayWindows.length === 0) return []

  const slots: FreeSlot[] = []
  for (const win of dayWindows) {
    for (
      let m = win.startMinutes;
      m + slotMinutes <= win.endMinutes;
      m += slotMinutes
    ) {
      const start = addMinutes(base, m)
      const end = addMinutes(start, slotMinutes)
      if (now && start < now) continue

      // Count events that overlap this slot (any intersection).
      let taken = 0
      for (const e of events) {
        if (e.allDay) continue
        const es = e.start
        const ee = eventEnd(e)
        if (es < end && ee > start) taken++
      }
      const capacity = slotCapacity - taken
      if (capacity >= 1) slots.push({ start, end, capacity })
    }
  }
  return slots
}
