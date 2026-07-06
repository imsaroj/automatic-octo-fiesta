"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"

export interface SmartSelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SmartSelectGroup {
  label: string
  options: SmartSelectOption[]
}

export interface SmartSelectProps {
  /** Flat list of options. Mutually exclusive with `groups`. */
  options?: SmartSelectOption[]
  /** Grouped options with a section label. Mutually exclusive with `options`. */
  groups?: SmartSelectGroup[]
  value?: string
  onValueChange?: (value: string | null) => void
  defaultValue?: string
  name?: string
  disabled?: boolean
  required?: boolean
  /** Placeholder text shown when no value is selected. */
  placeholder?: string
  size?: "default" | "sm"
  /** Class applied to the SelectTrigger element. */
  triggerClassName?: string
  // Field-level decoration
  /** Field label rendered above the trigger. */
  label?: React.ReactNode
  /** Hint rendered below the trigger. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  fieldRequired?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * Data-driven Select with optional field label, description, and error.
 *
 * ```tsx
 * // Before
 * <Select value={role} onValueChange={setRole}>
 *   <SelectTrigger className="w-full"><SelectValue placeholder="Choose role" /></SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="admin">Admin</SelectItem>
 *     <SelectItem value="editor">Editor</SelectItem>
 *     <SelectItem value="viewer">Viewer</SelectItem>
 *   </SelectContent>
 * </Select>
 *
 * // After
 * <SmartSelect
 *   label="Role"
 *   placeholder="Choose role"
 *   value={role}
 *   onValueChange={setRole}
 *   options={[
 *     { value: "admin",  label: "Admin" },
 *     { value: "editor", label: "Editor" },
 *     { value: "viewer", label: "Viewer" },
 *   ]}
 * />
 * ```
 */
export const SmartSelect = ({
  options,
  groups,
  value,
  onValueChange,
  defaultValue,
  name,
  disabled,
  required,
  placeholder = "Select…",
  size = "default",
  triggerClassName,
  label,
  description,
  error,
  fieldRequired,
  optional,
  fieldClassName,
}: SmartSelectProps) => {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const isRequired = required ?? fieldRequired

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label htmlFor={id}>
          {label}
          {isRequired && (
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
      <Select
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        name={name}
        disabled={disabled}
        required={isRequired}
      >
        <SelectTrigger
          id={id}
          size={size}
          aria-describedby={hintId}
          aria-invalid={error != null ? true : undefined}
          className={cn("w-full", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {groups
            ? groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            : options?.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
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
