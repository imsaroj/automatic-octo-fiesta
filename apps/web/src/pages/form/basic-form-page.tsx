import { useState } from "react"
import { z } from "zod"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import { type FieldDefinition, SmartForm } from "@iamsaroj/smart-ui/form"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.email().optional().or(z.literal("")),
  subject: z.string().min(1, "Choose a subject"),
  priority: z.string().optional().or(z.literal("")),
  message: z.string().min(10, "Minimum 10 characters"),
  details: z.string(),
})

type ContactForm = z.infer<typeof contactSchema>
const EMPTY = Object.fromEntries(
  Object.keys(contactSchema.shape).map((k) => [k, ""])
) as ContactForm

const SUBJECT_OPTIONS = [
  { value: "general", label: "General question" },
  { value: "sales", label: "Sales" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
]

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
]

const fields: FieldDefinition<ContactForm>[] = [
  {
    name: "name",
    type: "text",
    label: "Your name",
    placeholder: "Ada Lovelace",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "ada@example.com",
  },
  {
    // Required → no blank row: there is no legal empty state to offer.
    name: "subject",
    type: "select",
    label: "Subject",
    options: SUBJECT_OPTIONS,
    required: true,
  },
  {
    // Optional → the list leads with a blank "Select" row that clears the
    // field again. Automatic; `emptyOption: false` opts out, and
    // `emptyOptionLabel` renames it (app-wide via SmartUIProvider's
    // `form.emptyOption` label).
    name: "priority",
    type: "select",
    label: "Priority",
    options: PRIORITY_OPTIONS,
    description: "Optional — pick “Select” again to clear it.",
  },
  {
    name: "message",
    type: "textarea",
    label: "Message",
    placeholder: "How can we help?",
    description: "Minimum 10 characters.",
    rows: 4,
    required: true,
  },
  {
    name: "details",
    type: "text-editor",
    label: "Additional details",
    placeholder: "Add formatted context, links, or lists…",
    description: "Rich text — stored as HTML.",
    minHeight: "140px",
    required: true,
  },
]

const BasicFormPage = () => {
  const [data, setData] = useState<ContactForm>(EMPTY)

  return (
    <SmartPage
      layout="detail"
      title="Basic Form"
      description="SmartForm with a Zod schema — automatic validation, inline errors, and field definitions instead of hand-wired JSX."
    >
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

export default BasicFormPage
