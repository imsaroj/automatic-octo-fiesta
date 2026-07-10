import { useMemo, useRef, useState } from "react"
import { CalendarPlusIcon, RepeatIcon } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartDialog } from "@iamsaroj/smart-ui/smart-components/smart-dialog"
import { SmartButton } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartInput } from "@iamsaroj/smart-ui/smart-components/smart-input"
import { SmartSelect } from "@iamsaroj/smart-ui/smart-components/smart-select"
import { SmartSwitch } from "@iamsaroj/smart-ui/smart-components/smart-switch"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import {
  SmartCalendar,
  detachOccurrence,
  splitSeries,
  updateSeries,
  eventEnd,
  EVENT_COLORS,
  type AvailabilityWindow,
  type CalendarEvent,
  type CalendarEventColor,
  type EventChangeMeta,
  type EventPatch,
  type FreeSlot,
  type SmartCalendarHandle,
} from "@iamsaroj/smart-ui/calendar"

// ── Local date helpers (apps/web doesn't depend on date-fns directly) ─────────

const pad = (n: number) => String(n).padStart(2, "0")
const addDays = (d: Date, n: number) => {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}
const addHours = (d: Date, n: number) => {
  const next = new Date(d)
  next.setMinutes(next.getMinutes() + Math.round(n * 60))
  return next
}
/** Monday of the current week, at 00:00. */
const currentWeekStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Sun
  return addDays(d, dow === 0 ? -6 : 1 - dow)
}
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
const fmtTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })

// ── Sample bookings, anchored to the current week so they always show up ──────

const weekStart = currentWeekStart()
const at = (offset: number, h: number, m = 0) => {
  const d = addDays(weekStart, offset)
  d.setHours(h, m, 0, 0)
  return d
}

let seq = 0
const nextId = () => `evt-${seq++}`
const evt = (
  title: string,
  start: Date,
  hours: number,
  color: CalendarEventColor,
  location?: string,
  extra?: Partial<CalendarEvent>
): CalendarEvent => ({
  id: nextId(),
  title,
  start,
  end: addHours(start, hours),
  color,
  location,
  ...extra,
})

const seedEvents: CalendarEvent[] = [
  // Recurring: standup every weekday at 9:30 (expanded into per-day instances).
  evt("Daily standup", at(0, 9, 30), 0.5, "blue", "Zoom", {
    recurrence: { freq: "weekly", byWeekday: [1, 2, 3, 4, 5] },
  }),
  evt("1:1 with Priya", at(0, 11), 1, "violet", "Room 4B"),
  evt("Design review", at(0, 14), 1.5, "amber", "Studio"),
  evt("Product sync", at(1, 10), 1, "green", "Room 2A"),
  evt("Lunch w/ candidate", at(1, 12, 30), 1, "pink", "The Deli"),
  evt("Sprint planning", at(2, 9), 2, "blue", "Main hall"),
  evt("Dentist", at(2, 15), 1, "red", "Downtown clinic"),
  evt("Client demo", at(3, 13), 1, "cyan", "Zoom"),
  evt("Gym", at(3, 18), 1, "green"),
  evt("Retro", at(4, 15, 30), 1, "amber", "Room 2A"),
  evt("Roadmap workshop", at(4, 10), 3, "violet", "Offsite"),
  evt("Conference", at(2, 0), 0, "gray", "Austin, TX", {
    allDay: true,
    end: addDays(at(2, 0), 2),
  }),
  evt("Release freeze", at(5, 0), 0, "red", undefined, { allDay: true }),
]

const COLOR_DOT: Record<CalendarEventColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  gray: "bg-muted-foreground",
}
const colorOptions = EVENT_COLORS.map((c) => ({
  value: c,
  label: (
    <span className="flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${COLOR_DOT[c]}`} />
      <span className="capitalize">{c}</span>
    </span>
  ),
}))

