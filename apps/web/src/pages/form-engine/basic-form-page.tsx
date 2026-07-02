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
