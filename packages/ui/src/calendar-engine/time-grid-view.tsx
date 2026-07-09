import * as React from "react"
import { addMinutes, format, isSameDay, startOfDay } from "date-fns"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import type { CalendarEvent, CalendarSize } from "./types"
import type { CalendarViewProps } from "./shared"
import { TimedEventBlock } from "./shared"
import { AllDayBanner } from "./shared"
import {
  eventEnd,
  eventsForDay,
  hourLabels,
  layoutDayEvents,
  minutesSinceMidnight,
  partitionDayEvents,
} from "./calendar-utils"
import { generateFreeSlots } from "./booking"

const HOUR_HEIGHT: Record<CalendarSize, number> = { sm: 40, md: 48, lg: 60 }

/** How far the pointer must travel before a click becomes a drag. */
const DRAG_THRESHOLD = 4

/** Live preview of the event being dragged/resized. */
interface DragPreview<T> {
  event: CalendarEvent<T>
  mode: "move" | "resize"
  /** Target column (only changes in `move` mode). */
  dayIndex: number
  startMin: number
  endMin: number
}

/**
 * Time-grid view backing both `week` (7 columns) and `day` (1 column). Renders a
 * sticky day header, an all-day banner row, and a scrollable hour grid with
 * absolutely-positioned, overlap-packed event blocks, business-hours shading,
 * a live "now" indicator, click-to-create slot selection, optional bookable
 * free-slot chips, and (when `editable`) pointer drag-move (across days) +
 * edge-resize.
 */
