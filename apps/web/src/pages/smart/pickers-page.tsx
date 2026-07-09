import { useState } from "react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@imsaroj/smart-ui/smart-components/page"
import {
  SmartCalendar,
  type DateRange,
} from "@imsaroj/smart-ui/smart-components/smart-calendar"
import { SmartDatePicker } from "@imsaroj/smart-ui/smart-components/smart-date-picker"
import {
  SmartTimePicker,
  SmartDateTimePicker,
} from "@imsaroj/smart-ui/smart-components/smart-time-picker"
import { SmartCombobox } from "@imsaroj/smart-ui/smart-components/smart-combobox"
import { SmartCard } from "@imsaroj/smart-ui/smart-components/smart-card"

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "vite", label: "Vite" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt.js" },
  { value: "svelte", label: "SvelteKit" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "SolidStart" },
]

const LANGUAGES = [
  { value: "ts", label: "TypeScript" },
  { value: "js", label: "JavaScript" },
  { value: "py", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "cs", label: "C#" },
  { value: "rb", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
]

const DATE_FORMATS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY (US)" },
  { value: "YYYY.MM.DD", label: "YYYY.MM.DD" },
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (EU)" },
  { value: "MMM D, YYYY", label: "MMM D, YYYY" },
  { value: "PPP", label: "PPP (long — default)" },
]

const GROUPED_TIMEZONES = [
  {
    label: "Asia",
    options: [
      { value: "Asia/Seoul", label: "Seoul (KST +9)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST +9)" },
      { value: "Asia/Shanghai", label: "Shanghai (CST +8)" },
      { value: "Asia/Singapore", label: "Singapore (SGT +8)" },
    ],
  },
  {
    label: "Americas",
    options: [
      { value: "America/New_York", label: "New York (EST -5)" },
      { value: "America/Chicago", label: "Chicago (CST -6)" },
      { value: "America/Los_Angeles", label: "Los Angeles (PST -8)" },
      { value: "America/Sao_Paulo", label: "São Paulo (BRT -3)" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "Europe/London", label: "London (GMT)" },
      { value: "Europe/Paris", label: "Paris (CET +1)" },
      { value: "Europe/Berlin", label: "Berlin (CET +1)" },
    ],
  },
]

