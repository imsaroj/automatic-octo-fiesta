import { describe, expect, it } from "vitest"
import type { CalendarEvent } from "@/calendar/types"
import type { DateRange } from "@/calendar/calendar-utils"
import {
  detachOccurrence,
  expandEvents,
  expandRecurring,
  splitSeries,
  updateSeries,
} from "@/calendar/recurrence"

const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min)

const range = (start: Date, end: Date): DateRange => ({ start, end })

describe("expandRecurring — daily", () => {
  it("generates one instance per day within the range", () => {
    const e: CalendarEvent = {
      id: "daily",
      title: "Standup",
      start: at(2026, 7, 6, 9),
      end: at(2026, 7, 6, 9, 30),
      recurrence: { freq: "daily" },
    }
    const out = expandRecurring(
      e,
      range(at(2026, 7, 6), at(2026, 7, 10, 23, 59))
    )
    expect(out).toHaveLength(5)
    expect(out[0]!.start).toEqual(at(2026, 7, 6, 9))
    expect(out[4]!.start).toEqual(at(2026, 7, 10, 9))
    // Times/duration preserved.
    expect(out[0]!.end).toEqual(at(2026, 7, 6, 9, 30))
    // Instances are concrete (no recurrence) and carry occurrence metadata.
    expect(out[0]!.recurrence).toBeUndefined()
    expect(out[0]!.occurrence?.templateId).toBe("daily")
    expect(out[0]!.id).toBe("daily::2026-07-06")
  })

  it("respects an interval", () => {
    const e: CalendarEvent = {
      id: "d2",
      title: "x",
      start: at(2026, 7, 6, 9),
      recurrence: { freq: "daily", interval: 2 },
    }
    const out = expandRecurring(
      e,
      range(at(2026, 7, 6), at(2026, 7, 12, 23, 59))
    )
    expect(out.map((o) => o.start.getDate())).toEqual([6, 8, 10, 12])
  })

  it("stops after `count` occurrences", () => {
    const e: CalendarEvent = {
      id: "d3",
      title: "x",
      start: at(2026, 7, 6, 9),
      recurrence: { freq: "daily", count: 3 },
    }
    const out = expandRecurring(e, range(at(2026, 7, 6), at(2026, 7, 30)))
    expect(out).toHaveLength(3)
  })

  it("stops on `until`", () => {
    const e: CalendarEvent = {
      id: "d4",
      title: "x",
      start: at(2026, 7, 6, 9),
      recurrence: { freq: "daily", until: at(2026, 7, 8) },
    }
    const out = expandRecurring(e, range(at(2026, 7, 6), at(2026, 7, 30)))
    expect(out.map((o) => o.start.getDate())).toEqual([6, 7, 8])
  })

  it("skips exception dates", () => {
    const e: CalendarEvent = {
      id: "d5",
      title: "x",
      start: at(2026, 7, 6, 9),
      recurrence: { freq: "daily", count: 4, exceptions: [at(2026, 7, 7)] },
    }
    const out = expandRecurring(e, range(at(2026, 7, 6), at(2026, 7, 30)))
    // Exception is still counted toward `count`, but not emitted.
    expect(out.map((o) => o.start.getDate())).toEqual([6, 8, 9])
  })
})

describe("expandRecurring — weekly", () => {
  it("repeats on the start weekday by default", () => {
    const e: CalendarEvent = {
      id: "w1",
      title: "x",
      start: at(2026, 7, 6, 9), // Monday
      recurrence: { freq: "weekly" },
    }
    const out = expandRecurring(
      e,
      range(at(2026, 7, 6), at(2026, 7, 27, 23, 59))
    )
    expect(out.map((o) => o.start.getDate())).toEqual([6, 13, 20, 27])
    expect(out.every((o) => o.start.getDay() === 1)).toBe(true)
  })

  it("supports multiple weekdays via byWeekday", () => {
    const e: CalendarEvent = {
      id: "w2",
      title: "x",
      start: at(2026, 7, 6, 9), // Monday
      // Mondays (1) and Wednesdays (3)
      recurrence: { freq: "weekly", byWeekday: [1, 3] },
    }
    const out = expandRecurring(
      e,
      range(at(2026, 7, 6), at(2026, 7, 15, 23, 59))
    )
    // Mon 6, Wed 8, Mon 13, Wed 15
    expect(out.map((o) => o.start.getDate())).toEqual([6, 8, 13, 15])
  })
})

