"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"

export interface SmartSwitchProps extends Omit<
  React.ComponentProps<typeof Switch>,
  "id" | "aria-describedby"
> {
  /** Visible label rendered to the right of the switch. */
  label?: React.ReactNode
  /** Secondary hint rendered below the label. */
  description?: React.ReactNode
  /** Class applied to the outer wrapper div. */
  wrapperClassName?: string
}

/**
 * Switch with integrated label and optional description — auto-wired with a
 * shared `useId()`.
 *
 * ```tsx
 * // Before
 * <div className="flex items-center justify-between">
 *   <div>
 *     <Label htmlFor="notifications">Push notifications</Label>
 *     <p className="text-xs text-muted-foreground">Receive alerts on your device.</p>
 *   </div>
 *   <Switch id="notifications" />
 * </div>
 *
 * // After
 * <SmartSwitch
 *   label="Push notifications"
 *   description="Receive alerts on your device."
 * />
 * ```
 */
export { Switch }

export const SmartSwitch = ({
  label,
  description,
  wrapperClassName,
  disabled,
  ...switchProps
}: SmartSwitchProps) => {
  const id = React.useId()
  const descId = description ? `${id}-desc` : undefined

  return (
    <div
      className={cn("flex items-start justify-between gap-3", wrapperClassName)}
    >
      {(label != null || description != null) && (
        <div className="flex flex-col gap-0.5">
          {label != null && (
            <Label
              htmlFor={id}
              className={cn(disabled && "cursor-not-allowed opacity-50")}
            >
              {label}
            </Label>
          )}
          {description != null && (
            <p
              id={descId}
              className={cn(
                "text-xs text-muted-foreground",
                disabled && "opacity-50"
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <Switch
        id={id}
        disabled={disabled}
        aria-describedby={descId}
        {...switchProps}
      />
    </div>
  )
}
