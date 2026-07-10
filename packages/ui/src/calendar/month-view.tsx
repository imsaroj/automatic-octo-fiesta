import * as React from "react"
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import type { CalendarEvent } from "./types"
import type { CalendarViewProps } from "./shared"
import { MonthEventPill } from "./shared"
import { buildMonthGrid, eventEnd, eventsForDay } from "./calendar-utils"

/**
 * Month grid: a 6×7 matrix of day cells. Each cell lists up to `maxEventsPerDay`
 * event pills; the rest collapse into a "+N more" button that drills into the
 * day view. Clicking a day number or empty space fires `onSlotSelect`/`onDateClick`.
 * When `editable`, pills can be dragged onto another day to reschedule (whole
 * days, preserving the time of day).
 */
export function MonthView<T>(props: CalendarViewProps<T>) {
  const {
    date,
    events,
    size,
    weekStartsOn,
    now,
    onEventClick,
    onSlotSelect,
    onDateClick,
    maxEventsPerDay,
    renderEvent,
    editable,
    onEventChange,
  } = props

  // Which event is mid-drag, and the day currently hovered as a drop target.
  const dragEventRef = React.useRef<CalendarEvent<T> | null>(null)
  const [dropDayKey, setDropDayKey] = React.useState<string | null>(null)

  const rescheduleTo = (targetDay: Date) => {
    const event = dragEventRef.current
    dragEventRef.current = null
    setDropDayKey(null)
    if (!event || !onEventChange) return
    const dayDelta = differenceInCalendarDays(
      startOfDay(targetDay),
      startOfDay(event.start)
    )
    if (dayDelta === 0) return
    const start = addDays(event.start, dayDelta)
    const end = addDays(eventEnd(event), dayDelta)
    onEventChange({ event, start, end, kind: "move" })
  }

  const weeks = React.useMemo(
    () => buildMonthGrid(date, weekStartsOn),
    [date, weekStartsOn]
  )

  const weekdayLabels = React.useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn })
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEE"))
  }, [date, weekStartsOn])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-rows-6">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 border-b border-border last:border-b-0"
          >
            {week.map((day) => {
              const inMonth = isSameMonth(day, date)
              const isToday = isSameDay(day, now)
              const dayEvents = eventsForDay(events, day)
              const shown = dayEvents.slice(0, maxEventsPerDay)
              const overflow = dayEvents.length - shown.length

              const dayKey = day.toISOString()
              return (
                // Cell body is a click-to-create surface; the day number and
                // event pills inside it are the real keyboard-reachable controls.
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <div
                  key={dayKey}
                  className={cn(
                    "group/cell flex min-h-24 flex-col gap-0.5 border-r border-border p-1 last:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    dropDayKey === dayKey &&
                      "bg-primary/10 ring-1 ring-primary/40 ring-inset"
                  )}
                  onClick={(e) => {
                    // Only fire slot-select for clicks on empty cell space.
                    if (e.target === e.currentTarget)
                      onSlotSelect?.({
                        start: startOfDay(day),
                        end: endOfDay(day),
                        allDay: true,
                      })
                  }}
                  onDragOver={
                    editable
                      ? (e) => {
                          if (!dragEventRef.current) return
                          e.preventDefault()
                          if (dropDayKey !== dayKey) setDropDayKey(dayKey)
                        }
                      : undefined
                  }
                  onDrop={editable ? () => rescheduleTo(day) : undefined}
                >
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => onDateClick?.(day)}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs tabular-nums transition-colors hover:bg-accent",
                        isToday &&
                          "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                        !inMonth && "opacity-60"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {shown.map((event) =>
                      renderEvent ? (
                        <React.Fragment key={event.id}>
                          {renderEvent(event)}
                        </React.Fragment>
                      ) : (
                        <MonthEventPill
                          key={event.id}
                          event={event}
                          size={size}
                          showTime
                          draggable={
                            editable &&
                            event.editable !== false &&
                            !event.disabled
                          }
                          onDragStart={() => {
                            dragEventRef.current = event
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event, e)
                          }}
                        />
                      )
                    )}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={() => onDateClick?.(day)}
                        className="px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        +{overflow} more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
