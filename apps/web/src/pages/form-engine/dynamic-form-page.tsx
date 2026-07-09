import { useState } from "react"
import { z } from "zod"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@imsaroj/smart-ui/smart-components/smart-card"
import { SmartForm, type FieldDefinition } from "@imsaroj/smart-ui/form-engine"
import { toast } from "@imsaroj/smart-ui/smart-components/smart-toaster"

const registrationSchema = z
  .object({
    accountType: z.string().min(1, "Select an account type"),
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    companyName: z.string().optional(),
    vatId: z.string().optional(),
    birthDate: z.string().optional(),
    newsletter: z.boolean(),
    frequency: z.string().optional(),
  })
  .refine((v) => v.accountType !== "business" || !!v.companyName?.trim(), {
    path: ["companyName"],
    message: "Company name is required for business accounts",
  })
  .refine((v) => !v.newsletter || !!v.frequency, {
    path: ["frequency"],
    message: "Choose how often you'd like to hear from us",
  })

type RegistrationForm = z.infer<typeof registrationSchema>

const ACCOUNT_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
]
const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

const fields: FieldDefinition<RegistrationForm>[] = [
  {
    name: "accountType",
    type: "segmented",
    label: "Account type",
    options: ACCOUNT_TYPES,
    colSpan: 2,
  },
  { name: "name", type: "text", label: "Full name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  {
    name: "companyName",
    type: "text",
    label: "Company name",
    hidden: (v) => v.accountType !== "business",
  },
  {
    name: "vatId",
    type: "text",
    label: "VAT / Tax ID",
    hidden: (v) => v.accountType !== "business",
  },
  {
    name: "birthDate",
    type: "date",
    label: "Date of birth",
    hidden: (v) => v.accountType !== "personal",
    colSpan: 2,
  },
  {
    name: "newsletter",
    type: "switch",
    label: "Subscribe to the newsletter",
    description: "Weekly tips, news, and exclusive offers.",
    colSpan: 2,
  },
  {
    name: "frequency",
    type: "select",
    label: "Email frequency",
    options: FREQUENCY_OPTIONS,
    hidden: (v) => !v.newsletter,
    colSpan: 2,
  },
]

const EMPTY: RegistrationForm = {
  accountType: "personal",
  name: "",
  email: "",
  companyName: "",
  vatId: "",
  birthDate: "",
  newsletter: false,
  frequency: "",
}

const DynamicFormPage = () => {
  const [data, setData] = useState<RegistrationForm>(EMPTY)

  return (
    <SmartPage
      layout="detail"
      title="Dynamic Form"
      description={
        <>
          Fields appear and disappear via{" "}
          <code className="font-mono text-xs">hidden</code> predicates.
          Conditional validation lives in the Zod schema via{" "}
          <code className="font-mono text-xs">.refine()</code>.
        </>
      }
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <SmartCard
            header={{
              title: "Registration",
              subtitle:
                "Switch account type or toggle the newsletter to watch fields appear.",
            }}
          >
            <SmartForm
              schema={registrationSchema}
              data={data}
              setData={setData}
              fields={fields}
              columns={2}
              submitLabel="Register"
              onSubmit={(value) => {
                toast.success("Registered!", {
                  description: `${value.accountType} account for ${value.name}`,
                })
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

        <SmartPageSection
          title="How it works"
          description="Key mechanics behind the dynamic form."
          divider
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              [
                "hidden predicate",
                "Each field definition accepts hidden: (data) => boolean. When true, the field is removed from the DOM and its value is not validated.",
              ],
              [
                "Zod .refine()",
                "Cross-field rules live in the schema. The refine path maps the error to the right field automatically.",
              ],
              [
                "Live validation",
                "After the first submit attempt, errors are re-evaluated on every keystroke so feedback is immediate.",
              ],
              [
                "Columns grid",
                "Pass columns={2} and colSpan={2} to build a two-column layout where full-width rows span both columns.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border p-3">
                <dt className="font-medium">{title}</dt>
                <dd className="mt-1 text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default DynamicFormPage
