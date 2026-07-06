import { useState } from "react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageDescription,
  SmartPageHeader,
  SmartPageSection,
  SmartPageTitle,
} from "@workspace/ui/smart-components/page"
import { SmartInput } from "@workspace/ui/smart-components/smart-input"
import { SmartTextarea } from "@workspace/ui/smart-components/smart-textarea"
import { SmartPasswordInput } from "@workspace/ui/smart-components/smart-password-input"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"
import { SmartInputGroup } from "@workspace/ui/smart-components/smart-input-group"
import { SmartSelect } from "@workspace/ui/smart-components/smart-select"
import { SmartMultiSelect } from "@workspace/ui/smart-components/smart-multi-select"
import { SmartCombobox } from "@workspace/ui/smart-components/smart-combobox"
import { SmartRadioGroup } from "@workspace/ui/smart-components/smart-radio-group"
import { SmartCheckbox } from "@workspace/ui/smart-components/smart-checkbox"
import { SmartCheckboxGroup } from "@workspace/ui/smart-components/smart-checkbox-group"
import { SmartSwitch } from "@workspace/ui/smart-components/smart-switch"
import { SmartSegmented } from "@workspace/ui/smart-components/smart-segmented"
import { SmartDatePicker } from "@workspace/ui/smart-components/smart-date-picker"
import {
  SmartTimePicker,
  SmartDateTimePicker,
} from "@workspace/ui/smart-components/smart-time-picker"
import {
  SmartDateRangePicker,
  type DateRange,
} from "@workspace/ui/smart-components/smart-date-range-picker"
import {
  SmartTimeRangePicker,
  type TimeRange,
} from "@workspace/ui/smart-components/smart-time-range-picker"
import { SmartMonthPicker } from "@workspace/ui/smart-components/smart-month-picker"
import { SmartYearPicker } from "@workspace/ui/smart-components/smart-year-picker"
import { SmartTextEditor } from "@workspace/ui/lexical-text-editor"

const COUNTRIES = [
  { value: "kr", label: "South Korea" },
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "jp", label: "Japan" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
]

const SKILLS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "Solid" },
]

const TIMEZONES = [
  { value: "Asia/Seoul", label: "Seoul (KST +9)" },
  { value: "America/New_York", label: "New York (EST -5)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Berlin", label: "Berlin (CET +1)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST +9)" },
]

const PERMISSIONS = [
  { value: "read", label: "Read", description: "View records and reports." },
  { value: "write", label: "Write", description: "Create and edit records." },
  {
    value: "delete",
    label: "Delete",
    description: "Permanently remove records.",
  },
]

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const VIEW_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
]

