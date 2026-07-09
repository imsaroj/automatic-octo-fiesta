"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { withLeadingSpaceGuard } from "@iamsaroj/smart-ui/lib/leading-space"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@iamsaroj/smart-ui/components/input-group"
import { Label } from "@iamsaroj/smart-ui/components/label"

export interface SmartPasswordInputProps extends Omit<
  React.ComponentProps<"input">,
  "type"
> {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
  /**
   * By default the value may not *start* with whitespace: Space at the
   * beginning is ignored (including a held space bar) and pasted leading
   * spaces are stripped; spaces after the first character work normally.
   * Set to `true` if leading spaces are legal in your passwords.
   */
  allowLeadingSpace?: boolean
}

/**
 * Password input with a show/hide toggle button.
 *
 * ```tsx
 * <SmartPasswordInput
 *   label="Password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   required
 *   error={passwordError}
 * />
 * ```
 */
export const SmartPasswordInput = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  className,
  id: idProp,
  disabled,
  allowLeadingSpace,
  onKeyDown,
  onChange,
  ...inputProps
}: SmartPasswordInputProps) => {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const [show, setShow] = React.useState(false)
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

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
      <InputGroup data-disabled={disabled ? "true" : undefined}>
        <InputGroupInput
          id={id}
          type={show ? "text" : "password"}
          disabled={disabled}
          aria-describedby={hintId}
          aria-invalid={error != null ? true : undefined}
          className={className}
          {...inputProps}
          {...withLeadingSpaceGuard({ onKeyDown, onChange }, allowLeadingSpace)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            disabled={disabled}
          >
            {show ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
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
