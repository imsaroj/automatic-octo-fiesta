"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Button } from "@imsaroj/smart-ui/components/button"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartSegmentedOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SmartSegmentedProps {
  options: SmartSegmentedOption[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * Segmented control (connected button group) for single-value selection.
 *
 * ```tsx
 * <SmartSegmented
 *   label="Account type"
 *   options={[{ value: "personal", label: "Personal" }, { value: "business", label: "Business" }]}
 *   value={type}
 *   onValueChange={setType}
 * />
 * ```
 */
export const SmartSegmented = ({
  options,
  value,
  onValueChange,
  disabled,
  className,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartSegmentedProps) => {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

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
          {optional && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </Label>
      )}
      <div
        role="group"
        aria-describedby={hintId}
        className={cn("flex w-full", className)}
      >
        {options.map((opt, i) => (
          <Button
            key={opt.value}
            type="button"
            variant={value === opt.value ? "default" : "outline"}
            disabled={disabled || opt.disabled}
            onClick={() => onValueChange?.(opt.value)}
            className={cn(
              "flex-1 rounded-none focus:z-10",
              i === 0 && "rounded-l-md",
              i === options.length - 1 && "rounded-r-md",
              i > 0 && "-ml-px"
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
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
