/**
 * Page Example — Wizard layout
 *
 * `layout="wizard"` keeps the header AND footer pinned while the step content
 * scrolls between them. The footer hosts Back / Next so navigation is always
 * reachable. Used for onboarding, checkout and multi-step forms.
 */

import { useState } from "react"
import { Check } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
  SmartPageFooter,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@imsaroj/smart-ui/smart-components/smart-button"
import { SmartInput } from "@imsaroj/smart-ui/smart-components/smart-input"
import { SmartSwitch } from "@imsaroj/smart-ui/smart-components/smart-switch"
import { cn } from "@imsaroj/smart-ui/lib/utils"

const STEPS = [
  { id: "workspace", label: "Workspace", description: "Name your workspace." },
  { id: "team", label: "Team", description: "Invite your teammates." },
  { id: "plan", label: "Plan", description: "Pick a plan that fits." },
  { id: "review", label: "Review", description: "Confirm and finish." },
]

const StepRail = ({ current }: { current: number }) => (
  <nav aria-label="Progress" className="flex items-center gap-1">
    {STEPS.map((step, idx) => {
      const done = idx < current
      const active = idx === current
      return (
        <div key={step.id} className="flex items-center gap-1">
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              done && "bg-primary text-primary-foreground",
              active && "bg-background text-primary ring-2 ring-primary",
              !done && !active && "bg-muted text-muted-foreground"
            )}
          >
            {done ? <Check className="size-3.5" /> : idx + 1}
          </div>
          <span
            className={cn(
              "hidden text-xs sm:inline",
              active ? "font-medium" : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {idx < STEPS.length - 1 && (
            <div className="mx-1 h-px w-6 bg-border sm:w-10" />
          )}
        </div>
      )
    })}
  </nav>
)

const WizardLayoutPage = () => {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  return (
    <SmartPage
      layout="wizard"
      title="Create your workspace"
      description={STEPS[step].description}
      headerProps={{ children: <StepRail current={step} /> }}
    >
      <SmartPageContent maxWidth="xl" centered padding="md">
        {step === 0 && (
          <SmartPageSection title="Workspace">
            <SmartInput
              label="Workspace name"
              placeholder="Acme Inc."
              required
            />
            <SmartInput
              label="Workspace URL"
              placeholder="acme"
              description="Your team will live at acme.example.com"
            />
          </SmartPageSection>
        )}

        {step === 1 && (
          <SmartPageSection title="Invite your team">
            <SmartInput
              label="Email addresses"
              placeholder="teammate@acme.com"
              description="Separate multiple addresses with commas."
            />
            <div className="rounded-lg border p-3">
              <SmartSwitch
                label="Allow anyone to join"
                description="People with an @acme.com email can join automatically."
              />
            </div>
          </SmartPageSection>
        )}

        {step === 2 && (
          <SmartPageSection title="Choose a plan">
            <div className="grid gap-3 sm:grid-cols-2">
              {["Starter", "Pro"].map((plan, i) => (
                <label
                  key={plan}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border p-4",
                    i === 1 && "border-primary ring-1 ring-primary"
                  )}
                >
                  <span className="text-sm font-semibold">{plan}</span>
                  <span className="text-2xl font-bold">
                    ${i === 0 ? 0 : 29}
                    <span className="text-xs font-normal text-muted-foreground">
                      /mo
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </SmartPageSection>
        )}

        {step === 3 && (
          <SmartPageSection title="Review">
            <dl className="divide-y rounded-lg border text-sm">
              {[
                ["Workspace", "Acme Inc. (acme)"],
                ["Team", "3 invitations"],
                ["Plan", "Pro — $29/mo"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </SmartPageSection>
        )}
      </SmartPageContent>

      <SmartPageFooter justify="between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
        {isLast ? (
          <Button onClick={() => setStep(0)}>
            <Check /> Finish
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Next
          </Button>
        )}
      </SmartPageFooter>
    </SmartPage>
  )
}

export default WizardLayoutPage
