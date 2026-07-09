"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Badge } from "@iamsaroj/smart-ui/components/badge"
import { Button } from "@iamsaroj/smart-ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@iamsaroj/smart-ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@iamsaroj/smart-ui/components/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxBaseProps {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /**
   * Accessible name for the trigger. A `role="combobox"` control derives its
   * name from a label, not its (value-bearing) content, so pass this whenever
   * there is no associated `<label>` — `SmartCombobox` fills it from a string
   * `label` automatically.
   */
  "aria-label"?: string
}

interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false
  value?: string
  onValueChange?: (value: string) => void
}

interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true
  value?: string[]
  onValueChange?: (value: string[]) => void
  /** Cap the number of selectable options. */
  maxSelected?: number
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps

export const Combobox = (props: ComboboxProps) => {
  const {
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    disabled,
    className,
    "aria-label": ariaLabel,
  } = props
  const [open, setOpen] = React.useState(false)

  const selectedValues = React.useMemo(
    () =>
      props.multiple
        ? new Set(props.value ?? [])
        : new Set(props.value ? [props.value] : []),
    [props.multiple, props.value]
  )

  const toggle = (optionValue: string) => {
    if (props.multiple) {
      const next = new Set(props.value ?? [])
      if (next.has(optionValue)) {
        next.delete(optionValue)
      } else {
        if (props.maxSelected != null && next.size >= props.maxSelected) {
          return
        }
        next.add(optionValue)
      }
      props.onValueChange?.([...next])
    } else {
      props.onValueChange?.(optionValue === props.value ? "" : optionValue)
      setOpen(false)
    }
  }

  const selectedOptions = options.filter((o) => selectedValues.has(o.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              "h-auto min-h-7 w-[200px] justify-between",
              className
            )}
          />
        }
      >
        {props.multiple ? (
          selectedOptions.length > 0 ? (
            <span className="flex flex-1 flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <Badge key={option.value} variant="secondary" className="gap-1">
                  {option.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${option.label}`}
                    className="rounded-sm hover:bg-foreground/10"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggle(option.value)
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )
        ) : (
          <span
            className={cn(!selectedOptions.length && "text-muted-foreground")}
          >
            {selectedOptions[0]?.label ?? placeholder}
          </span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
