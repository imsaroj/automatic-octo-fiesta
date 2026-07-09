"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

export interface SmartStepperStep {
  label: string
  description?: string
}

export interface SmartStepperProps {
  steps: SmartStepperStep[]
  activeStep: number
  className?: string
}

/**
 * Horizontal step indicator for multi-step flows.
 *
 * ```tsx
 * <SmartStepper
 *   steps={[
 *     { label: "Account", description: "Credentials" },
 *     { label: "Profile", description: "About you" },
 *   ]}
 *   activeStep={0}
 * />
 * ```
 */
export const SmartStepper = ({
  steps,
  activeStep,
  className,
}: SmartStepperProps) => (
  <nav aria-label="Form progress" className={cn("flex items-start", className)}>
    {steps.map((step, idx) => {
      const done = idx < activeStep
      const active = idx === activeStep
      return (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                done && "bg-primary text-primary-foreground",
                active && "bg-background text-primary ring-2 ring-primary",
                !done && !active && "bg-muted text-muted-foreground"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3" /> : idx + 1}
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-[10px] font-medium",
                  !active && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="hidden text-[9px] text-muted-foreground sm:block">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 mt-3 h-px flex-1 shrink-0 transition-colors",
                idx < activeStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      )
    })}
  </nav>
)
