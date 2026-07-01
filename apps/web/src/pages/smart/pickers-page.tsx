import { useState } from "react"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartCalendar } from "@workspace/ui/smart-components/smart-calendar"
import { SmartDatePicker } from "@workspace/ui/smart-components/smart-date-picker"
import { SmartCombobox } from "@workspace/ui/smart-components/smart-combobox"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"
import { Calendar } from "@workspace/ui/components/calendar"

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

export default function PickersPage() {
  const [singleDate, setSingleDate] = useState<Date | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [framework, setFramework] = useState("")
  const [language, setLanguage] = useState("")
  const [timezone, setTimezone] = useState("")

  return (
    <SmartPage layout="detail">
      <SmartPageHeader>
        <div>
          <SmartPageTitle>Pickers</SmartPageTitle>
          <SmartPageDescription>
            SmartCalendar, SmartDatePicker, and SmartCombobox — interactive
            selection controls.
          </SmartPageDescription>
        </div>
      </SmartPageHeader>

      <SmartPageContent maxWidth="4xl" padding="md">
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
                subtitle: "Pick several dates.",
              }}
              size="sm"
            >
              <div className="p-1">
                <Calendar mode="multiple" />
              </div>
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
