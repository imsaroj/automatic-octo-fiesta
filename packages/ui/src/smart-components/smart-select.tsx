"use client"

import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@iamsaroj/smart-ui/components/select"
import { Label } from "@iamsaroj/smart-ui/components/label"
import { useSmartUILabels } from "@iamsaroj/smart-ui/smart-components/provider"

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
  /**
   * Controlled value. Pass `null` (not `undefined`) for "controlled with no
   * selection" — Base UI decides controlled-ness on first render (`undefined`
   * = uncontrolled) and warns if the value later flips to a string.
   */
  value?: string | null
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
  /**
   * Render a blank choice at the top of the list that clears the selection
   * (`onValueChange(null)`), the dropdown equivalent of `<option value="">`.
   *
   * Defaults to **`!required`**: an optional select can be emptied again after
   * a choice is made, a required one can't, so there is nothing to offer. Pass
   * `false` to suppress it on an optional select, or `true` to force it — but
   * note that forcing it on a required select hands the user a way to violate
   * the very constraint the asterisk advertises.
   */
  emptyOption?: boolean
  /**
   * Label for that blank choice. Defaults to the `form.emptyOption` provider
   * label (`"Select"`), so an app translates it once instead of per field.
   */
  emptyOptionLabel?: React.ReactNode
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
  emptyOption,
  emptyOptionLabel,
}: SmartSelectProps) => {
  const labels = useSmartUILabels()
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const isRequired = required ?? fieldRequired
  const showEmptyOption = emptyOption ?? !isRequired

  // Base UI's `Select.Value` resolves the trigger label from the Root's `items`
  // map — without it, a selected value is stringified to its raw key (e.g. the
  // trigger shows `true`/`3` instead of `Active`/the role name). Flatten every
  // option (grouped or not) into the `{ value, label }` list it expects so the
  // selected label always shows. See Base UI Select `items` prop.
  const items = React.useMemo(
    () =>
      (groups ? groups.flatMap((group) => group.options) : (options ?? [])).map(
        ({ value, label }) => ({ value, label })
      ),
    [options, groups]
  )

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
        items={items}
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
          {/* `value={null}` is Base UI's no-selection sentinel: picking it
              fires `onValueChange(null)` and the trigger falls back to its
              placeholder. Deliberately kept out of `items` above — listing it
              there would make the trigger render this label instead of the
              placeholder once chosen. Wrapped in a group only when the rest of
              the list is grouped, so its padding matches its neighbours. */}
          {showEmptyOption &&
            (groups ? (
              <SelectGroup>
                <SelectItem value={null} className="text-muted-foreground">
                  {emptyOptionLabel ?? labels.form.emptyOption}
                </SelectItem>
              </SelectGroup>
            ) : (
              <SelectItem value={null} className="text-muted-foreground">
                {emptyOptionLabel ?? labels.form.emptyOption}
              </SelectItem>
            ))}
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
