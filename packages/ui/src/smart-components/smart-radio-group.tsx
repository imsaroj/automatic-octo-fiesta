"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import {
  RadioGroup,
  RadioGroupItem,
} from "@imsaroj/smart-ui/components/radio-group"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartRadioOption {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

export interface SmartRadioGroupProps {
  /** Radio options rendered in order. */
  items: SmartRadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  name?: string
  disabled?: boolean
  /** "horizontal" stacks items in a row. @default "vertical" */
  orientation?: "horizontal" | "vertical"
  className?: string
  // Field-level decoration
  /** Field label rendered above the group. */
  label?: React.ReactNode
  /** Hint rendered below the group. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below the group instead of `description`. */
  error?: React.ReactNode
  required?: boolean
  fieldClassName?: string
}

/**
 * Data-driven RadioGroup with per-item labels and optional descriptions.
 * Auto-wires `id`/`htmlFor` for every item.
 *
 * ```tsx
 * // Before
 * <RadioGroup value={plan} onValueChange={setPlan}>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="free" id="plan-free" />
 *     <Label htmlFor="plan-free">Free</Label>
 *   </div>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="pro" id="plan-pro" />
 *     <Label htmlFor="plan-pro">Pro</Label>
 *   </div>
 * </RadioGroup>
 *
 * // After
 * <SmartRadioGroup
 *   label="Plan"
 *   value={plan}
 *   onValueChange={setPlan}
 *   items={[
 *     { value: "free", label: "Free" },
 *     { value: "pro",  label: "Pro", description: "$12/mo" },
 *   ]}
 * />
 * ```
 */
export const SmartRadioGroup = ({
  items,
  value,
  onValueChange,
  defaultValue,
  name,
  disabled,
  orientation = "vertical",
  className,
  label,
  description,
  error,
  required,
  fieldClassName,
}: SmartRadioGroupProps) => {
  const groupId = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${groupId}-hint` : undefined

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        name={name}
        disabled={disabled}
        aria-describedby={hintId}
        className={cn(
          orientation === "horizontal"
            ? "flex flex-row flex-wrap gap-4"
            : "flex flex-col gap-2",
          className
        )}
      >
        {items.map((item) => {
          const itemId = `${groupId}-${item.value}`
          const descId = item.description ? `${itemId}-desc` : undefined
          return (
            <div key={item.value} className="flex items-start gap-2">
              <RadioGroupItem
                value={item.value}
                id={itemId}
                disabled={item.disabled}
                aria-describedby={descId}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor={itemId}
                  className={cn(
                    "font-normal",
                    (disabled || item.disabled) &&
                      "cursor-not-allowed opacity-50"
                  )}
                >
                  {item.label}
                </Label>
                {item.description != null && (
                  <p
                    id={descId}
                    className={cn(
                      "text-xs text-muted-foreground",
                      (disabled || item.disabled) && "opacity-50"
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </RadioGroup>
      {hasHint && (
        <p
          id={hintId}
          className={cn(
            "text-xs",
            error != null ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
}
