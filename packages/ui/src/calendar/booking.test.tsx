import { describe, expect, it } from "vitest"
import type { AvailabilityWindow, CalendarEvent } from "@/calendar/types"
import { generateFreeSlots, windowsForDay } from "@/calendar/booking"

const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min)

// 2026-07-06 is a Monday.
const monday = at(2026, 7, 6)

const nineToTwelve: AvailabilityWindow[] = [
  { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60 },
]

describe("windowsForDay", () => {
  it("returns only windows matching the day's weekday", () => {
    const windows: AvailabilityWindow[] = [
      { weekday: 1, startMinutes: 540, endMinutes: 720 },
      { weekday: 2, startMinutes: 540, endMinutes: 720 },
    ]
    expect(windowsForDay(windows, monday)).toHaveLength(1)
    expect(windowsForDay(windows, at(2026, 7, 7))).toHaveLength(1) // Tue
    expect(windowsForDay(windows, at(2026, 7, 8))).toHaveLength(0) // Wed
  })
})

describe("generateFreeSlots", () => {
  it("splits a window into slotMinutes-sized slots", () => {
    const slots = generateFreeSlots(monday, nineToTwelve, [], 60)
    expect(slots).toHaveLength(3) // 9, 10, 11
    expect(slots[0]!.start).toEqual(at(2026, 7, 6, 9))
    expect(slots[2]!.start).toEqual(at(2026, 7, 6, 11))
    expect(slots.every((s) => s.capacity === 1)).toBe(true)
  })

  it("does not emit a partial trailing slot", () => {
    const windows: AvailabilityWindow[] = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 9 * 60 + 90 },
    ]
    const slots = generateFreeSlots(monday, windows, [], 60)
    // Only the 9:00–10:00 slot fits; 10:00–11:00 would exceed the window.
    expect(slots).toHaveLength(1)
  })

  it("removes slots taken by an overlapping event (capacity 1)", () => {
    const events: CalendarEvent[] = [
      {
        id: "b",
        title: "Booked",
        start: at(2026, 7, 6, 10),
        end: at(2026, 7, 6, 11),
      },
    ]
    const slots = generateFreeSlots(monday, nineToTwelve, events, 60)
    expect(slots.map((s) => s.start.getHours())).toEqual([9, 11])
  })

  it("keeps a slot with remaining capacity when capacity > 1", () => {
    const events: CalendarEvent[] = [
      {
        id: "b",
        title: "Booked",
        start: at(2026, 7, 6, 10),
        end: at(2026, 7, 6, 11),
      },
    ]
    const slots = generateFreeSlots(monday, nineToTwelve, events, 60, 2)
    const ten = slots.find((s) => s.start.getHours() === 10)
    expect(ten).toBeDefined()
    expect(ten!.capacity).toBe(1) // 2 capacity − 1 booking
  })

  it("ignores all-day events when computing capacity", () => {
    const events: CalendarEvent[] = [
      { id: "a", title: "Holiday", start: monday, allDay: true },
    ]
    const slots = generateFreeSlots(monday, nineToTwelve, events, 60)
    expect(slots).toHaveLength(3)
  })

  it("drops past slots when `now` is provided", () => {
    const now = at(2026, 7, 6, 10, 30)
    const slots = generateFreeSlots(monday, nineToTwelve, [], 60, 1, now)
    // 9:00 is in the past; 10:00 started before now; only 11:00 remains.
    expect(slots.map((s) => s.start.getHours())).toEqual([11])
  })

  it("returns nothing on a day with no matching window", () => {
    expect(generateFreeSlots(at(2026, 7, 8), nineToTwelve, [], 60)).toEqual([])
  })
})
