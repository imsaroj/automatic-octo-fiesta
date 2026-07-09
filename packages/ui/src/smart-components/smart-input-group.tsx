"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { withLeadingSpaceGuard } from "@imsaroj/smart-ui/lib/leading-space"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@imsaroj/smart-ui/components/input-group"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartInputGroupTrailingButton {
  icon: React.ReactNode
  onClick: () => void
  /** Accessible label for the button (required). */
  label: string
}

export interface SmartInputGroupProps extends React.ComponentProps<"input"> {
  /** SVG icon shown at the leading edge (left side). */
  leadingIcon?: React.ReactNode
  /** Text shown at the leading edge, e.g. `"https://"` or `"$"`. */
  leadingText?: string
  /** SVG icon shown at the trailing edge (right side). */
  trailingIcon?: React.ReactNode
  /** Text shown at the trailing edge, e.g. `".com"` or `"USD"`. */
  trailingText?: string
  /** Action button at the trailing edge (clear, submit, etc.). */
  trailingButton?: SmartInputGroupTrailingButton
  // Field-level decoration
  /** Field label rendered above the group. */
  label?: React.ReactNode
  /** Hint rendered below. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
  /**
   * By default the value may not *start* with whitespace: Space at the
   * beginning is ignored (including a held space bar) and pasted leading
   * spaces are stripped; spaces after the first character work normally.
   * Set to `true` to allow a leading space.
   */
  allowLeadingSpace?: boolean
}

/**
 * InputGroup with convenient leading/trailing addon props — no need to
 * manually compose `InputGroupAddon` / `InputGroupText` / `InputGroupButton`.
 *
 * ```tsx
 * // Icon left, clear button right
 * <SmartInputGroup
 *   leadingIcon={<Search />}
 *   placeholder="Search users…"
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   trailingButton={query ? { icon: <X />, onClick: () => setQuery(""), label: "Clear" } : undefined}
 * />
 *
 * // Text prefix + suffix
 * <SmartInputGroup
 *   label="Website"
 *   leadingText="https://"
 *   trailingText=".com"
 *   placeholder="mysite"
 * />
 * ```
 */
export const SmartInputGroup = ({
  leadingIcon,
  leadingText,
  trailingIcon,
  trailingText,
  trailingButton,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  id: idProp,
  className,
  "aria-invalid": ariaInvalid,
  allowLeadingSpace,
  onKeyDown,
  onChange,
  ...inputProps
}: SmartInputGroupProps) => {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const hasLeading = leadingIcon != null || leadingText != null
  const hasTrailing =
    trailingIcon != null || trailingText != null || trailingButton != null

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
      <InputGroup>
        {hasLeading && (
          <InputGroupAddon align="inline-start">
            {leadingIcon != null && (
              <span
                aria-hidden="true"
                className="[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5"
              >
                {leadingIcon}
              </span>
            )}
            {leadingText != null && (
              <InputGroupText>{leadingText}</InputGroupText>
            )}
          </InputGroupAddon>
        )}
        <InputGroupInput
          id={id}
          className={className}
          aria-describedby={hintId}
          aria-invalid={error != null ? true : ariaInvalid}
          {...inputProps}
          {...withLeadingSpaceGuard({ onKeyDown, onChange }, allowLeadingSpace)}
        />
        {hasTrailing && (
          <InputGroupAddon align="inline-end">
            {trailingText != null && (
              <InputGroupText>{trailingText}</InputGroupText>
            )}
            {trailingIcon != null && (
              <span
                aria-hidden="true"
                className="[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5"
              >
                {trailingIcon}
              </span>
            )}
            {trailingButton != null && (
              <InputGroupButton
                onClick={trailingButton.onClick}
                aria-label={trailingButton.label}
              >
                {trailingButton.icon}
              </InputGroupButton>
            )}
          </InputGroupAddon>
        )}
      </InputGroup>
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
