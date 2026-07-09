# Calendar engine — `@iamsaroj/smart-ui/calendar-engine`

## What it is

`SmartCalendar` — a calendar & booking surface. Generic over a per-event `data`
payload (`CalendarEvent<T>`). Four views (month / week / day / agenda), drag-move
& resize editing, an RRULE-subset recurrence model with series-edit helpers, and
availability-driven slot booking.

## Import

```ts
import {
  SmartCalendar,
  type CalendarEvent,
  type SmartCalendarHandle,
} from "@iamsaroj/smart-ui/calendar-engine"
```

## 80% example

```tsx
const events: CalendarEvent[] = [
  {
    id: "e1",
    title: "Standup",
    start: new Date(2026, 6, 15, 9, 0),
    end: new Date(2026, 6, 15, 9, 30),
  },
]

<SmartCalendar
  events={events}
  defaultView="week"
  editable
  onEventClick={(ev) => openEdit(ev)}
  onEventChange={(meta) => save(meta)} // kind: "move" | "resize"
/>
```

## Key props

| Prop            | Type                              | Notes                                                               |
| --------------- | --------------------------------- | ------------------------------------------------------------------- |
| `events`        | `CalendarEvent<T>[]`              | Timed, all-day, or multi-day.                                       |
| `date`/`view`   | `Date` / `CalendarView`           | Each independently controllable.                                    |
| `editable`      | `boolean`                         | Drag-to-move + edge-resize; per-event opt-out via `event.editable`. |
| `onEventChange` | `(meta: EventChangeMeta) => void` | `kind: "move" \| "resize"`.                                         |
| `availability`  | `AvailabilityWindow[]`            | Drives free-slot chips (`onSlotBook`).                              |

## Recurrence & series editing

`RecurrenceRule` is a compact RRULE subset (daily/weekly/monthly, `interval`,
`byWeekday`, `count`/`until`, `exceptions`). `expandEvents` turns templates into
concrete instances across the visible range. Three-way series edit:
`detachOccurrence` (this only), `splitSeries` (this & following), `updateSeries`
(all).

## Booking

`availability` (weekly windows) drives `generateFreeSlots` (windows minus booked
events, honoring `slotCapacity`, dropping past slots); the time-grid renders them
as pickable chips firing `onSlotBook`. `onSlotSelect` fires for clicks on empty
grid/day cells.

## Escape hatches

- Imperative handle (`SmartCalendarHandle`): `next`/`prev`/`today`/`goToDate`/
  `setView`.
- 8 preset color tokens (`event-color.ts`); overlapping timed events are packed
  into side-by-side lanes by `layoutDayEvents`.

## Gotchas

- All date math + layout is pure and unit-tested — prefer those helpers over
  hand-rolled date arithmetic.
- The demo app uses native `Date` helpers; `date-fns` lives in `packages/ui` only.

## Demo

`/smart/calendar` (create/edit/delete dialog, recurring-scope prompt, drag/resize,
availability booking).
