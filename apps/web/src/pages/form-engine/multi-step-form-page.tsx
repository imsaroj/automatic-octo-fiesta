import { useState } from "react"
import { z } from "zod"
import { CheckCircle2 } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@imsaroj/smart-ui/smart-components/smart-card"
import { SmartButton } from "@imsaroj/smart-ui/smart-components/smart-button"
import { SmartStepper } from "@imsaroj/smart-ui/smart-components/smart-stepper"
import { SmartForm, type FieldDefinition } from "@imsaroj/smart-ui/form-engine"
import { toast } from "@imsaroj/smart-ui/smart-components/smart-toaster"

// ── Step schemas ──────────────────────────────────────────────────────────────

const accountSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
type Account = z.infer<typeof accountSchema>

const profileSchema = z.object({
  role: z.string().min(1, "Select a role"),
  skills: z.array(z.string()).min(1, "Pick at least one skill"),
  startDate: z.string().min(1, "Choose a start date"),
})
type Profile = z.infer<typeof profileSchema>

const prefsSchema = z.object({
  plan: z.string().min(1, "Choose a plan"),
  notifications: z.boolean(),
  terms: z.boolean().refine((v) => v, "You must accept the terms"),
})
type Prefs = z.infer<typeof prefsSchema>

// ── Options ───────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "engineer", label: "Engineer" },
  { value: "designer", label: "Designer" },
  { value: "pm", label: "Product Manager" },
]
const SKILL_OPTIONS = [
  { value: "ts", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "design", label: "Design" },
  { value: "data", label: "Data Science" },
]
const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

// ── Field definitions ─────────────────────────────────────────────────────────

const accountFields: FieldDefinition<Account>[] = [
  {
    name: "fullName",
    type: "text",
    label: "Full name",
    required: true,
    colSpan: 2,
  },
  { name: "email", type: "email", label: "Email", required: true, colSpan: 2 },
  { name: "password", type: "password", label: "Password", required: true },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm password",
    required: true,
  },
]

const profileFields: FieldDefinition<Profile>[] = [
  {
    name: "role",
    type: "combobox",
    label: "Role",
    options: ROLE_OPTIONS,
    required: true,
  },
  { name: "startDate", type: "date", label: "Start date", required: true },
  {
    name: "skills",
    type: "multiselect",
    label: "Skills",
    options: SKILL_OPTIONS,
    description: "Select all that apply.",
    required: true,
    colSpan: 2,
  },
]

const prefsFields: FieldDefinition<Prefs>[] = [
  {
    name: "plan",
    type: "segmented",
    label: "Plan",
    options: PLAN_OPTIONS,
    required: true,
    colSpan: 2,
  },
  {
    name: "notifications",
    type: "switch",
    label: "Email notifications",
    description: "Weekly digest and important updates.",
    colSpan: 2,
  },
  {
    name: "terms",
    type: "checkbox",
    label: "I accept the terms and conditions",
    required: true,
    colSpan: 2,
  },
]

// ── Stepper config ────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Account", description: "Credentials" },
  { label: "Profile", description: "About you" },
  { label: "Preferences", description: "Plan & opt-ins" },
  { label: "Review", description: "Confirm" },
]

// ── Step nav buttons ──────────────────────────────────────────────────────────

const StepNav = ({
  onBack,
  nextLabel,
}: {
  onBack?: () => void
  nextLabel: string
}) => (
  <div className="flex items-center justify-between pt-2">
    <SmartButton
      type="button"
      variant="ghost"
      disabled={!onBack}
      onClick={onBack}
    >
      Back
    </SmartButton>
    <SmartButton type="submit">{nextLabel}</SmartButton>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────

const MultiStepFormPage = () => {
  const [step, setStep] = useState(0)
  const [account, setAccount] = useState<Account>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [profile, setProfile] = useState<Profile>({
    role: "",
    skills: [],
    startDate: "",
  })
  const [prefs, setPrefs] = useState<Prefs>({
    plan: "pro",
    notifications: true,
    terms: false,
  })

  const roleLabel =
    ROLE_OPTIONS.find((o) => o.value === profile.role)?.label ?? "—"
  const skillLabels =
    SKILL_OPTIONS.filter((o) => profile.skills.includes(o.value))
      .map((o) => o.label)
      .join(", ") || "—"
  const planLabel =
    PLAN_OPTIONS.find((o) => o.value === prefs.plan)?.label ?? "—"

  const summary: [string, string][] = [
    ["Name", account.fullName || "—"],
    ["Email", account.email || "—"],
    ["Role", roleLabel],
    ["Skills", skillLabels],
    ["Start date", profile.startDate || "—"],
    ["Plan", planLabel],
    ["Notifications", prefs.notifications ? "On" : "Off"],
  ]

  return (
    <SmartPage
      layout="detail"
      title="Multi-Step Form"
      description="A wizard built with SmartStepper + per-step SmartForms. Each step validates independently before advancing."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        <SmartCard contentClassName="space-y-6">
          <div>
            <SmartStepper steps={STEPS} activeStep={step} />

            {step === 0 && (
              <SmartForm
                schema={accountSchema}
                data={account}
                setData={setAccount}
                fields={accountFields}
                columns={2}
                submitLabel={null}
                onSubmit={() => setStep(1)}
              >
                <StepNav nextLabel="Continue" />
              </SmartForm>
            )}

            {step === 1 && (
              <SmartForm
                schema={profileSchema}
                data={profile}
                setData={setProfile}
                fields={profileFields}
                columns={2}
                submitLabel={null}
                onSubmit={() => setStep(2)}
              >
                <StepNav onBack={() => setStep(0)} nextLabel="Continue" />
              </SmartForm>
            )}

            {step === 2 && (
              <SmartForm
                schema={prefsSchema}
                data={prefs}
                setData={setPrefs}
                fields={prefsFields}
                columns={2}
                submitLabel={null}
                onSubmit={() => setStep(3)}
              >
                <StepNav onBack={() => setStep(1)} nextLabel="Continue" />
              </SmartForm>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
                  {summary.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between pt-2">
                  <SmartButton
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </SmartButton>
                  <SmartButton
                    onClick={() => {
                      toast.success("Account created!", {
                        description: account.email,
                      })
                      setStep(0)
                      setAccount({
                        fullName: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                      })
                      setProfile({ role: "", skills: [], startDate: "" })
                      setPrefs({
                        plan: "pro",
                        notifications: true,
                        terms: false,
                      })
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    Create account
                  </SmartButton>
                </div>
              </div>
            )}
          </div>
        </SmartCard>
      </SmartPageContent>
    </SmartPage>
  )
}

export default MultiStepFormPage
