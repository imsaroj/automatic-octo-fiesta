"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox"
import { Label } from "@workspace/ui/components/label"

export interface ComboboxOption {
  value: string
  label: string
}

/** Field-level decoration shared by both single and multiple variants. */
interface SmartComboboxDecoration {
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

interface SmartComboboxBaseProps {
  options: ComboboxOption[]
  placeholder?: string
  /** Kept for API compatibility; the input itself filters in this variant. */
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

interface SmartComboboxSingleProps extends SmartComboboxBaseProps {
  multiple?: false
  value?: string
  onValueChange?: (value: string) => void
}

interface SmartComboboxMultipleProps extends SmartComboboxBaseProps {
  multiple: true
  value?: string[]
  onValueChange?: (value: string[]) => void
  /** Cap the number of selectable options. */
  maxSelected?: number
}

export type SmartComboboxProps = (
  | SmartComboboxSingleProps
  | SmartComboboxMultipleProps
) &
  SmartComboboxDecoration

/**
 * Combobox (searchable select) with optional field label, description, and
 * error message. Built on the Base UI Combobox primitives — type to filter;
 * the `multiple` variant shows selections as removable chips.
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
export const SmartCombobox = (props: SmartComboboxProps) => {
  const {
    label,
    description,
    error,
    required,
    optional,
    fieldClassName,
    options,
    placeholder = "Select option…",
    emptyText = "No option found.",
    disabled,
    className,
  } = props

  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const invalid = error != null

  // Items are the option values; the label lookup drives both the input
  // display and the built-in filter, so callers keep a string-based API.
  const items = React.useMemo(() => options.map((o) => o.value), [options])
  const labelOf = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]))
    return (value: string) => map.get(value) ?? value
  }, [options])

  const anchorRef = useComboboxAnchor()

  const list = (
    <ComboboxList>
      <ComboboxEmpty>{emptyText}</ComboboxEmpty>
      {options.map((option) => (
        <ComboboxItem key={option.value} value={option.value}>
          {option.label}
        </ComboboxItem>
      ))}
    </ComboboxList>
  )

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label htmlFor={id}>
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

      {props.multiple ? (
        <Combobox
          multiple
          items={items}
          value={props.value ?? []}
          disabled={disabled}
          itemToStringLabel={labelOf}
          onValueChange={(value) => {
            if (
              props.maxSelected != null &&
              value.length > props.maxSelected
            ) {
              return
            }
            props.onValueChange?.(value)
          }}
        >
          <ComboboxChips ref={anchorRef} className={cn("w-full", className)}>
            <ComboboxValue>
              {(selected: string[]) =>
                selected.map((value) => (
                  <ComboboxChip key={value}>{labelOf(value)}</ComboboxChip>
                ))
              }
            </ComboboxValue>
            <ComboboxChipsInput
              id={id}
              placeholder={placeholder}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              aria-describedby={hintId}
            />
          </ComboboxChips>
          <ComboboxContent anchor={anchorRef}>{list}</ComboboxContent>
        </Combobox>
      ) : (
        <Combobox
          items={items}
          value={props.value ?? null}
          disabled={disabled}
          itemToStringLabel={labelOf}
          onValueChange={(value) => props.onValueChange?.(value ?? "")}
        >
          <ComboboxInput
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            showClear={!!props.value}
            className={cn("w-full", className)}
            aria-invalid={invalid || undefined}
            aria-describedby={hintId}
          />
          <ComboboxContent>{list}</ComboboxContent>
        </Combobox>
      )}

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
