import { useState } from "react"
import { z } from "zod"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartSegmented } from "@iamsaroj/smart-ui/smart-components/smart-segmented"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import { SmartForm, type FormNode } from "@iamsaroj/smart-ui/form"
import {
  SmartGridItem,
  SmartGridLayout,
  type GridColumnsValue,
  type Responsive,
} from "@iamsaroj/smart-ui/layout"

/**
 * The layout engine end to end: arbitrary column counts, fraction spans, nested
 * sections, intrinsic tracks, and the container-query behavior that makes all
 * of it collapse without a single breakpoint in the field definitions.
 *
 * Resize the browser *and* the width slider below — they are different things,
 * which is the whole point: the layout follows the box it was given.
 */

// ── The row-by-row layout from the brief ────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(1, "Required"),
  email: z.email("Enter a valid email"),
  street: z.string().min(1, "Required"),
  street2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  phone: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const EMPTY_PROFILE: ProfileForm = {
  fullName: "",
  email: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  phone: "",
  website: "",
  bio: "",
}

/**
 * Rows 1–4 full width, row 5 split in half, rows 6–8 full width again — with
 * auto-placement doing the row breaking, there are no row wrappers to maintain.
 */
const rowFields: FormNode<ProfileForm>[] = [
  {
    name: "fullName",
    type: "text",
    label: "Full name",
    span: "full",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    span: "full",
    required: true,
  },
  {
    name: "street",
    type: "text",
    label: "Street",
    span: "full",
    required: true,
  },
  { name: "street2", type: "text", label: "Street 2", span: "full" },
  { name: "city", type: "text", label: "City", span: "1/2", required: true },
  { name: "state", type: "text", label: "State", span: "1/2", required: true },
  { name: "phone", type: "tel", label: "Phone", span: "full" },
  { name: "website", type: "url", label: "Website", span: "full" },
  { name: "bio", type: "textarea", label: "Bio", span: "full", rows: 3 },
]

// ── Proportional splits on one 12-column grid ───────────────────────────────

const splitSchema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
  c: z.string().optional(),
  d: z.string().optional(),
  e: z.string().optional(),
  f: z.string().optional(),
  g: z.string().optional(),
  h: z.string().optional(),
  i: z.string().optional(),
  j: z.string().optional(),
  k: z.string().optional(),
  l: z.string().optional(),
  m: z.string().optional(),
  n: z.string().optional(),
})
type SplitForm = z.infer<typeof splitSchema>

const splitFields: FormNode<SplitForm>[] = [
  { name: "a", type: "text", label: "25%", span: "25%" },
  { name: "b", type: "text", label: "75%", span: "75%" },
  { name: "c", type: "text", label: "1/3", span: "1/3" },
  { name: "d", type: "text", label: "1/3", span: "1/3" },
  { name: "e", type: "text", label: "1/3", span: "1/3" },
  { name: "f", type: "text", label: "2 of 12", span: 2 },
  { name: "g", type: "text", label: "4 of 12", span: 4 },
  { name: "h", type: "text", label: "6 of 12", span: 6 },
  { name: "i", type: "text", label: "3", span: 3 },
  { name: "j", type: "text", label: "3", span: 3 },
  { name: "k", type: "text", label: "3", span: 3 },
  { name: "l", type: "text", label: "3", span: 3 },
  { name: "m", type: "text", label: "Pinned to col 7", span: 6, colStart: 7 },
  { name: "n", type: "text", label: "New row, 5 wide", span: 5, newRow: true },
]

// ── Nested sections, each with its own grid ─────────────────────────────────

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

const DIGEST_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "never", label: "Never" },
]

const accountSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.email("Enter a valid email"),
  company: z.string().optional(),
  vat: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  theme: z.string().optional(),
  digest: z.string().optional(),
  marketing: z.boolean().optional(),
})
type AccountForm = z.infer<typeof accountSchema>

const accountFields: FormNode<AccountForm>[] = [
  {
    kind: "section",
    id: "identity",
    title: "Identity",
    description: "Twelve columns — halves on this row, thirds on the next.",
    variant: "card",
    columns: 12,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Name",
        span: "1/2",
        required: true,
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        span: "1/2",
        required: true,
      },
      { name: "company", type: "text", label: "Company", span: "2/3" },
      { name: "vat", type: "text", label: "VAT ID", span: "1/3" },
    ],
  },
  {
    kind: "section",
    id: "address",
    title: "Address",
    description: "A different grid entirely: a wide street plus three equals.",
    variant: "card",
    columns: 6,
    collapsible: true,
    fields: [
      { name: "street", type: "text", label: "Street", span: "full" },
      { name: "city", type: "text", label: "City", span: 2 },
      { name: "zip", type: "text", label: "ZIP", span: 2 },
      { name: "country", type: "text", label: "Country", span: 2 },
    ],
  },
  { kind: "divider", id: "sep", label: "Preferences" },
  {
    kind: "section",
    id: "prefs",
    variant: "plain",
    columns: { auto: "fit", min: "14rem" },
    fields: [
      { name: "theme", type: "select", label: "Theme", options: THEME_OPTIONS },
      {
        name: "digest",
        type: "select",
        label: "Digest",
        options: DIGEST_OPTIONS,
      },
      { name: "marketing", type: "switch", label: "Marketing email" },
    ],
  },
  {
    kind: "custom",
    id: "summary",
    span: "full",
    render: ({ values }) => (
      <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        A <code>custom</code> node sees the live values —{" "}
        <strong>{values.name || "no name yet"}</strong>
        {values.company ? ` at ${values.company}` : ""}.
      </p>
    ),
  },
]