// ── Booking draft (the editable form shape) ───────────────────────────────────

interface Draft {
  title: string
  color: CalendarEventColor
  location: string
  allDay: boolean
  date: string
  start: string
  end: string
}

const emptyDraft = (start: Date, end: Date, allDay = false): Draft => ({
  title: "",
  color: "blue",
  location: "",
  allDay,
  date: ymd(start),
  start: hm(start),
  end: hm(end),
})

const toDraft = (ev: CalendarEvent): Draft => {
  const end = eventEnd(ev)
  return {
    title: String(ev.title),
    color: ev.color ?? "blue",
    location: ev.location ? String(ev.location) : "",
    allDay: !!ev.allDay,
    date: ymd(ev.start),
    start: hm(ev.start),
    end: hm(end),
  }
}

const parseHM = (s: string): [number, number] => {
  const [h, m] = s.split(":").map(Number)
  return [h || 0, m || 0]
}

/** The concrete, fully-populated fields a draft produces. */
type BookingFields = Pick<
  CalendarEvent,
  "title" | "start" | "end" | "color" | "location" | "allDay"
>

/** Turn a draft into a complete set of booking fields. */
const fromDraft = (d: Draft): BookingFields => {
  const [y, mo, day] = d.date.split("-").map(Number)
  if (d.allDay) {
    const start = new Date(y!, mo! - 1, day!, 0, 0, 0, 0)
    return {
      title: d.title || "Untitled",
      color: d.color,
      location: d.location || undefined,
      allDay: true,
      start,
      end: start,
    }
  }
  const [sh, sm] = parseHM(d.start)
  const [eh, em] = parseHM(d.end)
  const start = new Date(y!, mo! - 1, day!, sh, sm)
  let end = new Date(y!, mo! - 1, day!, eh, em)
  if (end <= start) end = new Date(start.getTime() + 60 * 60_000)
  return {
    title: d.title || "Untitled",
    color: d.color,
    location: d.location || undefined,
    allDay: undefined,
    start,
    end,
  }
}

type Scope = "this" | "following" | "all"

