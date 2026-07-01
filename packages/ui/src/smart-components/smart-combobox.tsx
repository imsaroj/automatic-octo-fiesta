"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Label } from "@workspace/ui/components/label"

export type { ComboboxOption }

export interface SmartComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  /** Class applied to the trigger button. Defaults to full-width. */
  className?: string
  // Field-level decoration
  /** Field label rendered above the combobox. */
  label?: React.ReactNode
  /** Hint rendered below. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * Combobox (searchable select) with optional field label, description,
 * and error message. The trigger defaults to full-width.
 *
 * ```tsx
 * <SmartCombobox
 *   label="Framework"
 *   placeholder="Select framework…"
 *   value={value}
 *   onValueChange={setValue}
 *   options={[
 *     { value: "next",  label: "Next.js" },
 *     { value: "remix", label: "Remix" },
 *     { value: "vite",  label: "Vite" },
 *   ]}
 * />
 * ```
 */
export function SmartCombobox({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  className,
  disabled,
  ...comboboxProps
}: SmartComboboxProps) {
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
      <Combobox {...comboboxProps} className={cn("w-full", className)} />
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
