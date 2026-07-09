import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Rocket,
  Zap,
} from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartBadge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import {
  SmartButton,
  SmartButton as Button,
} from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartAlert } from "@iamsaroj/smart-ui/smart-components/smart-alert"
import { SmartAccordion } from "@iamsaroj/smart-ui/smart-components/smart-accordion"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartSpinner } from "@iamsaroj/smart-ui/smart-components/spinner"
import { SmartLoadingOverlay } from "@iamsaroj/smart-ui/smart-components/loading-overlay"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import { Separator } from "@iamsaroj/smart-ui/smart-components/smart-separator"

const FAQ_ITEMS = [
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "You are billed monthly on the date you first subscribed. You can upgrade, downgrade, or cancel at any time from the Billing settings page.",
  },
  {
    value: "cancel",
    trigger: "Can I cancel my subscription?",
    content:
      "Yes, you can cancel at any time. Your plan remains active until the end of the current billing period, after which your account moves to the Free tier.",
  },
  {
    value: "data",
    trigger: "What happens to my data if I cancel?",
    content:
      "Your data is retained for 30 days after cancellation. You can export everything from Settings → Data export before your account is deactivated.",
  },
  {
    value: "team",
    trigger: "Can I share my account with my team?",
    content:
      "The Team plan supports unlimited seats with SSO. Each member signs in with their own credentials — accounts cannot be shared.",
  },
  {
    value: "security",
    trigger: "Is my data encrypted?",
    content:
      "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We hold SOC 2 Type II and ISO 27001 certifications.",
  },
]

