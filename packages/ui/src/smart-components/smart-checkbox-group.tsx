"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"

export interface SmartCheckboxGroupOption {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

export interface SmartCheckboxGroupProps {
  /** Checkbox options rendered in order. */
  items: SmartCheckboxGroupOption[]
  /** Selected values (controlled). */
  value?: string[]
  onValueChange?: (value: string[]) => void
  defaultValue?: string[]
  name?: string
  disabled?: boolean
  /** "horizontal" lays items out in a row. @default "vertical" */
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
  optional?: boolean
  fieldClassName?: string
}

/**
 * Data-driven group of checkboxes producing a `string[]` of selected values.
 * Auto-wires `id`/`htmlFor` for every item. Use for "select all that apply"
 * fields where a single `SmartCheckbox` isn't enough.
 *
 * ```tsx
 * <SmartCheckboxGroup
 *   label="Notifications"
 *   value={channels}
 *   onValueChange={setChannels}
 *   items={[
 *     { value: "email", label: "Email" },
 *     { value: "sms",   label: "SMS", description: "Standard rates apply." },
 *   ]}
 * />
 * ```
 */
export const SmartCheckboxGroup = ({
  items,
  value,
  onValueChange,
  defaultValue,
  disabled,
  orientation = "vertical",
  className,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartCheckboxGroupProps) => {
  const groupId = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${groupId}-hint` : undefined

  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<string[]>(defaultValue ?? [])
  const selected = isControlled ? value : internal

  const toggle = (optionValue: string, checked: boolean) => {
    const next = checked
      ? [...selected, optionValue]
      : selected.filter((v) => v !== optionValue)
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
  }

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
          const itemDisabled = disabled || item.disabled
          return (
            <div key={item.value} className="flex items-start gap-2.5">
              <Checkbox
                id={itemId}
                checked={selected.includes(item.value)}
                onCheckedChange={(checked) => toggle(item.value, checked)}
                disabled={itemDisabled}
                aria-describedby={descId}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor={itemId}
                  className={cn(
                    "font-normal",
                    itemDisabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {item.label}
                </Label>
                {item.description != null && (
                  <p
                    id={descId}
                    className={cn(
                      "text-xs text-muted-foreground",
                      itemDisabled && "opacity-50"
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
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
