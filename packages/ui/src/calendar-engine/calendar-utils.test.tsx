import { describe, expect, it } from "vitest"
import type { CalendarEvent } from "@/calendar-engine/types"
import {
  buildMonthGrid,
  buildWeekDays,
  eventEnd,
  eventsForDay,
  isMultiDay,
  layoutDayEvents,
  partitionDayEvents,
  sortEvents,
  stepDate,
  viewRange,
} from "@/calendar-engine/calendar-utils"

// A fixed reference: Tue 2026-07-07, 09:00.
const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min)

describe("buildMonthGrid", () => {
  it("returns a padded 6×7 grid starting on the week boundary", () => {
    const grid = buildMonthGrid(at(2026, 7, 15), 0)
    expect(grid).toHaveLength(6)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    // July 2026 starts on a Wednesday; with Sunday start the grid opens on
    // June 28.
    expect(grid[0]![0]!.getDate()).toBe(28)
    expect(grid[0]![0]!.getMonth()).toBe(5) // June
  })

  it("respects a Monday week start", () => {
    const grid = buildMonthGrid(at(2026, 7, 15), 1)
    // Monday-start grid opens on June 29.
    expect(grid[0]![0]!.getDay()).toBe(1)
    expect(grid[0]![0]!.getDate()).toBe(29)
  })
})

describe("buildWeekDays", () => {
  it("returns 7 consecutive days from the week start", () => {
    const days = buildWeekDays(at(2026, 7, 8), 0) // Wed
    expect(days).toHaveLength(7)
    expect(days[0]!.getDay()).toBe(0) // Sunday
    expect(days[6]!.getDay()).toBe(6) // Saturday
  })
})

describe("eventEnd", () => {
  it("returns the explicit end when valid", () => {
    const e: CalendarEvent = {
      id: "1",
      title: "x",
      start: at(2026, 7, 7, 9),
      end: at(2026, 7, 7, 10),
    }
    expect(eventEnd(e)).toEqual(at(2026, 7, 7, 10))
  })

  it("applies the default duration when end is missing", () => {
    const e: CalendarEvent = { id: "1", title: "x", start: at(2026, 7, 7, 9) }
    expect(eventEnd(e, 30)).toEqual(at(2026, 7, 7, 9, 30))
  })

  it("applies the default duration when end precedes start", () => {
    const e: CalendarEvent = {
      id: "1",
      title: "x",
      start: at(2026, 7, 7, 9),
      end: at(2026, 7, 7, 8),
    }
    expect(eventEnd(e, 60)).toEqual(at(2026, 7, 7, 10))
  })
})

describe("isMultiDay", () => {
  it("is false for a same-day timed event", () => {
    expect(
      isMultiDay({
        id: "1",
        title: "x",
        start: at(2026, 7, 7, 9),
        end: at(2026, 7, 7, 10),
      })
    ).toBe(false)
  })

  it("is true when the event crosses midnight", () => {
    expect(
      isMultiDay({
        id: "1",
        title: "x",
        start: at(2026, 7, 7, 23),
        end: at(2026, 7, 8, 1),
      })
    ).toBe(true)
  })
})

describe("sortEvents", () => {
  it("orders by start, then longer-first on ties", () => {
    const a: CalendarEvent = {
      id: "a",
      title: "a",
      start: at(2026, 7, 7, 9),
      end: at(2026, 7, 7, 10),
    }
    const b: CalendarEvent = {
      id: "b",
      title: "b",
      start: at(2026, 7, 7, 9),
      end: at(2026, 7, 7, 11),
    }
    const c: CalendarEvent = {
      id: "c",
      title: "c",
      start: at(2026, 7, 7, 8),
    }
    expect(sortEvents([a, b, c]).map((e) => e.id)).toEqual(["c", "b", "a"])
  })
})

describe("eventsForDay", () => {
  const events: CalendarEvent[] = [
    {
      id: "mon",
      title: "Mon",
      start: at(2026, 7, 6, 9),
      end: at(2026, 7, 6, 10),
    },
    {
      id: "tue",
      title: "Tue",
      start: at(2026, 7, 7, 9),
      end: at(2026, 7, 7, 10),
    },
    {
      id: "span",
      title: "Span",
      start: at(2026, 7, 6, 9),
      end: at(2026, 7, 8, 10),
    },
  ]

  it("includes only events intersecting the day", () => {
    const ids = eventsForDay(events, at(2026, 7, 7)).map((e) => e.id)
    expect(ids).toContain("tue")
    expect(ids).toContain("span") // multi-day event covers Tuesday
    expect(ids).not.toContain("mon")
  })
})

