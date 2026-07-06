import { useState } from "react"
import { z } from "zod"
import {
  SmartPage,
  SmartPageContent,
  SmartPageDescription,
  SmartPageHeader,
  SmartPageTitle,
} from "@workspace/ui/smart-components/page"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"
import { toast } from "@workspace/ui/smart-components/smart-toaster"
import { type FieldDefinition, SmartForm } from "@workspace/ui/form-engine"

/**
 * Exercises every field type the engine supports. Optional fields use
 * `.optional()` (or `.or(z.literal(""))` for text) so the form validates
 * without every control being filled in.
 */
const schema = z.object({
  // Text
  text: z.string().min(1, "Required"),
  textarea: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
  email: z.email("Invalid email").or(z.literal("")),
  tel: z.string().optional(),
  url: z.url("Invalid URL").or(z.literal("")),
  slug: z.string().optional(),
  richText: z.string().optional(),
  // Numeric
  integer: z.number().int().nullable(),
  decimal: z.number().nullable(),
  currency: z.number().min(0).nullable(),
  percentage: z.number().min(0).max(100).nullable(),
  // Date & time
  date: z.string().optional(),
  time: z.string().optional(),
  datetime: z.string().optional(),
  month: z.string().optional(),
  year: z.number().nullable(),
  dateRange: z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .optional(),
  timeRange: z
    .object({ start: z.string().optional(), end: z.string().optional() })
    .optional(),
  // Selection
  select: z.string().optional(),
  multiselect: z.array(z.string()),
  autocomplete: z.string().optional(),
  combobox: z.string().optional(),
  radio: z.string().optional(),
  checkbox: z.boolean(),
  checkboxGroup: z.array(z.string()),
  toggle: z.boolean(),
  yesno: z.boolean(),
})

type AllFields = z.infer<typeof schema>

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "vite", label: "Vite" },
  { value: "astro", label: "Astro" },
]

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

const fields: FieldDefinition<AllFields>[] = [
  // ── Text ────────────────────────────────────────────────────────────────
  { name: "text", type: "text", label: "Text", placeholder: "Plain text" },
  {
    name: "textarea",
    type: "textarea",
    label: "Textarea",
    placeholder: "Multiple lines…",
    rows: 3,
  },
  { name: "password", type: "password", label: "Password" },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "you@example.com",
  },
  { name: "tel", type: "tel", label: "Phone number" },
  {
    name: "url",
    type: "url",
    label: "URL",
    placeholder: "https://example.com",
  },
  {
    name: "slug",
    type: "slug",
    label: "Slug",
    description: "Auto-lowercased & hyphenated.",
  },
  {
    name: "richText",
    type: "text-editor",
    label: "Rich text",
    description: "Stored as HTML.",
    minHeight: "120px",
    colSpan: 2,
  },
  // ── Numeric ─────────────────────────────────────────────────────────────
  { name: "integer", type: "integer", label: "Integer", placeholder: "0" },
  {
    name: "decimal",
    type: "decimal",
    label: "Decimal",
    decimalScale: 2,
    placeholder: "0.00",
  },
  { name: "currency", type: "currency", label: "Currency" },
  { name: "percentage", type: "percentage", label: "Percentage" },
  // ── Date & time ─────────────────────────────────────────────────────────
  { name: "date", type: "date", label: "Date" },
  { name: "time", type: "time", label: "Time", use12Hour: true },
  { name: "datetime", type: "datetime", label: "Date & time" },
  { name: "month", type: "month", label: "Month" },
  { name: "year", type: "year", label: "Year" },
  { name: "dateRange", type: "daterange", label: "Date range", colSpan: 2 },
  { name: "timeRange", type: "timerange", label: "Time range", colSpan: 2 },
  // ── Selection ───────────────────────────────────────────────────────────
  { name: "select", type: "select", label: "Select", options: PLANS },
  {
    name: "multiselect",
    type: "multiselect",
    label: "Multi select",
    options: FRAMEWORKS,
  },
  {
    name: "autocomplete",
    type: "autocomplete",
    label: "Autocomplete",
    options: FRAMEWORKS,
    searchPlaceholder: "Type to filter…",
  },
  {
    name: "combobox",
    type: "combobox",
    label: "Combobox",
    options: FRAMEWORKS,
  },
  {
    name: "radio",
    type: "radio",
    label: "Radio group",
    options: PLANS,
    orientation: "horizontal",
  },
  {
    name: "checkbox",
    type: "checkbox",
    label: "Checkbox — I agree to the terms",
  },
  {
    name: "checkboxGroup",
    type: "checkbox-group",
    label: "Checkbox group",
    options: FRAMEWORKS,
    orientation: "horizontal",
    colSpan: 2,
  },
  { name: "toggle", type: "switch", label: "Toggle / switch" },
  { name: "yesno", type: "yesno", label: "Yes / No" },
]

const EMPTY: AllFields = {
  text: "",
  textarea: "",
  password: "",
  email: "",
  tel: "",
  url: "",
  slug: "",
  richText: "",
  integer: null,
  decimal: null,
  currency: null,
  percentage: null,
  date: "",
  time: "",
  datetime: "",
  month: "",
  year: null,
  dateRange: undefined,
  timeRange: undefined,
  select: "",
  multiselect: [],
  autocomplete: "",
  combobox: "",
  radio: "",
  checkbox: false,
  checkboxGroup: [],
  toggle: false,
  yesno: false,
}

const AllFieldsPage = () => {
  const [data, setData] = useState<AllFields>(EMPTY)

  return (
    <SmartPage layout="detail">
      <SmartPageHeader>
        <SmartPageTitle>All Field Types</SmartPageTitle>
        <SmartPageDescription>
          Every field type the engine supports — text, numeric, date &amp; time,
          and selection controls — driven by a single Zod schema.
        </SmartPageDescription>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" padding="md">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <SmartCard
            header={{
              title: "Every field type",
              subtitle: "One schema, one field-definition array.",
            }}
          >
            <SmartForm
              schema={schema}
              data={data}
              setData={setData}
              fields={fields}
              columns={2}
              submitLabel="Submit"
              resetLabel="Reset"
              onSubmit={(data: AllFields) => {
                console.log("Submitted:", data)
                toast.success("Valid! Check the live state panel.")
              }}
            />
          </SmartCard>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Live state
            </p>
            <pre className="max-h-[80vh] overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </SmartPageContent>
    </SmartPage>
  )
}

export default AllFieldsPage
