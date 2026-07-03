import { useState } from "react"
import { DollarSign, Globe } from "lucide-react"
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
import { SmartCheckbox } from "@workspace/ui/smart-components/smart-checkbox"
import { SmartSwitch } from "@workspace/ui/smart-components/smart-switch"
import { SmartRadioGroup } from "@workspace/ui/smart-components/smart-radio-group"
import { SmartSelect } from "@workspace/ui/smart-components/smart-select"
import { SmartNativeSelect } from "@workspace/ui/smart-components/smart-native-select"
import { SmartInputGroup } from "@workspace/ui/smart-components/smart-input-group"
import { SmartField } from "@workspace/ui/smart-components/smart-field"
import { SmartLabel } from "@workspace/ui/smart-components/smart-label"
import { SmartButton } from "@workspace/ui/smart-components/smart-button"
import { Separator } from "@workspace/ui/smart-components/smart-separator"

const COUNTRIES = [
  { value: "kr", label: "South Korea" },
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "jp", label: "Japan" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
]

const TIMEZONES = [
  { value: "Asia/Seoul", label: "Asia/Seoul (KST +9)" },
  { value: "America/New_York", label: "America/New_York (EST -5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST -8)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET +1)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST +9)" },
]

const PLAN_OPTIONS = [
  {
    value: "free",
    label: "Free",
    description: "Up to 3 projects, 1 GB storage.",
  },
  {
    value: "pro",
    label: "Pro — $12/mo",
    description: "Unlimited projects, 50 GB storage, priority support.",
  },
  {
    value: "team",
    label: "Team — $49/mo",
    description: "Everything in Pro plus SSO and audit logs.",
  },
]

export default function FormsPage() {
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  })
  const [plan, setPlan] = useState("pro")
  const [country, setCountry] = useState<string | null>(null)
  const [newsletter, setNewsletter] = useState(false)
  const [terms, setTerms] = useState(false)
  const [email, setEmail] = useState("")

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 2000)
  }

  const validateEmail = (v: string) => {
    setEmail(v)
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailError("Please enter a valid email address.")
    } else {
      setEmailError(undefined)
    }
  }

  return (
    <SmartPage layout="detail">
      <SmartPageHeader>
        <div>
          <SmartPageTitle>Form Controls</SmartPageTitle>
          <SmartPageDescription>
            SmartInput, SmartTextarea, SmartCheckbox, SmartSwitch,
            SmartRadioGroup, SmartSelect, SmartNativeSelect, SmartInputGroup,
            SmartField, SmartLabel — all in one realistic profile form.
          </SmartPageDescription>
        </div>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Profile ──────────────────────────────────────────────── */}
        <SmartPageSection
          title="Profile"
          description="Your public display name and contact details."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartInput
              label="First name"
              placeholder="Jane"
              required
              defaultValue="Saroj"
            />
            <SmartInput
              label="Last name"
              placeholder="Doe"
              required
              defaultValue="Kumar"
            />
            <SmartInput
              label="Email address"
              type="email"
              placeholder="jane@example.com"
              required
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              error={emailError}
              description="We'll never share your email."
              fieldClassName="sm:col-span-2"
            />
            <SmartTextarea
              label="Bio"
              placeholder="Tell us about yourself…"
              description="Max 160 characters."
              optional
              rows={3}
              fieldClassName="sm:col-span-2"
            />
          </div>
        </SmartPageSection>

        {/* ── Website & pricing ──────────────────────────────────── */}
        <SmartPageSection
          title="Links & budget"
          description="Your website and monthly budget."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartInputGroup
              label="Website"
              leadingText="https://"
              trailingText=".com"
              placeholder="mysite"
              optional
            />
            <SmartInputGroup
              label="Monthly budget"
              leadingIcon={<DollarSign />}
              trailingText="USD"
              placeholder="0.00"
              type="number"
              min={0}
            />
            <SmartInputGroup
              label="Region"
              leadingIcon={<Globe />}
              placeholder="seoul.region.example.com"
              description="Closest server region to your users."
              fieldClassName="sm:col-span-2"
            />
          </div>
        </SmartPageSection>

        {/* ── SmartField (standalone wrapper) ──────────────────── */}
        <SmartPageSection
          title="SmartField + SmartLabel"
          description="Generic field wrapper — use when the built-in Smart* doesn't fit."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartField
              label="API key"
              description="Your secret key — never share this."
              required
            >
              <SmartInput type="password" placeholder="sk-…" />
            </SmartField>
            <div className="flex flex-col gap-1.5">
              <SmartLabel required>Custom field</SmartLabel>
              <SmartInput placeholder="Any native input here" />
            </div>
          </div>
        </SmartPageSection>

        {/* ── Location ─────────────────────────────────────────── */}
        <SmartPageSection
          title="Location"
          description="Choose your country and timezone."
          divider
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartSelect
              label="Country"
              placeholder="Select country…"
              options={COUNTRIES}
              value={country ?? undefined}
              onValueChange={(v) => setCountry(v)}
              required
            />
            <SmartNativeSelect
              label="Timezone"
              placeholder="Choose timezone…"
              options={TIMEZONES}
              optional
            />
          </div>
        </SmartPageSection>

        {/* ── Plan ────────────────────────────────────────────────── */}
        <SmartPageSection
          title="Subscription plan"
          description="You can change your plan at any time."
          divider
        >
          <SmartRadioGroup
            value={plan}
            onValueChange={setPlan}
            items={PLAN_OPTIONS}
          />
        </SmartPageSection>

        {/* ── Notifications ────────────────────────────────────── */}
        <SmartPageSection
          title="Notifications"
          description="Decide how you want to be notified."
          divider
        >
          <div className="flex flex-col gap-4">
            <SmartSwitch
              label="Email notifications"
              description="Receive a weekly digest and important updates."
              checked={notifications.email}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, email: v }))
              }
            />
            <Separator />
            <SmartSwitch
              label="Push notifications"
              description="Browser alerts for mentions and replies."
              checked={notifications.push}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, push: v }))
              }
            />
            <Separator />
            <SmartSwitch
              label="Marketing emails"
              description="Product news, promotions, and new feature announcements."
              checked={notifications.marketing}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, marketing: v }))
              }
            />
          </div>
        </SmartPageSection>

        {/* ── Consents ──────────────────────────────────────────── */}
        <SmartPageSection title="Consents" description="Required to continue.">
          <div className="flex flex-col gap-3">
            <SmartCheckbox
              label="Subscribe to newsletter"
              description="Weekly tips and updates. Unsubscribe any time."
              checked={newsletter}
              onCheckedChange={(v) => setNewsletter(v)}
            />
            <SmartCheckbox
              label={
                <>
                  I agree to the{" "}
                  <a href="#terms" className="text-primary underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#privacy" className="text-primary underline">
                    Privacy Policy
                  </a>
                </>
              }
              checked={terms}
              onCheckedChange={(v) => setTerms(v)}
              required
            />
          </div>
        </SmartPageSection>

        {/* ── Save ────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-2">
          <SmartButton variant="outline">Cancel</SmartButton>
          <SmartButton
            loading={saving}
            loadingText="Saving…"
            onClick={handleSave}
            disabled={!terms}
          >
            Save profile
          </SmartButton>
        </div>
      </SmartPageContent>
    </SmartPage>
  )
}
