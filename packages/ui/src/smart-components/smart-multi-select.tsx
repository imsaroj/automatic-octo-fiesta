"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Button } from "@imsaroj/smart-ui/components/button"
import { Badge } from "@imsaroj/smart-ui/components/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@imsaroj/smart-ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@imsaroj/smart-ui/components/popover"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartMultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SmartMultiSelectProps {
  options: SmartMultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  maxSelected?: number
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
 * Multi-select with badge chips, search, and checkbox indicators.
 * Built on Command + Popover.
 *
 * ```tsx
 * <SmartMultiSelect
 *   label="Skills"
 *   options={skillOptions}
 *   value={skills}
 *   onValueChange={setSkills}
 * />
 * ```
 */
export const SmartMultiSelect = ({
  options,
  value = [],
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No options found.",
  maxSelected,
  disabled,
  className,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartMultiSelectProps) => {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  const toggle = (optValue: string) => {
    const isSelected = value.includes(optValue)
    if (isSelected) {
      onValueChange?.(value.filter((v) => v !== optValue))
    } else if (maxSelected != null && value.length >= maxSelected) {
      return
    } else {
      onValueChange?.([...value, optValue])
    }
  }

  const remove = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange?.(value.filter((v) => v !== optValue))
  }

  const selectedOpts = options.filter((o) => value.includes(o.value))

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
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={error != null ? true : undefined}
              aria-describedby={hintId}
              disabled={disabled}
              className={cn(
                "h-auto min-h-7 w-full flex-wrap justify-between gap-1 px-2 py-1 font-normal",
                className
              )}
            />
          }
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedOpts.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOpts.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-0.5 text-xs"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => remove(opt.value, e)}
                    className="ml-0.5 rounded-full hover:text-foreground focus-visible:outline-none"
                    aria-label={`Remove ${opt.label}`}
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" side="bottom" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const selected = value.includes(opt.value)
                  const atMax =
                    !selected &&
                    maxSelected != null &&
                    value.length >= maxSelected
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled || atMax}
                      onSelect={() => toggle(opt.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex size-3.5 items-center justify-center rounded-sm border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {selected && <Check className="size-2.5" />}
                      </div>
                      {opt.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