describe("partitionDayEvents", () => {
  it("splits all-day/multi-day from timed", () => {
    const { allDay, timed } = partitionDayEvents([
      { id: "a", title: "a", start: at(2026, 7, 7), allDay: true },
      {
        id: "t",
        title: "t",
        start: at(2026, 7, 7, 9),
        end: at(2026, 7, 7, 10),
      },
      {
        id: "m",
        title: "m",
        start: at(2026, 7, 6),
        end: at(2026, 7, 8),
      },
    ])
    expect(allDay.map((e) => e.id).sort()).toEqual(["a", "m"])
    expect(timed.map((e) => e.id)).toEqual(["t"])
  })
})

describe("layoutDayEvents", () => {
  const day = at(2026, 7, 7)

  it("gives a full-width lane to a lone event", () => {
    const [p] = layoutDayEvents(
      [
        {
          id: "1",
          title: "x",
          start: at(2026, 7, 7, 9),
          end: at(2026, 7, 7, 10),
        },
      ],
      day,
      0,
      24
    )
    expect(p!.width).toBe(100)
    expect(p!.left).toBe(0)
    expect(p!.lanes).toBe(1)
  })

  it("splits two overlapping events into side-by-side lanes", () => {
    const positioned = layoutDayEvents(
      [
        {
          id: "a",
          title: "a",
          start: at(2026, 7, 7, 9),
          end: at(2026, 7, 7, 11),
        },
        {
          id: "b",
          title: "b",
          start: at(2026, 7, 7, 10),
          end: at(2026, 7, 7, 12),
        },
      ],
      day,
      0,
      24
    )
    expect(positioned).toHaveLength(2)
    expect(positioned.every((p) => p.lanes === 2)).toBe(true)
    expect(positioned.every((p) => p.width === 50)).toBe(true)
    expect(positioned.map((p) => p.left).sort()).toEqual([0, 50])
  })

  it("reuses a lane for non-overlapping events", () => {
    const positioned = layoutDayEvents(
      [
        {
          id: "a",
          title: "a",
          start: at(2026, 7, 7, 9),
          end: at(2026, 7, 7, 10),
        },
        {
          id: "b",
          title: "b",
          start: at(2026, 7, 7, 11),
          end: at(2026, 7, 7, 12),
        },
      ],
      day,
      0,
      24
    )
    expect(positioned.every((p) => p.lanes === 1 && p.width === 100)).toBe(true)
  })

  it("positions top/height as a percentage of the hour window", () => {
    // 6h–18h window (12h span). A 9–10 event starts 3h in (25%) for 1h (~8.33%).
    const [p] = layoutDayEvents(
      [
        {
          id: "1",
          title: "x",
          start: at(2026, 7, 7, 9),
          end: at(2026, 7, 7, 10),
        },
      ],
      day,
      6,
      18
    )
    expect(p!.top).toBeCloseTo(25)
    expect(p!.height).toBeCloseTo((1 / 12) * 100)
  })
})

describe("stepDate", () => {
  it("steps by the view's page size", () => {
    const d = at(2026, 7, 15)
    expect(stepDate(d, "month", 1).getMonth()).toBe(7) // Aug
    expect(stepDate(d, "week", 1).getDate()).toBe(22)
    expect(stepDate(d, "day", -1).getDate()).toBe(14)
  })
})

describe("viewRange", () => {
  it("covers the full 6-week month grid", () => {
    const range = viewRange(at(2026, 7, 15), "month", 0)
    expect(range.start.getMonth()).toBe(5) // June
    expect(range.end.getMonth()).toBe(7) // August
  })

  it("covers a single day for the day view", () => {
    const range = viewRange(at(2026, 7, 7, 13), "day", 0)
    expect(range.start.getDate()).toBe(7)
    expect(range.start.getHours()).toBe(0)
    expect(range.end.getDate()).toBe(7)
    expect(range.end.getHours()).toBe(23)
  })
})
