import * as React from "react"
import { format, isSameDay } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"
import type { CalendarViewProps } from "./shared"
import { eventColorClasses } from "./event-color"
import { formatEventTime, groupEventsByDay, viewRange } from "./calendar-utils"

/**
 * Agenda / schedule view: a flat, scrollable list of upcoming days (30-day
 * window from the anchor date), each with its events in chronological order.
 * Empty days are omitted.
 */
export function AgendaView<T>(props: CalendarViewProps<T>) {
  const {
    date,
    events,
    weekStartsOn,
    now,
    defaultDurationMinutes,
    onEventClick,
    renderEvent,
  } = props

  const groups = React.useMemo(() => {
    const range = viewRange(date, "agenda", weekStartsOn)
    return groupEventsByDay(events, range)
  }, [date, events, weekStartsOn])

  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
        No events in this period.
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {groups.map(({ day, events: dayEvents }) => {
          const isToday = isSameDay(day, now)
          return (
            <div key={day.toISOString()} className="flex gap-4 px-4 py-3">
              {/* Day label */}
              <div className="w-20 shrink-0 pt-1">
                <div
                  className={cn(
                    "text-xs font-medium uppercase",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    isToday && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(day, "MMM")}
                </div>
              </div>

              {/* Events */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {dayEvents.map((event) =>
                  renderEvent ? (
                    <React.Fragment key={event.id}>
                      {renderEvent(event)}
                    </React.Fragment>
                  ) : (
                    <button
                      key={event.id}
                      type="button"
                      disabled={event.disabled}
                      onClick={(e) => onEventClick?.(event, e)}
                      className={cn(
                        "flex items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-accent/40",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        event.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 size-2.5 shrink-0 rounded-full",
                          eventColorClasses(event.color).dot
                        )}
                        aria-hidden
                      />
                      <span className="w-28 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatEventTime(event, defaultDurationMinutes)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {event.title}
                        </span>
                        {event.location && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {event.location}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