const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents)
  const controlRef = useRef<SmartCalendarHandle>(null)

  // Editor dialog state.
  const [editor, setEditor] = useState<{
    mode: "create" | "edit"
    draft: Draft
    event?: CalendarEvent
  } | null>(null)

  // Pending action that targets a recurring series → resolved by the scope prompt.
  const [pending, setPending] = useState<{
    action: "edit" | "delete"
    instance: CalendarEvent
    patch?: EventPatch
  } | null>(null)

  const businessHours = useMemo(
    () => ({ startMinutes: 9 * 60, endMinutes: 18 * 60 }),
    []
  )
  const availability = useMemo<AvailabilityWindow[]>(
    () =>
      [1, 2, 3, 4, 5].map((weekday) => ({
        weekday: weekday as AvailabilityWindow["weekday"],
        startMinutes: 9 * 60,
        endMinutes: 17 * 60,
      })),
    []
  )

  const titleOf = (ev: CalendarEvent) => String(ev.title)

  // ── Mutations ──────────────────────────────────────────────────────────────

  const upsertEvent = (ev: CalendarEvent) =>
    setEvents((prev) => {
      const i = prev.findIndex((e) => e.id === ev.id)
      if (i === -1) return [...prev, ev]
      const next = [...prev]
      next[i] = ev
      return next
    })

  const replaceTemplate = (
    templateId: string,
    template: CalendarEvent | null,
    add: CalendarEvent[] = []
  ) =>
    setEvents((prev) => {
      const kept = prev.filter((e) => e.id !== templateId)
      return template ? [...kept, template, ...add] : [...kept, ...add]
    })

  /** Apply an edit patch to a recurring instance under the chosen scope. */
  const applySeriesEdit = (
    instance: CalendarEvent,
    patch: EventPatch,
    scope: Scope
  ) => {
    const templateId = instance.occurrence!.templateId
    const template = events.find((e) => e.id === templateId)
    if (!template) return
    const date = instance.occurrence!.date
    if (scope === "this") {
      const { template: t2, event } = detachOccurrence(template, date, patch)
      replaceTemplate(templateId, t2, [event])
    } else if (scope === "following") {
      const { previous, following } = splitSeries(template, date, patch)
      replaceTemplate(templateId, previous, [following])
    } else {
      // "all": translate the instance-level change into a series-level patch by
      // preserving the offset from the template's own start where relevant.
      const seriesPatch: EventPatch = { ...patch }
      if (patch.start) {
        seriesPatch.start = new Date(template.start)
        seriesPatch.start.setHours(
          patch.start.getHours(),
          patch.start.getMinutes(),
          0,
          0
        )
        seriesPatch.end = undefined
      }
      replaceTemplate(templateId, updateSeries(template, seriesPatch))
    }
    toast.success(
      `Updated ${scope === "all" ? "the series" : scope === "following" ? "this & following" : "this event"}`
    )
  }

  const applySeriesDelete = (instance: CalendarEvent, scope: Scope) => {
    const templateId = instance.occurrence!.templateId
    const template = events.find((e) => e.id === templateId)
    if (!template) return
    const date = instance.occurrence!.date
    if (scope === "this") {
      const { template: t2 } = detachOccurrence(template, date, {})
      replaceTemplate(templateId, t2)
    } else if (scope === "following") {
      const { previous } = splitSeries(template, date, {})
      replaceTemplate(templateId, previous)
    } else {
      replaceTemplate(templateId, null)
    }
    toast(
      `Deleted ${scope === "all" ? "the series" : scope === "following" ? "this & following" : "this event"}`
    )
  }

  // ── Handlers wired to the calendar ──────────────────────────────────────────

  const openCreate = (start: Date, end: Date, allDay = false) =>
    setEditor({ mode: "create", draft: emptyDraft(start, end, allDay) })

  const openEdit = (ev: CalendarEvent) =>
    setEditor({ mode: "edit", draft: toDraft(ev), event: ev })

  const onEventChange = (meta: EventChangeMeta) => {
    const patch: EventPatch = { start: meta.start, end: meta.end }
    if (meta.event.occurrence) {
      // Drag/resize of a recurring instance → ask for scope.
      setPending({ action: "edit", instance: meta.event, patch })
      return
    }
    upsertEvent({ ...meta.event, start: meta.start, end: meta.end })
    toast.success(
      `${meta.kind === "resize" ? "Resized" : "Moved"} “${titleOf(meta.event)}” → ${fmtDate(meta.start)} ${fmtTime(meta.start)}`
    )
  }

  const saveEditor = () => {
    if (!editor) return
    const patch = fromDraft(editor.draft)
    if (editor.mode === "create") {
      upsertEvent({ id: nextId(), ...patch })
      toast.success(`Created “${patch.title}”`)
      setEditor(null)
      return
    }
    const ev = editor.event!
    if (ev.occurrence) {
      // Editing a recurring instance → resolve scope, then apply.
      setPending({ action: "edit", instance: ev, patch })
      setEditor(null)
      return
    }
    upsertEvent({ ...ev, ...patch })
    toast.success(`Saved “${patch.title}”`)
    setEditor(null)
  }

  const deleteFromEditor = () => {
    if (!editor?.event) return
    const ev = editor.event
    if (ev.occurrence) {
      setPending({ action: "delete", instance: ev })
      setEditor(null)
      return
    }
    setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    toast(`Deleted “${titleOf(ev)}”`)
    setEditor(null)
  }

  const resolveScope = (scope: Scope) => {
    if (!pending) return
    if (pending.action === "edit")
      applySeriesEdit(pending.instance, pending.patch ?? {}, scope)
    else applySeriesDelete(pending.instance, scope)
    setPending(null)
  }

  const bookSlot = (slot: FreeSlot) => openCreate(slot.start, slot.end)

  const calendarProps = {
    weekStartsOn: 1 as const,
    editable: true,
    onEventChange,
    onEventClick: (ev: CalendarEvent) => openEdit(ev),
  }

  return (
    <SmartPage
      layout="detail"
      title="Calendar Engine — Calendrix"
      description="SmartCalendar — a full booking surface: create, edit, and delete bookings; drag to move (across days) or resize; recurring series with this / this-&-following / all-events editing; and availability-driven slot booking. Month, week, day, and agenda views."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Primary booking calendar ─────────────────────────────── */}
        <SmartPageSection
          title="Booking calendar"
          description="Click an empty slot to add a booking; click an event to edit or delete it. Drag an event to another day or time, or drag its bottom edge to resize. The blue “Daily standup” is a recurring series — editing or dragging it asks how much of the series to change."
          divider
        >
          <div className="h-[640px]">
            <SmartCalendar
              ref={controlRef}
              {...calendarProps}
              events={events}
              defaultView="week"
              defaultDate={weekStart}
              minHour={7}
              maxHour={21}
              businessHours={businessHours}
              onSlotSelect={(slot) =>
                openCreate(slot.start, slot.end, slot.allDay)
              }
              toolbarExtra={
                <SmartButton
                  size="sm"
                  variant="outline"
                  onClick={() => openCreate(at(0, 12), at(0, 13))}
                >
                  <CalendarPlusIcon className="size-3.5" />
                  New booking
                </SmartButton>
              }
            />
          </div>
        </SmartPageSection>

        {/* ── Month + Day ──────────────────────────────────────────── */}
        <SmartPageSection
          title="Month & day views"
          description="Month collapses busy days into “+N more” and lets you drag a booking onto another day. Day is a single focused column with business-hours shading."
          divider
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <SmartCard
              header={{ title: "Month" }}
              size="sm"
              contentClassName="p-0"
            >
              <div className="h-[460px]">
                <SmartCalendar
                  {...calendarProps}
                  events={events}
                  defaultView="month"
                  defaultDate={weekStart}
                  views={["month"]}
                  onSlotSelect={(slot) =>
                    openCreate(slot.start, slot.end, slot.allDay)
                  }
                />
              </div>
            </SmartCard>

            <SmartCard
              header={{ title: "Day (9–18 business hours)" }}
              size="sm"
              contentClassName="p-0"
            >
              <div className="h-[460px]">
                <SmartCalendar
                  {...calendarProps}
                  events={events}
                  defaultView="day"
                  defaultDate={weekStart}
                  views={["day"]}
                  minHour={8}
                  maxHour={20}
                  businessHours={businessHours}
                />
              </div>
            </SmartCard>
          </div>
        </SmartPageSection>

        {/* ── Booking availability ─────────────────────────────────── */}
        <SmartPageSection
          title="Booking availability"
          description="Availability windows (Mon–Fri, 9–17) render as pickable 30-minute slots. Slots covered by an event disappear; click a free slot to open a prefilled booking."
          divider
        >
          <SmartCard size="sm" contentClassName="p-0">
            <div className="h-[520px]">
              <SmartCalendar
                events={events}
                defaultView="week"
                defaultDate={weekStart}
                weekStartsOn={1}
                views={["week", "day"]}
                minHour={8}
                maxHour={18}
                slotMinutes={30}
                availability={availability}
                onSlotBook={bookSlot}
                onEventClick={(ev) => openEdit(ev)}
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Agenda ───────────────────────────────────────────────── */}
        <SmartPageSection
          title="Agenda"
          description="A flat, scrollable schedule of the next 30 days — empty days omitted."
        >
          <SmartCard size="sm" contentClassName="p-0">
            <div className="h-[420px]">
              <SmartCalendar
                events={events}
                defaultView="agenda"
                defaultDate={weekStart}
                weekStartsOn={1}
                views={["agenda"]}
                hideToolbar
                onEventClick={(ev) => openEdit(ev)}
              />
            </div>
          </SmartCard>
        </SmartPageSection>
      </SmartPageContent>

      {/* ── Booking editor (create / edit / delete) ─────────────────── */}
      <SmartDialog
        open={editor != null}
        onOpenChange={(open) => !open && setEditor(null)}
        header={{
          title: editor?.mode === "create" ? "New booking" : "Edit booking",
          subtitle:
            editor?.event?.occurrence != null
              ? "Part of a recurring series"
              : undefined,
        }}
      >
        {editor && (
          <BookingForm
            draft={editor.draft}
            recurring={editor.event?.occurrence != null}
            onChange={(draft) =>
              setEditor((prev) => (prev ? { ...prev, draft } : prev))
            }
            onSave={saveEditor}
            onDelete={editor.mode === "edit" ? deleteFromEditor : undefined}
            onCancel={() => setEditor(null)}
          />
        )}
      </SmartDialog>

      {/* ── Recurring scope prompt ──────────────────────────────────── */}
      <SmartDialog
        open={pending != null}
        onOpenChange={(open) => !open && setPending(null)}
        header={{
          title:
            pending?.action === "delete"
              ? "Delete recurring event"
              : "Edit recurring event",
          subtitle: pending ? titleOf(pending.instance) : undefined,
        }}
      >
        {pending && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This is one occurrence of a repeating series. Apply to:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <SmartButton
                variant="outline"
                onClick={() => resolveScope("this")}
              >
                This event only
              </SmartButton>
              <SmartButton
                variant="outline"
                onClick={() => resolveScope("following")}
              >
                This and following events
              </SmartButton>
              <SmartButton
                variant={
                  pending.action === "delete" ? "destructive" : "default"
                }
                onClick={() => resolveScope("all")}
              >
                All events in the series
              </SmartButton>
            </div>
          </div>
        )}
      </SmartDialog>
    </SmartPage>
  )
}

