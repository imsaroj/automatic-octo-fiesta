"use client"

import * as React from "react"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import type {
  AvailabilityWindow,
  CalendarEvent,
  CalendarSize,
  CalendarSlot,
  CalendarView,
  EventChangeMeta,
  FreeSlot,
  SmartCalendarHandle,
  TimeRange,
  Weekday,
} from "./types"
import { useControllable } from "./use-calendar"
import { buildWeekDays, stepDate, viewRange, viewTitle } from "./calendar-utils"
import { expandEvents } from "./recurrence"
import type { CalendarViewProps } from "./shared"
import { MonthView } from "./month-view"
import { TimeGridView } from "./time-grid-view"
import { AgendaView } from "./agenda-view"

const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
}

export interface SmartCalendarProps<T = unknown> {
  /** The events / bookings to render. */
  events?: CalendarEvent<T>[]

  // ── Date ──
  /** Controlled anchor date. */
  date?: Date
  /** Uncontrolled initial anchor date. @default today */
  defaultDate?: Date
  onDateChange?: (date: Date) => void

  // ── View ──
  /** Controlled active view. */
  view?: CalendarView
  /** Uncontrolled initial view. @default "month" */
  defaultView?: CalendarView
  onViewChange?: (view: CalendarView) => void
  /** Which views to offer in the toolbar switcher. @default all four */
  views?: CalendarView[]

  // ── Layout / density ──
  size?: CalendarSize
  /** 0 = Sunday … 1 = Monday. @default 0 */
  weekStartsOn?: Weekday
  /** First visible hour in time-grid views (0–23). @default 0 */
  minHour?: number
  /** Last visible hour in time-grid views (1–24). @default 24 */
  maxHour?: number
  /** Slot granularity + click-to-create duration, in minutes. @default 30 */
  slotMinutes?: number
  /** Fallback duration for events without an `end`. @default 60 */
  defaultDurationMinutes?: number
  /** Shade a business-hours window in time-grid views. */
  businessHours?: TimeRange
  /** Max event pills per month cell before "+N more". @default 3 */
  maxEventsPerDay?: number

  // ── Editing ──
  /** Enable drag-to-move + edge-resize (per event, gated by `event.editable`). */
  editable?: boolean
  /** Fires after a completed move or resize gesture. */
  onEventChange?: (meta: EventChangeMeta<T>) => void

  // ── Booking availability ──
  /** Weekly bookable windows; renders free-slot chips in time-grid views. */
  availability?: AvailabilityWindow[]
  /** Concurrent bookings allowed per slot. @default 1 */
  slotCapacity?: number
  /** Fires when a bookable free slot is chosen. */
  onSlotBook?: (slot: FreeSlot) => void

  // ── Callbacks ──
  onEventClick?: (event: CalendarEvent<T>, e: React.MouseEvent) => void
  onSlotSelect?: (slot: CalendarSlot) => void

  // ── Rendering / chrome ──
  /** Override event rendering across every view. */
  renderEvent?: (event: CalendarEvent<T>) => React.ReactNode
  /** Hide the built-in toolbar (title, nav, view switcher). */
  hideToolbar?: boolean
  /** Extra toolbar content, rendered on the right of the view switcher. */
  toolbarExtra?: React.ReactNode

  className?: string
  ref?: React.Ref<SmartCalendarHandle>
}

/**
 * `SmartCalendar` — a declarative calendar & booking surface with month, week,
 * day, and agenda views. Date, view, and events are each independently
 * controllable or uncontrolled; navigation, view switching, slot selection, and
 * event activation are exposed through callbacks and an imperative
 * `SmartCalendarHandle`.
 */
export function SmartCalendar<T = unknown>({
  events = [],
  date,
  defaultDate,
  onDateChange,
  view,
  defaultView = "month",
  onViewChange,
  views = ["month", "week", "day", "agenda"],
  size = "md",
  weekStartsOn = 0,
  minHour = 0,
  maxHour = 24,
  slotMinutes = 30,
  defaultDurationMinutes = 60,
  businessHours,
  maxEventsPerDay = 3,
  editable = false,
  onEventChange,
  availability,
  slotCapacity = 1,
  onSlotBook,
  onEventClick,
  onSlotSelect,
  renderEvent,
  hideToolbar,
  toolbarExtra,
  className,
  ref,
}: SmartCalendarProps<T>) {
  const [anchor, setAnchor] = useControllable(
    date,
    defaultDate ?? new Date(),
    onDateChange
  )
  const [activeView, setActiveView] = useControllable(
    view,
    defaultView,
    onViewChange
  )

  // A stable "now" for today-highlighting; refreshed each minute so the time
  // indicator drifts without re-rendering on every tick.
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  React.useImperativeHandle(
    ref,
    (): SmartCalendarHandle => ({
      next: () => setAnchor((d) => stepDate(d, activeView, 1)),
      prev: () => setAnchor((d) => stepDate(d, activeView, -1)),
      today: () => setAnchor(new Date()),
      goToDate: (d) => setAnchor(d),
      setView: (v) => setActiveView(v),
      getDate: () => anchor,
      getView: () => activeView,
    }),
    [activeView, anchor, setAnchor, setActiveView]
  )

  // Expand recurrence + scope to the visible range once, so each view filters a
  // smaller, already-concrete set of events.
  const visibleEvents = React.useMemo(() => {
    const range = viewRange(anchor, activeView, weekStartsOn)
    return expandEvents(events, range, defaultDurationMinutes)
  }, [events, anchor, activeView, weekStartsOn, defaultDurationMinutes])

  const viewProps: CalendarViewProps<T> = {
    date: anchor,
    events: visibleEvents,
    size,
    weekStartsOn,
    minHour,
    maxHour,
    slotMinutes,
    defaultDurationMinutes,
    businessHours,
    now,
    onEventClick,
    onSlotSelect,
    onDateClick: (d) => {
      setAnchor(d)
      if (views.includes("day")) setActiveView("day")
    },
    renderEvent,
    maxEventsPerDay,
    editable,
    onEventChange,
    availability,
    slotCapacity,
    onSlotBook,
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
        className
      )}
    >
      {!hideToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchor(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous"
              onClick={() => setAnchor((d) => stepDate(d, activeView, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next"
              onClick={() => setAnchor((d) => stepDate(d, activeView, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarDaysIcon className="size-4 text-muted-foreground" />
            {viewTitle(anchor, activeView, weekStartsOn)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {toolbarExtra}
            {views.length > 1 && (
              <div className="flex items-center rounded-md border border-border p-0.5">
                {views.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActiveView(v)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      activeView === v
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "month" && <MonthView {...viewProps} />}
      {activeView === "week" && (
        <TimeGridView
          {...viewProps}
          days={buildWeekDays(anchor, weekStartsOn)}
        />
      )}
      {activeView === "day" && <TimeGridView {...viewProps} days={[anchor]} />}
      {activeView === "agenda" && <AgendaView {...viewProps} />}
    </div>
  )
}
