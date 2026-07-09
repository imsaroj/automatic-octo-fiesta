/**
 * Wizard Example Page
 *
 * Demonstrates the "wizard" layout:
 * - Header sticks at top (shows wizard title + step indicator)
 * - SmartPageContent is the scroll container (step content scrolls)
 * - SmartPageFooter is ALWAYS visible with Back/Next navigation
 * - No data ever disappears off-screen
 *
 * The "wizard" layout is explicitly set here since there's no single child
 * that uniquely triggers auto-detection of wizard vs. detail.
 */

import { useState } from "react"
import { Check } from "lucide-react"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { Input } from "@iamsaroj/smart-ui/smart-components/smart-input"
import { Label } from "@iamsaroj/smart-ui/smart-components/smart-label"
import { Switch } from "@iamsaroj/smart-ui/smart-components/smart-switch"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
  SmartPageFooter,
} from "@iamsaroj/smart-ui/smart-components/page"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

// ─── Step configuration ───────────────────────────────────────────────────────

const STEPS = [
  { id: "workspace", label: "Workspace" },
  { id: "team", label: "Team" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({
  steps,
  current,
}: {
  steps: typeof STEPS
  current: number
}) => (
  <nav aria-label="Setup progress" className="flex items-center gap-1">
    {steps.map((step, idx) => {
      const done = idx < current
      const active = idx === current
      return (
        <div key={step.id} className="flex items-center gap-1">
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
              done && "bg-primary text-primary-foreground",
              active && "bg-background text-primary ring-2 ring-primary",
              !done && !active && "bg-muted text-muted-foreground"
            )}
            aria-current={active ? "step" : undefined}
          >
            {done ? <Check className="size-3" /> : idx + 1}
          </div>
          <span
            className={cn(
              "hidden text-xs sm:block",
              active && "font-medium",
              !active && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "mx-1 h-px w-8 transition-colors",
                idx < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      )
    })}
  </nav>
)

// ─── Step views ───────────────────────────────────────────────────────────────

const WorkspaceStep = () => (
  <SmartPageContent maxWidth="md" centered padding="md">
    <SmartPageSection
      title="Create your workspace"
      description="A workspace is a shared space where your team collaborates."
      divider
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-name" className="text-xs">
            Workspace name
          </Label>
          <Input id="ws-name" placeholder="Acme Corp" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-slug" className="text-xs">
            URL slug
          </Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-xs text-muted-foreground">
              app.example.com/
            </span>
            <Input id="ws-slug" placeholder="acme" className="rounded-l-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-industry" className="text-xs">
            Industry
          </Label>
          <Input id="ws-industry" placeholder="Software / SaaS" />
        </div>
      </div>
    </SmartPageSection>
  </SmartPageContent>
)

const TeamStep = () => (
  <SmartPageContent maxWidth="md" centered padding="md">
    <SmartPageSection
      title="Invite your team"
      description="Add email addresses for team members. You can always do this later."
      divider
    >
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-2">
            <Input placeholder={`teammate${n}@example.com`} type="email" />
            <Button variant="outline" size="sm" className="shrink-0">
              Admin
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="w-fit">
          + Add another
        </Button>
      </div>
    </SmartPageSection>
  </SmartPageContent>
)

const PlanStep = () => {
  const [annual, setAnnual] = useState(false)

  return (
    <SmartPageContent maxWidth="lg" centered padding="md">
      <SmartPageSection title="Choose a plan" divider>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs">Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className="text-xs">
            Annual <Badge20 />
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              name: "Starter",
              price: annual ? 0 : 0,
              desc: "Perfect for small teams",
              features: ["5 members", "10GB storage", "Basic analytics"],
            },
            {
              name: "Pro",
              price: annual ? 15 : 19,
              desc: "For growing teams",
              features: [
                "Unlimited members",
                "100GB storage",
                "Advanced analytics",
                "SSO",
              ],
              popular: true,
            },
            {
              name: "Enterprise",
              price: null,
              desc: "Custom pricing for large orgs",
              features: [
                "Everything in Pro",
                "SLA",
                "Dedicated support",
                "Custom contracts",
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4",
                plan.popular && "border-primary ring-2 ring-primary/20"
              )}
            >
              {plan.popular && (
                <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">
                  Most popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.desc}</p>
              </div>
              <div className="text-2xl font-bold">
                {plan.price === null
                  ? "Custom"
                  : plan.price === 0
                    ? "Free"
                    : `$${plan.price}/mo`}
              </div>
              <ul className="flex flex-col gap-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Check className="size-3 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "default" : "outline"}
                size="sm"
                className="mt-auto"
              >
                {plan.price === null ? "Contact sales" : "Select"}
              </Button>
            </div>
          ))}
        </div>
      </SmartPageSection>
    </SmartPageContent>
  )
}

const Badge20 = () => (
  <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
    Save 20%
  </span>
)

const ReviewStep = () => (
  <SmartPageContent maxWidth="md" centered padding="md">
    <SmartPageSection
      title="Review & launch"
      description="Everything looks good. Click Launch to create your workspace."
      divider
    >
      <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
        {[
          { label: "Workspace", value: "Acme Corp" },
          { label: "URL", value: "app.example.com/acme" },
          { label: "Team size", value: "3 invites pending" },
          { label: "Plan", value: "Pro · $19/month" },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </SmartPageSection>
  </SmartPageContent>
)

// ─── Component ────────────────────────────────────────────────────────────────

const WizardExamplePage = () => {
  const [step, setStep] = useState(0)

  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const stepComponents = [
    <WorkspaceStep key="ws" />,
    <TeamStep key="team" />,
    <PlanStep key="plan" />,
    <ReviewStep key="review" />,
  ]

  return (
    <SmartPage
      layout="wizard"
      title="Set up your workspace"
      description={
        <>
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </>
      }
      actions={<StepIndicator steps={STEPS} current={step} />}
    >
      {/* ── Scrollable step content ─────────────────────────────────────────── */}
      {stepComponents[step]}

      {/* ── Footer: always visible navigation ──────────────────────────────── */}
      <SmartPageFooter justify="between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => s - 1)}
          disabled={isFirst}
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!isLast) setStep((s) => s + 1)
          }}
        >
          {isLast ? "Launch workspace" : "Continue"}
        </Button>
      </SmartPageFooter>
    </SmartPage>
  )
}

export default WizardExamplePage