const BasicTextFieldsPage = () => {
  // Basic text
  const [search, setSearch] = useState("")
  // Selection
  const [country, setCountry] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [framework, setFramework] = useState("")
  const [timezone, setTimezone] = useState("")
  const [permissions, setPermissions] = useState<string[]>(["read"])
  const [plan, setPlan] = useState("pro")
  const [view, setView] = useState("grid")
  // Date & time
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState("")
  const [dateTime, setDateTime] = useState<Date | undefined>()
  const [month, setMonth] = useState<Date | undefined>()
  const [year, setYear] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [timeRange, setTimeRange] = useState<TimeRange>({})
  // Boolean
  const [subscribed, setSubscribed] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [remote, setRemote] = useState("yes")
  // Rich text
  const [notes, setNotes] = useState("")

  return (
    <SmartPage layout="detail">
      <SmartPageHeader>
        <div>
          <SmartPageTitle>Basic Text Fields</SmartPageTitle>
          <SmartPageDescription>
            A catalogue of every field type — text, numeric, date &amp; time,
            selection, boolean, and rich text — each built from a Smart*
            wrapper.
          </SmartPageDescription>
        </div>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Basic text ──────────────────────────────────────────── */}
        <SmartPageSection
          title="Basic text fields"
          description="Text, textarea, password, search, email, phone, URL, and slug."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartInput label="Full name" placeholder="Jane Doe" required />
            <SmartInput
              label="Job title"
              placeholder="Product Designer"
              optional
            />
            <SmartTextarea
              label="Description"
              placeholder="Add a few notes…"
              description="Max 280 characters."
              rows={3}
              fieldClassName="sm:col-span-2"
            />
            <SmartPasswordInput
              label="Password"
              placeholder="••••••••"
              required
            />
            <SmartInput
              label="Email"
              type="email"
              placeholder="jane@example.com"
              required
            />
            <SmartInput
              label="Phone number"
              type="tel"
              placeholder="+82 10 1234 5678"
            />
            <SmartInput
              label="Website"
              type="url"
              placeholder="https://example.com"
            />
            <SmartInputGroup
              label="Slug"
              leadingText="/blog/"
              placeholder="my-first-post"
              description="Lowercase, hyphen-separated."
              fieldClassName="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <SmartSearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search…"
                aria-label="Search"
              />
            </div>
          </div>
        </SmartPageSection>

        {/* ── Numeric ─────────────────────────────────────────────── */}
        <SmartPageSection
          title="Numeric fields"
          description="Integer, decimal, currency, and percentage — via SmartInput and SmartInputGroup addons."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartInput
              label="Quantity (integer)"
              type="number"
              step={1}
              min={0}
              placeholder="0"
            />
            <SmartInput
              label="Weight (decimal)"
              type="number"
              step={0.01}
              placeholder="0.00"
            />
            <SmartInputGroup
              label="Price (currency)"
              leadingText="$"
              trailingText="USD"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
            />
            <SmartInputGroup
              label="Discount (percentage)"
              trailingText="%"
              type="number"
              min={0}
              max={100}
              placeholder="0"
            />
          </div>
        </SmartPageSection>

        {/* ── Date & time ─────────────────────────────────────────── */}
        <SmartPageSection
          title="Date & time fields"
          description="Date, time, datetime, month, year, date range, and time range."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SmartDatePicker
              label="Date"
              selected={date}
              onSelect={setDate}
              required
            />
            <SmartTimePicker
              label="Time"
              value={time}
              onValueChange={setTime}
              use12Hour
            />
            <SmartDateTimePicker
              label="Date & time"
              value={dateTime}
              onValueChange={setDateTime}
              use12Hour
              minuteStep={5}
            />
            <SmartMonthPicker
              label="Month"
              value={month}
              onValueChange={setMonth}
            />
            <SmartYearPicker
              label="Year"
              value={year}
              onValueChange={setYear}
            />
            <SmartDateRangePicker
              label="Date range"
              value={dateRange}
              onValueChange={setDateRange}
              fieldClassName="sm:col-span-2 lg:col-span-1"
            />
            <SmartTimeRangePicker
              label="Time range"
              value={timeRange}
              onValueChange={setTimeRange}
              use12Hour
              fieldClassName="sm:col-span-2"
            />
          </div>
        </SmartPageSection>

        {/* ── Selection ───────────────────────────────────────────── */}
        <SmartPageSection
          title="Selection fields"
          description="Select, multi-select, autocomplete, combobox, radio, checkbox group, and toggle."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartSelect
              label="Country (select)"
              placeholder="Select country…"
              options={COUNTRIES}
              value={country ?? undefined}
              onValueChange={setCountry}
              required
            />
            <SmartMultiSelect
              label="Skills (multi-select)"
              placeholder="Select skills…"
              options={SKILLS}
              value={skills}
              onValueChange={setSkills}
            />
            <SmartCombobox
              label="Framework (autocomplete)"
              placeholder="Type to search…"
              searchPlaceholder="Search frameworks…"
              emptyText="No match."
              options={SKILLS}
              value={framework}
              onValueChange={setFramework}
            />
            <SmartCombobox
              label="Timezone (combobox)"
              placeholder="Select timezone…"
              searchPlaceholder="Search timezones…"
              options={TIMEZONES}
              value={timezone}
              onValueChange={setTimezone}
            />
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <SmartRadioGroup
              label="Plan (radio group)"
              value={plan}
              onValueChange={setPlan}
              items={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro", description: "$12/mo" },
                { value: "team", label: "Team", description: "$49/mo" },
              ]}
            />
            <SmartCheckboxGroup
              label="Permissions (checkbox group)"
              items={PERMISSIONS}
              value={permissions}
              onValueChange={setPermissions}
            />
          </div>

          <div className="mt-4">
            <SmartSegmented
              label="View (toggle / segmented)"
              options={VIEW_OPTIONS}
              value={view}
              onValueChange={setView}
            />
          </div>
        </SmartPageSection>

        {/* ── Boolean ─────────────────────────────────────────────── */}
        <SmartPageSection
          title="Boolean fields"
          description="Checkbox, switch, and yes/no radio — three ways to capture a boolean."
          divider
        >
          <div className="flex flex-col gap-5">
            <SmartCheckbox
              label="Subscribe to newsletter"
              description="Weekly tips and product updates."
              checked={subscribed}
              onCheckedChange={setSubscribed}
            />
            <SmartSwitch
              label="Push notifications"
              description="Browser alerts for mentions and replies."
              checked={notifications}
              onCheckedChange={setNotifications}
            />
            <SmartRadioGroup
              label="Open to remote work?"
              orientation="horizontal"
              items={YES_NO}
              value={remote}
              onValueChange={setRemote}
            />
          </div>
        </SmartPageSection>

        {/* ── Rich text ───────────────────────────────────────────── */}
        <SmartPageSection
          title="Rich text editor"
          description="SmartTextEditor — Lexical-powered formatting, lists, links, and markdown shortcuts."
        >
          <SmartTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Start writing…"
            minHeight="160px"
          />
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default BasicTextFieldsPage
