export { SmartCalendar } from "./calendar"
export type { SmartCalendarProps } from "./calendar"

export type {
  CalendarEvent,
  CalendarEventColor,
  CalendarView,
  CalendarSize,
  CalendarSlot,
  TimeRange,
  Weekday,
  SmartCalendarHandle,
  RecurrenceRule,
  RecurrenceFreq,
  AvailabilityWindow,
  FreeSlot,
  EventChangeMeta,
} from "./types"

export {
  expandRecurring,
  expandEvents,
  detachOccurrence,
  splitSeries,
  updateSeries,
} from "./recurrence"
export type { EventPatch } from "./recurrence"
export { generateFreeSlots, windowsForDay } from "./booking"

export { eventColorClasses, EVENT_COLORS } from "./event-color"
export type { EventColorClasses } from "./event-color"

export {
  buildMonthGrid,
  buildWeekDays,
  viewRange,
  stepDate,
  eventEnd,
  isMultiDay,
  sortEvents,
  eventsForDay,
  partitionDayEvents,
  minutesSinceMidnight,
  layoutDayEvents,
  hourLabels,
  viewTitle,
  formatEventTime,
  groupEventsByDay,
  isInRange,
} from "./calendar-utils"
export type { DateRange, PositionedEvent } from "./calendar-utils"