describe("expandRecurring — monthly", () => {
  it("repeats on the same day-of-month", () => {
    const e: CalendarEvent = {
      id: "m1",
      title: "x",
      start: at(2026, 1, 15, 9),
      recurrence: { freq: "monthly", count: 3 },
    }
    const out = expandRecurring(e, range(at(2026, 1, 1), at(2026, 12, 31)))
    expect(
      out.map((o) => `${o.start.getMonth() + 1}/${o.start.getDate()}`)
    ).toEqual(["1/15", "2/15", "3/15"])
  })
})

describe("expandEvents", () => {
  it("passes plain events through and expands recurring ones", () => {
    const events: CalendarEvent[] = [
      {
        id: "plain",
        title: "p",
        start: at(2026, 7, 7, 9),
        end: at(2026, 7, 7, 10),
      },
      {
        id: "rec",
        title: "r",
        start: at(2026, 7, 6, 9),
        recurrence: { freq: "daily", count: 2 },
      },
    ]
    const out = expandEvents(
      events,
      range(at(2026, 7, 6), at(2026, 7, 8, 23, 59))
    )
    const ids = out.map((o) => o.id)
    expect(ids).toContain("plain")
    expect(ids).toContain("rec::2026-07-06")
    expect(ids).toContain("rec::2026-07-07")
  })

  it("drops plain events outside the range", () => {
    const events: CalendarEvent[] = [
      {
        id: "old",
        title: "o",
        start: at(2026, 1, 1, 9),
        end: at(2026, 1, 1, 10),
      },
    ]
    const out = expandEvents(events, range(at(2026, 7, 1), at(2026, 7, 31)))
    expect(out).toHaveLength(0)
  })
})

const series = (): CalendarEvent => ({
  id: "series",
  title: "Standup",
  start: at(2026, 7, 6, 9),
  end: at(2026, 7, 6, 9, 30),
  recurrence: { freq: "daily" },
})

describe("detachOccurrence (this event only)", () => {
  it("adds the date to exceptions and returns a standalone event", () => {
    const { template, event } = detachOccurrence(series(), at(2026, 7, 8), {
      start: at(2026, 7, 8, 11),
      end: at(2026, 7, 8, 11, 30),
    })
    // Template still recurs but skips the 8th.
    expect(template.recurrence?.exceptions?.[0]).toEqual(at(2026, 7, 8))
    // Standalone event is concrete and moved.
    expect(event.recurrence).toBeUndefined()
    expect(event.occurrence).toBeUndefined()
    expect(event.start).toEqual(at(2026, 7, 8, 11))
  })

  it("expansion no longer emits the detached date", () => {
    const { template } = detachOccurrence(series(), at(2026, 7, 8), {})
    const out = expandRecurring(
      template,
      range(at(2026, 7, 6), at(2026, 7, 10, 23, 59))
    )
    expect(out.map((o) => o.start.getDate())).toEqual([6, 7, 9, 10])
  })
})

describe("splitSeries (this and following)", () => {
  it("ends the previous series and starts a new one at fromDate", () => {
    const { previous, following } = splitSeries(series(), at(2026, 7, 9), {
      start: at(2026, 7, 9, 10),
      end: at(2026, 7, 9, 10, 30),
    })
    // Previous stops before the 9th.
    const prevOut = expandRecurring(
      previous,
      range(at(2026, 7, 6), at(2026, 7, 20))
    )
    expect(prevOut.map((o) => o.start.getDate())).toEqual([6, 7, 8])
    // Following starts on the 9th at the new time and keeps recurring.
    const followOut = expandRecurring(
      following,
      range(at(2026, 7, 6), at(2026, 7, 12, 23, 59))
    )
    expect(followOut[0]!.start).toEqual(at(2026, 7, 9, 10))
    expect(followOut.every((o) => o.start.getHours() === 10)).toBe(true)
    expect(following.id).not.toBe("series")
  })
})

describe("updateSeries (all events)", () => {
  it("shifts the whole series and preserves duration when only start moves", () => {
    const updated = updateSeries(series(), { start: at(2026, 7, 6, 14) })
    expect(updated.start).toEqual(at(2026, 7, 6, 14))
    expect(updated.end).toEqual(at(2026, 7, 6, 14, 30)) // 30-min duration kept
    const out = expandRecurring(
      updated,
      range(at(2026, 7, 6), at(2026, 7, 8, 23, 59))
    )
    expect(out.every((o) => o.start.getHours() === 14)).toBe(true)
  })

  it("applies presentational fields without touching times", () => {
    const updated = updateSeries(series(), { color: "red", title: "Sync" })
    expect(updated.color).toBe("red")
    expect(updated.title).toBe("Sync")
    expect(updated.start).toEqual(at(2026, 7, 6, 9))
  })
})