// ── Booking form (used inside the editor dialog) ──────────────────────────────

const BookingForm = ({
  draft,
  recurring,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  draft: Draft
  recurring: boolean
  onChange: (draft: Draft) => void
  onSave: () => void
  onDelete?: () => void
  onCancel: () => void
}) => {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    onChange({ ...draft, [key]: value })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSave()
      }}
    >
      {recurring && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <RepeatIcon className="size-3.5" />
          Recurring series — saving will ask which occurrences to change.
        </div>
      )}

      <SmartInput
        label="Title"
        value={draft.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Booking title"
      />

      <div className="grid grid-cols-2 gap-3">
        <SmartSelect
          label="Color"
          value={draft.color}
          onValueChange={(v) => v && set("color", v as CalendarEventColor)}
          options={colorOptions}
        />
        <SmartInput
          label="Location"
          value={draft.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Room, link…"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SmartInput
          label="Date"
          type="date"
          value={draft.date}
          onChange={(e) => set("date", e.target.value)}
        />
        <SmartInput
          label="Start"
          type="time"
          value={draft.start}
          onChange={(e) => set("start", e.target.value)}
          disabled={draft.allDay}
        />
        <SmartInput
          label="End"
          type="time"
          value={draft.end}
          onChange={(e) => set("end", e.target.value)}
          disabled={draft.allDay}
        />
      </div>

      <SmartSwitch
        label="All day"
        checked={draft.allDay}
        onCheckedChange={(checked) => set("allDay", checked === true)}
      />

      <div className="flex items-center justify-between pt-2">
        {onDelete ? (
          <SmartButton type="button" variant="destructive" onClick={onDelete}>
            Delete
          </SmartButton>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <SmartButton type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </SmartButton>
          <SmartButton type="submit">Save</SmartButton>
        </div>
      </div>
    </form>
  )
}

export default CalendarPage
