import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import type {
  AvailabilityWindow,
  CalendarEvent,
  CalendarSize,
  CalendarSlot,
  EventChangeMeta,
  FreeSlot,
  TimeRange,
  Weekday,
} from "./types"
import { eventColorClasses } from "./event-color"
import { formatEventTime } from "./calendar-utils"

/**
 * Props shared by every view (month/week/day/agenda). `SmartCalendar` resolves
 * defaults once and hands each active view the same shape, so views stay thin
 * and presentational.
 */
export interface CalendarViewProps<T = unknown> {
  /** Anchor date for the view. */
  date: Date
  /** Events already scoped to (roughly) the visible range. */
  events: CalendarEvent<T>[]
  size: CalendarSize
  weekStartsOn: Weekday
  /** First visible hour in time-grid views. */
  minHour: number
  /** Last visible hour in time-grid views. */
  maxHour: number
  /** Minutes per selectable slot / grid subdivision. */
  slotMinutes: number
  /** Fallback duration for events without an explicit `end`. */
  defaultDurationMinutes: number
  /** Optional business-hours shading in time-grid views. */
  businessHours?: TimeRange
  /** "Now" used for the today highlight + current-time indicator. */
  now: Date
  /** Fires when an event is activated. */
  onEventClick?: (event: CalendarEvent<T>, e: React.MouseEvent) => void
  /** Fires when an empty slot / day cell is chosen. */
  onSlotSelect?: (slot: CalendarSlot) => void
  /** Fires when a day header/number is clicked (month → day drill-in). */
  onDateClick?: (date: Date) => void
  /** Override event rendering entirely. */
  renderEvent?: (event: CalendarEvent<T>) => React.ReactNode
  /** Max events shown per month cell before a "+N more" affordance. */
  maxEventsPerDay: number

  // ── Editing (drag-move / resize) ──
  /** Master switch for drag-move + edge-resize in time-grid views. */
  editable: boolean
  /** Fires after a completed move or resize gesture. */
  onEventChange?: (meta: EventChangeMeta<T>) => void

  // ── Booking availability ──
  /** Weekly bookable windows; when set, free slots render as pickable chips. */
  availability?: AvailabilityWindow[]
  /** Slots per availability window (concurrent bookings). @default 1 */
  slotCapacity: number
  /** Fires when a free booking slot is picked. */
  onSlotBook?: (slot: FreeSlot) => void
}

const TITLE_TEXT: Record<CalendarSize, string> = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
}

/** Compact month-cell chip: colored dot + title (+ optional start time). */
export function MonthEventPill<T>({
  event,
  size,
  showTime,
  onClick,
  draggable,
  onDragStart,
}: {
  event: CalendarEvent<T>
  size: CalendarSize
  showTime?: boolean
  onClick?: (e: React.MouseEvent) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}) {
  const colors = eventColorClasses(event.color)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={event.disabled}
      draggable={draggable}
      onDragStart={onDragStart}
      title={typeof event.title === "string" ? event.title : undefined}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        TITLE_TEXT[size],
        colors.pill,
        draggable && "cursor-grab active:cursor-grabbing",
        event.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", colors.dot)}
        aria-hidden
      />
      {showTime && !event.allDay && (
        <span className="shrink-0 tabular-nums opacity-70">
          {formatTimeShort(event.start)}
        </span>
      )}
      <span className="truncate font-medium">{event.title}</span>
    </button>
  )
}

/** Filled block used inside the time-grid (week/day) columns. */
export function TimedEventBlock<T>({
  event,
  size,
  defaultDurationMinutes,
  compact,
  onClick,
}: {
  event: CalendarEvent<T>
  size: CalendarSize
  defaultDurationMinutes: number
  /** Hide the time line when the block is too short. */
  compact?: boolean
  onClick?: (e: React.MouseEvent) => void
}) {
  const colors = eventColorClasses(event.color)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={event.disabled}
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-md border px-2 py-1 text-left transition-shadow",
        "hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        colors.block,
        event.disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "truncate leading-tight font-medium",
          size === "sm" ? "text-[11px]" : "text-xs"
        )}
      >
        {event.title}
      </span>
      {!compact && (
        <span className="truncate text-[10px] opacity-75">
          {formatEventTime(event, defaultDurationMinutes)}
        </span>
      )}
      {!compact && event.location && (
        <span className="truncate text-[10px] opacity-60">
          {event.location}
        </span>
      )}
    </button>
  )
}

/** All-day / multi-day banner chip (month & time-grid all-day rows). */
export function AllDayBanner<T>({
  event,
  size,
  onClick,
}: {
  event: CalendarEvent<T>
  size: CalendarSize
  onClick?: (e: React.MouseEvent) => void
}) {
  const colors = eventColorClasses(event.color)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={event.disabled}
      className={cn(
        "flex w-full items-center rounded border px-1.5 py-0.5 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        TITLE_TEXT[size],
        colors.block,
        event.disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span className="truncate font-medium">{event.title}</span>
    </button>
  )
}

function formatTimeShort(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  const period = h >= 12 ? "p" : "a"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0
    ? `${hour12}${period}`
    : `${hour12}:${String(m).padStart(2, "0")}${period}`
}