const FeedbackPage = () => {
  const [tags, setTags] = useState(["React", "TypeScript", "Tailwind"])
  const [loadingCard, setLoadingCard] = useState(false)
  const [buttonStates, setButtonStates] = useState({
    save: false,
    upload: false,
    delete: false,
  })

  const simulateLoad = (key: keyof typeof buttonStates, ms = 2000) => {
    setButtonStates((s) => ({ ...s, [key]: true }))
    setTimeout(() => setButtonStates((s) => ({ ...s, [key]: false })), ms)
  }

  const simulateCardLoad = () => {
    setLoadingCard(true)
    setTimeout(() => setLoadingCard(false), 2500)
  }

  return (
    <SmartPage
      layout="detail"
      title="Feedback & Display"
      description="SmartBadge, SmartButton (loading), SmartAlert, SmartAccordion, SmartSpinner, SmartLoadingOverlay, and SmartToast."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── SmartBadge ─────────────────────────────────────── */}
        <SmartPageSection
          title="SmartBadge"
          description="Status dots, variant styling, and removable tags."
          divider
        >
          <div className="flex flex-col gap-5">
            {/* Status variants */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Status dots
              </p>
              <div className="flex flex-wrap gap-2">
                <SmartBadge variant="secondary" dot dotColor="green">
                  Active
                </SmartBadge>
                <SmartBadge variant="secondary" dot dotColor="yellow">
                  Pending
                </SmartBadge>
                <SmartBadge variant="secondary" dot dotColor="red">
                  Suspended
                </SmartBadge>
                <SmartBadge variant="secondary" dot dotColor="blue">
                  In review
                </SmartBadge>
                <SmartBadge variant="secondary" dot dotColor="gray">
                  Inactive
                </SmartBadge>
              </div>
            </div>

            {/* Badge variants */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Variants
              </p>
              <div className="flex flex-wrap gap-2">
                <SmartBadge>Default</SmartBadge>
                <SmartBadge variant="secondary">Secondary</SmartBadge>
                <SmartBadge variant="outline">Outline</SmartBadge>
                <SmartBadge variant="destructive">Destructive</SmartBadge>
              </div>
            </div>

            {/* Removable tags */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Removable tags
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <SmartBadge
                    key={tag}
                    variant="outline"
                    onRemove={() => setTags((t) => t.filter((x) => x !== tag))}
                    removeLabel={`Remove ${tag}`}
                  >
                    {tag}
                  </SmartBadge>
                ))}
                {tags.length === 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setTags(["React", "TypeScript", "Tailwind"])}
                  >
                    Reset tags
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SmartPageSection>

        {/* ── SmartButton loading ──────────────────────────── */}
        <SmartPageSection
          title="SmartButton — loading state"
          description="Spinner replaces the icon, button is disabled, label optionally swaps."
          divider
        >
          <div className="flex flex-wrap gap-3">
            <SmartButton
              loading={buttonStates.save}
              loadingText="Saving…"
              onClick={() => simulateLoad("save")}
            >
              <CheckCircle2 className="size-3.5" />
              Save changes
            </SmartButton>
            <SmartButton
              variant="outline"
              loading={buttonStates.upload}
              loadingText="Uploading…"
              onClick={() => simulateLoad("upload", 3000)}
            >
              <Rocket className="size-3.5" />
              Upload file
            </SmartButton>
            <SmartButton
              variant="destructive"
              loading={buttonStates.delete}
              onClick={() => simulateLoad("delete", 1500)}
            >
              Delete
            </SmartButton>
          </div>
        </SmartPageSection>

        {/* ── SmartAlert ───────────────────────────────────── */}
        <SmartPageSection
          title="SmartAlert"
          description="Inline banners for status, warnings, and errors."
          divider
        >
          <div className="flex flex-col gap-3">
            <SmartAlert
              icon={<CheckCircle2 />}
              title="Changes saved"
              description="Your profile has been updated successfully."
              action={
                <Button size="xs" variant="outline">
                  View
                </Button>
              }
            />
            <SmartAlert
              icon={<Info />}
              title="New features available"
              description="We've launched SmartCombobox and SmartDatePicker. Check the docs for details."
              action={
                <Button size="xs" variant="outline">
                  Learn more
                </Button>
              }
            />
            <SmartAlert
              icon={<AlertTriangle />}
              title="Storage almost full"
              description="You've used 92% of your 1 GB storage. Upgrade to Pro for 50 GB."
              action={
                <Button size="xs" variant="outline">
                  Upgrade
                </Button>
              }
            />
            <SmartAlert
              variant="destructive"
              icon={<AlertCircle />}
              title="Payment failed"
              description="Your card ending in 4242 was declined. Please update your payment method."
              action={
                <Button size="xs" variant="outline">
                  Update card
                </Button>
              }
            />
          </div>
        </SmartPageSection>

        {/* ── Toast ───────────────────────────────────────── */}
        <SmartPageSection
          title="SmartToast"
          description="Fire one-liner toasts from anywhere — no state needed."
          divider
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("Saved!", {
                  description: "Your changes have been applied.",
                })
              }
            >
              <CheckCircle2 className="size-3.5 text-green-500" />
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.error("Save failed", {
                  description: "Check your connection and try again.",
                })
              }
            >
              <AlertCircle className="size-3.5 text-destructive" />
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Did you know?", {
                  description: "You can press ⌘K to open the command palette.",
                })
              }
            >
              <Info className="size-3.5 text-blue-500" />
              Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.warning("Storage almost full", {
                  description: "92% of 1 GB used.",
                })
              }
            >
              <AlertTriangle className="size-3.5 text-yellow-500" />
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const p = new Promise<void>((res) => setTimeout(res, 2000))
                toast.promise(p, {
                  loading: "Deploying…",
                  success: "Deployed successfully!",
                  error: "Deployment failed.",
                })
              }}
            >
              <Zap className="size-3.5" />
              Promise toast
            </Button>
          </div>
        </SmartPageSection>

        {/* ── Spinner & LoadingOverlay ─────────────────────── */}
        <SmartPageSection
          title="SmartSpinner & SmartLoadingOverlay"
          description="Inline spinner and a content-dimming overlay."
          divider
        >
          <div className="flex flex-col gap-6">
            {/* Spinner sizes */}
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                SmartSpinner sizes
              </p>
              <div className="flex items-center gap-5">
                {[12, 16, 20, 28, 40].map((size) => (
                  <div
                    key={size}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <SmartSpinner size={size} />
                    <span className="text-[10px] text-muted-foreground">
                      {size}px
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* LoadingOverlay */}
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                SmartLoadingOverlay
              </p>
              <SmartLoadingOverlay
                loading={loadingCard}
                label="Refreshing data…"
              >
                <SmartCard
                  header={{
                    title: "Monthly revenue",
                    subtitle: "Last 30 days",
                    actions: (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={simulateCardLoad}
                        aria-label="Refresh"
                      >
                        <RefreshCw className="size-3.5" />
                      </Button>
                    ),
                  }}
                >
                  <div className="flex items-end gap-4">
                    <p className="text-3xl font-bold">$48,295</p>
                    <p className="mb-1 text-xs text-green-600">
                      ↑ 12.4% vs last month
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {[40, 65, 55, 80, 70, 90, 75, 95, 60, 85, 72, 88].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-primary/20"
                          style={{ height: h * 0.6 }}
                        />
                      )
                    )}
                  </div>
                </SmartCard>
              </SmartLoadingOverlay>
              <p className="mt-2 text-xs text-muted-foreground">
                Click <RefreshCw className="inline size-3 align-middle" /> to
                trigger the overlay.
              </p>
            </div>
          </div>
        </SmartPageSection>

        {/* ── SmartAccordion ───────────────────────────────── */}
        <SmartPageSection
          title="SmartAccordion"
          description="Data-driven accordion — pass items array, no repeated JSX."
        >
          <SmartCard>
            <SmartAccordion
              items={FAQ_ITEMS}
              defaultValue={["billing"]}
              multiple
            />
          </SmartCard>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default FeedbackPage