const PickersPage = () => {
  const [singleDate, setSingleDate] = useState<Date | undefined>()
  const [multiDates, setMultiDates] = useState<Date[] | undefined>()
  const [range, setRange] = useState<DateRange | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [shiftDate, setShiftDate] = useState<Date | undefined>()
  const [prevOnlyDate, setPrevOnlyDate] = useState<Date | undefined>()
  const [nextOnlyDate, setNextOnlyDate] = useState<Date | undefined>()
  // Shared across every format card so one pick shows the same day rendered
  // in every pattern at once.
  const [formatDate, setFormatDate] = useState<Date | undefined>(
    () => new Date()
  )
  const [pickedFormat, setPickedFormat] = useState("YYYY-MM-DD")
  const [dropdownDate, setDropdownDate] = useState<Date | undefined>()
  const [monthsOnlyDate, setMonthsOnlyDate] = useState<Date | undefined>()
  const [yearsOnlyDate, setYearsOnlyDate] = useState<Date | undefined>()
  const [localDate, setLocalDate] = useState<Date | undefined>()
  const [utcDate, setUtcDate] = useState<Date | undefined>()
  const [framework, setFramework] = useState("")
  const [language, setLanguage] = useState("")
  const [timezone, setTimezone] = useState("")
  const [stack, setStack] = useState<string[]>([])
  const [time, setTime] = useState("")
  const [time12, setTime12] = useState("")
  const [meetingAt, setMeetingAt] = useState<Date | undefined>()

  return (
    <SmartPage
      layout="detail"
      title="Pickers"
      description="SmartCalendar, SmartDatePicker, and SmartCombobox — interactive selection controls."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Calendars ─────────────────────────────────────────── */}
        <SmartPageSection
          title="SmartCalendar"
          description="Inline calendar — always visible. Best for standalone date selection panels."
          divider
        >
          <div className="flex flex-wrap gap-6">
            <SmartCard
              header={{
                title: "Single date",
                subtitle: "Click a day to select it.",
              }}
              size="sm"
            >
              <div className="p-1">
                <SmartCalendar selected={singleDate} onSelect={setSingleDate} />
              </div>
              {singleDate && (
                <p className="px-3 pb-3 text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {singleDate.toLocaleDateString()}
                  </span>
                </p>
              )}
            </SmartCard>

            <SmartCard
              header={{
                title: "Multiple selection",
                subtitle: "Pick several independent dates.",
              }}
              size="sm"
            >
              <div className="p-1">
                <SmartCalendar
                  mode="multiple"
                  selected={multiDates}
                  onSelect={setMultiDates}
                />
              </div>
              {multiDates && multiDates.length > 0 && (
                <p className="px-3 pb-3 text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {multiDates.length} date
                    {multiDates.length === 1 ? "" : "s"}
                  </span>
                </p>
              )}
            </SmartCard>

            <SmartCard
              header={{
                title: "Range selection",
                subtitle: "Pick a start and end date.",
              }}
              size="sm"
            >
              <div className="p-1">
                <SmartCalendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                />
              </div>
              {range?.from && (
                <p className="px-3 pb-3 text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {range.from.toLocaleDateString()}
                    {range.to ? ` – ${range.to.toLocaleDateString()}` : ""}
                  </span>
                </p>
              )}
            </SmartCard>
          </div>
        </SmartPageSection>

        {/* ── DatePicker ────────────────────────────────────────── */}
        <SmartPageSection
          title="SmartDatePicker"
          description="Popover-based date picker — ideal in forms where space is limited."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartDatePicker
              label="Start date"
              selected={startDate}
              onSelect={setStartDate}
              required
            />
            <SmartDatePicker
              label="End date"
              description="Must be after start date."
              selected={endDate}
              onSelect={setEndDate}
              disabled={(d) => (startDate ? d < startDate : false)}
              optional
            />
            <SmartDatePicker
              label="Deadline"
              description="Cannot be in the past."
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartDatePicker
              label="Both steppers + today"
              description="−1 / +1 day buttons with a reset-to-today control."
              selected={shiftDate}
              onSelect={setShiftDate}
              steppers
              todayButton
            />
            <SmartDatePicker
              label="Previous day only"
              description={'steppers="prev" — front button only.'}
              selected={prevOnlyDate}
              onSelect={setPrevOnlyDate}
              steppers="prev"
            />
            <SmartDatePicker
              label="Next day only"
              description={'steppers="next" — back button only.'}
              selected={nextOnlyDate}
              onSelect={setNextOnlyDate}
              steppers="next"
            />
          </div>
        </SmartPageSection>

        {/* ── DatePicker display formats ────────────────────────── */}
        <SmartPageSection
          title="SmartDatePicker — display formats"
          description="The dateFormat prop controls how the chosen day is rendered in the trigger. Intuitive upper-case tokens (YYYY, DD) are normalized, so every card below shows the same date at once — pick a day in any one to update them all."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DATE_FORMATS.map((f) => (
              <SmartDatePicker
                key={f.value}
                label={f.label}
                selected={formatDate}
                onSelect={setFormatDate}
                dateFormat={f.value}
              />
            ))}
          </div>

          <div className="mt-6 grid items-start gap-4 sm:grid-cols-2">
            <SmartCombobox
              label="Live format switcher"
              description="Change the pattern applied to the picker beside it."
              options={DATE_FORMATS}
              value={pickedFormat}
              onValueChange={(v) => setPickedFormat(v || "YYYY-MM-DD")}
            />
            <SmartDatePicker
              label={`Rendered as “${pickedFormat}”`}
              selected={formatDate}
              onSelect={setFormatDate}
              dateFormat={pickedFormat}
            />
          </div>
        </SmartPageSection>

        {/* ── DatePicker month/year navigation ──────────────────── */}
        <SmartPageSection
          title="SmartDatePicker — month & year navigation"
          description="captionLayout swaps the static caption for dropdowns. Bound the year range with startMonth / endMonth."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartDatePicker
              label="Month + year dropdowns"
              description='captionLayout="dropdown"'
              selected={dropdownDate}
              onSelect={setDropdownDate}
              captionLayout="dropdown"
              startMonth={new Date(1970, 0)}
              endMonth={new Date(2035, 11)}
            />
            <SmartDatePicker
              label="Month dropdown only"
              description='captionLayout="dropdown-months"'
              selected={monthsOnlyDate}
              onSelect={setMonthsOnlyDate}
              captionLayout="dropdown-months"
            />
            <SmartDatePicker
              label="Year dropdown only"
              description='captionLayout="dropdown-years"'
              selected={yearsOnlyDate}
              onSelect={setYearsOnlyDate}
              captionLayout="dropdown-years"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(2030, 11)}
            />
          </div>
        </SmartPageSection>

        {/* ── DatePicker today source (time zone) ───────────────── */}
        <SmartPageSection
          title="SmartDatePicker — today source"
          description="timeZone decides which calendar day the today button / steppers resolve to. “local” reads the browser clock; “utc” reads the current UTC day (they differ around midnight)."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartDatePicker
              label="Local today"
              description='timeZone="local" (default)'
              selected={localDate}
              onSelect={setLocalDate}
              todayButton
              steppers
            />
            <SmartDatePicker
              label="UTC today"
              description='timeZone="utc"'
              selected={utcDate}
              onSelect={setUtcDate}
              todayButton
              steppers
              timeZone="utc"
            />
            <div className="flex flex-col justify-center gap-1 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <span>
                Browser now:{" "}
                <span className="font-medium text-foreground">
                  {new Date().toString()}
                </span>
              </span>
              <span>
                UTC now:{" "}
                <span className="font-medium text-foreground">
                  {new Date().toUTCString()}
                </span>
              </span>
            </div>
          </div>
        </SmartPageSection>

        {/* ── TimePicker ────────────────────────────────────────── */}
        <SmartPageSection
          title="SmartTimePicker"
          description="Popover time picker with hour / minute columns. Value is a 24-hour “HH:mm” string."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartTimePicker
              label="Time (24-hour)"
              value={time}
              onValueChange={setTime}
              required
            />
            <SmartTimePicker
              label="Time (12-hour)"
              description="AM/PM display — value stays 24-hour."
              value={time12}
              onValueChange={setTime12}
              use12Hour
            />
            <SmartTimePicker
              label="With seconds"
              description="15-minute steps + seconds column."
              value={time}
              onValueChange={setTime}
              withSeconds
              minuteStep={15}
              optional
            />
          </div>
        </SmartPageSection>

        {/* ── DateTimePicker ────────────────────────────────────── */}
        <SmartPageSection
          title="SmartDateTimePicker"
          description="Calendar + time columns in one popover — produces a single Date."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartDateTimePicker
              label="Meeting starts at"
              value={meetingAt}
              onValueChange={setMeetingAt}
              use12Hour
              minuteStep={5}
              required
            />
            {meetingAt && (
              <div className="flex items-center rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Selected:{" "}
                <span className="ml-1 font-medium text-foreground">
                  {meetingAt.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </SmartPageSection>

        {/* ── Combobox ─────────────────────────────────────────── */}
        <SmartPageSection
          title="SmartCombobox"
          description="Searchable select — type to filter the list."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartCombobox
              label="Framework"
              placeholder="Select framework…"
              searchPlaceholder="Search frameworks…"
              emptyText="No framework found."
              options={FRAMEWORKS}
              value={framework}
              onValueChange={setFramework}
              required
            />
            <SmartCombobox
              label="Language"
              placeholder="Select language…"
              searchPlaceholder="Search languages…"
              options={LANGUAGES}
              value={language}
              onValueChange={setLanguage}
              description="Primary programming language."
            />
            <SmartCombobox
              label="Timezone"
              placeholder="Select timezone…"
              searchPlaceholder="Search timezones…"
              options={GROUPED_TIMEZONES.flatMap((g) => g.options)}
              value={timezone}
              onValueChange={setTimezone}
              optional
            />
            <SmartCombobox
              multiple
              label="Tech stack"
              description="Pick several — selections show as removable chips."
              placeholder="Select frameworks…"
              searchPlaceholder="Search frameworks…"
              emptyText="No framework found."
              options={FRAMEWORKS}
              value={stack}
              onValueChange={setStack}
              maxSelected={4}
            />
          </div>
          {(framework || language) && (
            <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              Selected:{" "}
              {[
                framework &&
                  `Framework: ${FRAMEWORKS.find((f) => f.value === framework)?.label}`,
                language &&
                  `Language: ${LANGUAGES.find((l) => l.value === language)?.label}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default PickersPage
