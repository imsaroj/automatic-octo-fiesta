"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import {
  Combobox,
  type ComboboxOption,
  type ComboboxProps,
} from "@imsaroj/smart-ui/components/combobox"
import { Label } from "@imsaroj/smart-ui/components/label"

export type { ComboboxOption }

/** Field-level decoration shared by both single and multiple variants. */
interface SmartComboboxFieldProps {
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

export type SmartComboboxProps = ComboboxProps & SmartComboboxFieldProps

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
export const SmartCombobox = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  className,
  ...comboboxProps
}: SmartComboboxProps) => {
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
      {/* Cast: destructuring the field props off the discriminated union
          erases the `multiple`↔`value` correlation TS needs to keep it. */}
      <Combobox
        {...(comboboxProps as ComboboxProps)}
        // A role="combobox" trigger needs an explicit name; default it from a
        // string label unless the caller passed one.
        aria-label={
          comboboxProps["aria-label"] ??
          (typeof label === "string" ? label : undefined)
        }
        className={cn("w-full", className)}
      />
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
