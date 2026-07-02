import { useState } from "react"
import { z } from "zod"
import {
  SmartPage,
  SmartPageContent,
  SmartPageDescription,
  SmartPageHeader,
  SmartPageSection,
  SmartPageTitle,
} from "@workspace/ui/smart-components/page"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"
import { toast } from "@workspace/ui/smart-components/smart-toaster"
import { type FieldDefinition, SmartForm } from "@workspace/ui/form-engine"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email").optional(),
  subject: z.string().min(1, "Choose a subject"),
  message: z.string(),
  details: z.string(),
})
type ContactForm = z.infer<typeof contactSchema>

const SUBJECT_OPTIONS = [
  { value: "general", label: "General question" },
  { value: "sales", label: "Sales" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
]

const fields: FieldDefinition<ContactForm>[] = [
  {
    name: "name",
    type: "text",
    label: "Your name",
    placeholder: "Ada Lovelace",
    colSpan: 1,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "ada@example.com",
  },
  {
    name: "subject",
    type: "select",
    label: "Subject",
    options: SUBJECT_OPTIONS,
  },
  {
    name: "message",
    type: "textarea",
    label: "Message",
    placeholder: "How can we help?",
    description: "Minimum 10 characters.",
    rows: 4,
  },
  {
    name: "details",
    type: "text-editor",
    label: "Additional details",
    placeholder: "Add formatted context, links, or lists…",
    description: "Rich text — stored as HTML.",
    minHeight: "140px",
  },
]

const EMPTY: ContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
  details: "",
}

export default function BasicFormPage() {
  const [data, setData] = useState<ContactForm>(EMPTY)

  return (
    <SmartPage layout="detail">
      <SmartPageHeader>
        <SmartPageTitle>Basic Form</SmartPageTitle>
        <SmartPageDescription>
          SmartForm with a Zod schema — automatic validation, inline errors, and
          field definitions instead of hand-wired JSX.
        </SmartPageDescription>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" padding="md">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <SmartCard
            header={{
              title: "Contact us",
              subtitle: "We'll get back to you within one business day.",
            }}
          >
            <SmartForm
              schema={contactSchema}
              data={data}
              setData={setData}
              fields={fields}
              submitLabel="Send message"
              resetLabel="Clear"
              onSubmit={(value) => {
                toast.success("Message sent!", {
                  description: `Thanks, ${value.name}!`,
                })
                setData(EMPTY)
              }}
            />
          </SmartCard>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Live state
            </p>
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>

        {/* Field-type showcase */}
        <SmartPageSection
          title="Field types at a glance"
          description="All supported field types rendered standalone — no schema needed."
          divider
        >
          {/*<FieldShowcase />*/}
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

// ── Quick showcase of every field type ─────────────────────────────────────────
/*
import { SmartInputField } from "@workspace/ui/components/input"
import { SmartPasswordField } from "@workspace/ui/form-engine"
import { SmartNumberField } from "@workspace/ui/form-engine"
import { SmartSelectField } from "@workspace/ui/form-engine"
import { SmartComboboxField } from "@workspace/ui/form-engine"
import { SmartMultiSelectField } from "@workspace/ui/form-engine"
import { SmartCheckboxField } from "@workspace/ui/form-engine"
import { SmartSwitchField } from "@workspace/ui/form-engine"
import { SmartRadioGroupField } from "@workspace/ui/form-engine"
import { SmartDateField } from "@workspace/ui/form-engine"
import { SmartSegmentedField } from "@workspace/ui/form-engine"
import { SmartTextEditor } from "@workspace/ui/lexical-text-editor"

function FieldShowcase() {
  const [text, setText] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [richText] = useState("")
  const [amount, setAmount] = useState<number | null>(null)
  const [country, setCountry] = useState("")
  const [framework, setFramework] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [agreed, setAgreed] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [plan, setPlan] = useState("free")
  const [dob, setDob] = useState("")
  const [size, setSize] = useState("md")

  const countryOpts = [
    { value: "kr", label: "South Korea" },
    { value: "us", label: "United States" },
    { value: "jp", label: "Japan" },
    { value: "de", label: "Germany" },
  ]
  const frameworkOpts = [
    { value: "next", label: "Next.js" },
    { value: "vite", label: "Vite" },
    { value: "remix", label: "Remix" },
  ]
  const skillOpts = [
    { value: "ts", label: "TypeScript" },
    { value: "react", label: "React" },
    { value: "node", label: "Node.js" },
    { value: "design", label: "Design" },
  ]
  const planOpts = [
    { value: "free", label: "Free", description: "3 projects" },
    { value: "pro", label: "Pro", description: "$12/mo" },
    { value: "team", label: "Team", description: "$49/mo" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SmartInputField
        label="Text"
        data={text}
        setData={setText}
        placeholder="Hello"
      />
      <SmartPasswordField
        label="Password"
        data={password}
        setData={setPassword}
      />
      <SmartNumberField
        label="Amount"
        data={amount}
        setData={setAmount}
        decimalScale={2}
        min={0}
        placeholder="0.00"
      />
      <SmartSelectField
        label="Country"
        data={country}
        setData={setCountry}
        options={countryOpts}
      />
      <SmartComboboxField
        label="Framework"
        data={framework}
        setData={setFramework}
        options={frameworkOpts}
      />
      <SmartDateField label="Date of birth" data={dob} setData={setDob} />
      <SmartMultiSelectField
        label="Skills"
        data={skills}
        setData={setSkills}
        options={skillOpts}
        className="sm:col-span-2 lg:col-span-1"
      />
      <SmartSegmentedField
        label="Size"
        data={size}
        setData={setSize}
        options={[
          { value: "sm", label: "SM" },
          { value: "md", label: "MD" },
          { value: "lg", label: "LG" },
        ]}
      />
      <SmartTextareaField
        label="Bio"
        data={bio}
        setData={setBio}
        placeholder="About you…"
        rows={2}
      />
      <SmartRadioGroupField
        label="Plan"
        data={plan}
        setData={setPlan}
        options={planOpts}
      />
      <SmartCheckboxField
        label="I agree to the terms"
        data={agreed}
        setData={setAgreed}
      />
      <SmartSwitchField
        label="Enable notifications"
        data={enabled}
        setData={setEnabled}
      />
      <SmartTextEditor
        label="Rich text"
        value={richText}
        placeholder="Bold, lists, links…"
        className="sm:col-span-2 lg:col-span-3"
      />
    </div>
  )
}
*/