export function TimeGridView<T>(
  props: CalendarViewProps<T> & { days: Date[] }
) {
  const {
    days,
    events,
    size,
    minHour,
    maxHour,
    slotMinutes,
    defaultDurationMinutes,
    businessHours,
    now,
    onEventClick,
    onSlotSelect,
    onDateClick,
    renderEvent,
    editable,
    onEventChange,
    availability,
    slotCapacity,
    onSlotBook,
  } = props

  const hourHeight = HOUR_HEIGHT[size]
  const hours = hourLabels(minHour, maxHour)
  const windowStartMin = minHour * 60
  const windowEndMin = maxHour * 60
  const totalMinutes = windowEndMin - windowStartMin
  const bodyHeight = (maxHour - minHour) * hourHeight

  const [drag, setDrag] = React.useState<DragPreview<T> | null>(null)
  // Latest preview, read on pointer-up without a stale-closure or a
  // StrictMode-unsafe functional-update side effect.
  const previewRef = React.useRef<DragPreview<T> | null>(null)
  // The columns container, used to map pointer X → target day column.
  const colsRef = React.useRef<HTMLDivElement>(null)

  const snap = React.useCallback(
    (minutes: number) => Math.round(minutes / slotMinutes) * slotMinutes,
    [slotMinutes]
  )

  const pctTop = (min: number) => ((min - windowStartMin) / totalMinutes) * 100
  const pctHeight = (a: number, b: number) => ((b - a) / totalMinutes) * 100

  /**
   * Start a move/resize gesture. Handlers are defined inline so they close over
   * this render's geometry and are added/removed by the same reference — no
   * effect, no stale refs. A movement threshold keeps plain clicks intact.
   */
  const beginGesture = (
    e: React.PointerEvent,
    mode: "move" | "resize",
    event: CalendarEvent<T>,
    day: Date,
    sourceIndex: number
  ) => {
    if (!editable || event.editable === false || event.disabled) return
    if (e.button !== 0) return

    const startMin0 = minutesSinceMidnight(event.start)
    const endMin0 = Math.max(
      startMin0 + slotMinutes,
      minutesSinceMidnight(eventEnd(event, defaultDurationMinutes))
    )
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      moved = true
      const dyMin = snap((dy / bodyHeight) * totalMinutes)

      let next: DragPreview<T>
      if (mode === "move") {
        let dayIndex = sourceIndex
        const el = colsRef.current
        if (el && days.length > 1) {
          const r = el.getBoundingClientRect()
          const colW = r.width / days.length
          dayIndex = Math.min(
            days.length - 1,
            Math.max(0, Math.floor((ev.clientX - r.left) / colW))
          )
        }
        const duration = endMin0 - startMin0
        const startMin = Math.max(
          windowStartMin,
          Math.min(startMin0 + dyMin, windowEndMin - duration)
        )
        next = { event, mode, dayIndex, startMin, endMin: startMin + duration }
      } else {
        const endMin = Math.max(
          startMin0 + slotMinutes,
          Math.min(endMin0 + dyMin, windowEndMin)
        )
        next = {
          event,
          mode,
          dayIndex: sourceIndex,
          startMin: startMin0,
          endMin,
        }
      }
      previewRef.current = next
      setDrag(next)
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const preview = previewRef.current
      previewRef.current = null
      if (moved && preview && onEventChange) {
        const targetDay = days[preview.dayIndex] ?? day
        const base = startOfDay(targetDay)
        onEventChange({
          event,
          start: addMinutes(base, preview.startMin),
          end: addMinutes(base, preview.endMin),
          kind: mode,
        })
      }
      setDrag(null)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const hasAllDay = React.useMemo(
    () =>
      days.some(
        (day) => partitionDayEvents(eventsForDay(events, day)).allDay.length > 0
      ),
    [days, events]
  )

  const handleColumnClick = (
    day: Date,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!onSlotSelect) return
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const rawMinutes = windowStartMin + (offsetY / rect.height) * totalMinutes
    const snapped = Math.floor(rawMinutes / slotMinutes) * slotMinutes
    const start = addMinutes(startOfDay(day), snapped)
    onSlotSelect({ start, end: addMinutes(start, slotMinutes), allDay: false })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header row */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        <div
          className="grid flex-1"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day, dayIndex) => {
            const isToday = isSameDay(day, now)
            const isDropTarget =
              drag?.mode === "move" && drag.dayIndex === dayIndex
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onDateClick?.(day)}
                className={cn(
                  "flex flex-col items-center gap-0.5 border-l border-border py-2 first:border-l-0 hover:bg-accent/50",
                  isDropTarget && "bg-primary/10"
                )}
              >
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm tabular-nums",
                    isToday &&
                      "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* All-day banner row */}
      {hasAllDay && (
        <div className="flex border-b border-border bg-muted/20">
          <div className="flex w-14 shrink-0 items-center justify-end pr-2 text-[10px] text-muted-foreground">
            all-day
          </div>
          <div
            className="grid flex-1"
            style={{
              gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            }}
          >
            {days.map((day) => {
              const allDay = partitionDayEvents(
                eventsForDay(events, day)
              ).allDay
              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-col gap-0.5 border-l border-border p-1 first:border-l-0"
                >
                  {allDay.map((event) => (
                    <AllDayBanner
                      key={event.id}
                      event={event}
                      size={size}
                      onClick={(e) => onEventClick?.(event, e)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex">
          {/* Hour gutter */}
          <div className="w-14 shrink-0">
            {hours.map((h) => (
              <div
                key={h}
                className="relative text-right"
                style={{ height: hourHeight }}
              >
                <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground tabular-nums">
                  {formatHour(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns (relative so the drag preview can float over them) */}
          <div
            ref={colsRef}
            className="relative grid flex-1"
            style={{
              gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            }}
          >
            {days.map((day, dayIndex) => {
              const timed = partitionDayEvents(eventsForDay(events, day)).timed
              const positioned = layoutDayEvents(
                timed,
                day,
                minHour,
                maxHour,
                defaultDurationMinutes
              )
              const freeSlots = availability
                ? generateFreeSlots(
                    day,
                    availability,
                    timed,
                    slotMinutes,
                    slotCapacity,
                    now
                  )
                : []
              const showNow = isSameDay(day, now)
              const nowMinutes = minutesSinceMidnight(now)
              const nowVisible =
                showNow &&
                nowMinutes >= windowStartMin &&
                nowMinutes <= windowEndMin

              return (
                // Column is a click-to-create surface; event blocks inside it
                // are the real keyboard-reachable controls.
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <div
                  key={day.toISOString()}
                  className="relative border-l border-border first:border-l-0"
                  style={{ height: bodyHeight }}
                  onClick={(e) => handleColumnClick(day, e)}
                >
                  {/* Business-hours shading */}
                  {businessHours && (
                    <div
                      className="pointer-events-none absolute inset-x-0 bg-muted/25"
                      style={{
                        top: `${pctTop(businessHours.startMinutes)}%`,
                        height: `${pctHeight(businessHours.startMinutes, businessHours.endMinutes)}%`,
                      }}
                    />
                  )}

                  {/* Hour lines */}
                  {hours.slice(0, -1).map((h, i) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                      style={{ top: (i + 1) * hourHeight }}
                    />
                  ))}

                  {/* Bookable free-slot chips (render beneath events) */}
                  {freeSlots.map((slot) => {
                    const s = minutesSinceMidnight(slot.start)
                    const e =
                      s + (slot.end.getTime() - slot.start.getTime()) / 60000
                    return (
                      <button
                        key={slot.start.toISOString()}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onSlotBook?.(slot)
                        }}
                        className="absolute inset-x-0.5 flex items-center justify-center rounded border border-dashed border-emerald-500/50 bg-emerald-500/5 text-[10px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
                        style={{
                          top: `${pctTop(s)}%`,
                          height: `${pctHeight(s, e)}%`,
                        }}
                      >
                        {format(slot.start, "h:mm a")}
                        {slot.capacity > 1 ? ` · ${slot.capacity} left` : ""}
                      </button>
                    )
                  })}

                  {/* Positioned events */}
                  {positioned.map((p) => {
                    const dragging = drag?.event.id === p.event.id
                    // In resize mode the block reshapes in place; in move mode
                    // the source dims and the floating preview shows the target.
                    const resizing = dragging && drag!.mode === "resize"
                    const moving = dragging && drag!.mode === "move"
                    const top = resizing ? pctTop(drag!.startMin) : p.top
                    const height = resizing
                      ? pctHeight(drag!.startMin, drag!.endMin)
                      : p.height
                    const canEdit =
                      editable &&
                      p.event.editable !== false &&
                      !p.event.disabled

                    return (
                      <div
                        key={p.event.id}
                        className={cn(
                          "absolute p-px",
                          resizing && "z-20",
                          moving && "opacity-30"
                        )}
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          left: `${p.left}%`,
                          width: `${p.width}%`,
                        }}
                        onPointerDown={
                          canEdit
                            ? (e) =>
                                beginGesture(e, "move", p.event, day, dayIndex)
                            : undefined
                        }
                      >
                        {renderEvent ? (
                          renderEvent(p.event)
                        ) : (
                          <div className="relative size-full">
                            <TimedEventBlock
                              event={p.event}
                              size={size}
                              defaultDurationMinutes={defaultDurationMinutes}
                              compact={height < 6}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!dragging) onEventClick?.(p.event, e)
                              }}
                            />
                            {canEdit && (
                              // Resize handle at the bottom edge.
                              <div
                                className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                                onPointerDown={(e) => {
                                  e.stopPropagation()
                                  beginGesture(
                                    e,
                                    "resize",
                                    p.event,
                                    day,
                                    dayIndex
                                  )
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Now indicator */}
                  {nowVisible && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: `${pctTop(nowMinutes)}%` }}
                    >
                      <span className="size-2 -translate-x-1/2 rounded-full bg-red-500" />
                      <span className="h-px flex-1 bg-red-500" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Floating move preview — spans the current target column. */}
            {drag?.mode === "move" && (
              <div
                className="pointer-events-none absolute z-30 p-px"
                style={{
                  left: `${(drag.dayIndex / days.length) * 100}%`,
                  width: `${100 / days.length}%`,
                  top: `${pctTop(drag.startMin)}%`,
                  height: `${pctHeight(drag.startMin, drag.endMin)}%`,
                }}
              >
                <div className="size-full rounded-md opacity-90 shadow-lg ring-2 ring-primary/50">
                  <TimedEventBlock
                    event={{
                      ...drag.event,
                      start: addMinutes(
                        startOfDay(days[drag.dayIndex] ?? days[0]!),
                        drag.startMin
                      ),
                      end: addMinutes(
                        startOfDay(days[drag.dayIndex] ?? days[0]!),
                        drag.endMin
                      ),
                    }}
                    size={size}
                    defaultDurationMinutes={defaultDurationMinutes}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM"
  if (h === 12) return "12 PM"
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