const EMPTY_ACCOUNT: AccountForm = {
  name: "",
  email: "",
  company: "",
  vat: "",
  street: "",
  city: "",
  zip: "",
  country: "",
  theme: "",
  digest: "",
  marketing: false,
}

const WIDTH_OPTIONS = [
  { value: "24rem", label: "24rem" },
  { value: "40rem", label: "40rem" },
  { value: "64rem", label: "64rem" },
  { value: "100%", label: "Full" },
]

const GRID_OPTIONS: { value: string; label: string }[] = [
  { value: "6", label: "6" },
  { value: "8", label: "8" },
  { value: "12", label: "12" },
  { value: "16", label: "16" },
  { value: "auto", label: "Auto-fit" },
]

const LayoutEnginePage = () => {
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE)
  const [account, setAccount] = useState<AccountForm>(EMPTY_ACCOUNT)
  const [width, setWidth] = useState("100%")
  const [grid, setGrid] = useState("12")

  const columns: Responsive<GridColumnsValue> =
    grid === "auto"
      ? { auto: "fit", min: "12rem" }
      : { base: 1, md: Number(grid) }

  return (
    <SmartPage
      layout="detail"
      title="Layout Engine"
      description="Container-query CSS Grid: any column count, fraction spans, nested sections — configured as data, not as class names."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        <SmartPageSection
          title="Rows without row wrappers"
          description="Full-width rows, one 50/50 row, then full width again. Auto-placement handles the row breaks; each field declares only its own width."
        >
          <SmartCard>
            <SmartForm
              schema={profileSchema}
              data={profile}
              setData={setProfile}
              fields={rowFields}
              columns={{ base: 1, md: 12 }}
              submitLabel="Save profile"
              onSubmit={() => {
                toast.success("Profile valid")
              }}
            />
          </SmartCard>
        </SmartPageSection>

        <SmartPageSection
          title="Every split on one grid"
          description="25/75, thirds, 2·4·6, four quarters, an explicitly pinned cell, and a forced new row — all against a single 12-column grid."
        >
          <SmartCard>
            <SmartForm
              schema={splitSchema}
              fields={splitFields}
              columns={{ base: 1, md: 12 }}
              gap="sm"
              submitLabel={null}
            />
          </SmartCard>
        </SmartPageSection>

        <SmartPageSection
          title="The container is the breakpoint"
          description="Narrow the box, not the window. The same form re-flows because it measures the space it was handed — which is why it is also correct inside a drawer or a split pane."
        >
          <div className="mb-4 flex flex-wrap items-center gap-6">
            <SmartSegmented
              label="Container"
              value={width}
              onValueChange={setWidth}
              options={WIDTH_OPTIONS}
            />
            <SmartSegmented
              label="Columns"
              value={grid}
              onValueChange={setGrid}
              options={GRID_OPTIONS}
            />
          </div>

          <div
            style={{ maxWidth: width }}
            className="rounded-lg border border-dashed p-4 transition-[max-width] duration-300"
          >
            <SmartForm
              schema={splitSchema}
              fields={splitFields}
              columns={columns}
              gap="sm"
              submitLabel={null}
            />
          </div>
        </SmartPageSection>

        <SmartPageSection
          title="Nested sections"
          description="Each section is its own grid — 12 columns, then 6, then intrinsic auto-fit tracks — inside one form, one schema, one submit."
        >
          <SmartForm
            schema={accountSchema}
            data={account}
            setData={setAccount}
            fields={accountFields}
            columns={12}
            gap="lg"
            submitLabel="Save account"
            onSubmit={() => {
              toast.success("Account valid")
            }}
          />
        </SmartPageSection>

        <SmartPageSection
          title="Standalone layout"
          description="The same engine outside the form engine — SmartGridLayout / SmartGridItem take the identical span vocabulary."
        >
          <SmartGridLayout columns={{ base: 2, md: 12 }} gap="sm">
            {[
              { label: "span 12", span: "full" as const },
              { label: "1/2", span: "1/2" as const },
              { label: "1/2", span: "1/2" as const },
              { label: "1/3", span: "1/3" as const },
              { label: "1/3", span: "1/3" as const },
              { label: "1/3", span: "1/3" as const },
              { label: "4", span: 4 },
              { label: "4", span: 4 },
              { label: "4", span: 4 },
            ].map((cell, index) => (
              <SmartGridItem key={index} span={cell.span}>
                <div className="rounded-md bg-muted px-2 py-3 text-center text-xs text-muted-foreground">
                  {cell.label}
                </div>
              </SmartGridItem>
            ))}
          </SmartGridLayout>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default LayoutEnginePage
