import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Badge } from "@imsaroj/smart-ui/components/badge"
import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@imsaroj/smart-ui/components/badge"

const dotColors: Record<string, string> = {
  gray: "bg-muted-foreground",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
}

export interface SmartBadgeProps extends VariantProps<typeof badgeVariants> {
  /** Leading status dot. */
  dot?: boolean
  /** Color of the dot. @default "gray" */
  dotColor?: "gray" | "green" | "red" | "yellow" | "blue"
  /** Callback for the × remove button. Renders a remove button when provided. */
  onRemove?: () => void
  /** Accessible label for the remove button. @default "Remove" */
  removeLabel?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Badge extended with a leading status dot and/or a trailing remove button.
 *
 * ```tsx
 * // Status badge with dot
 * <SmartBadge variant="secondary" dot dotColor="green">Active</SmartBadge>
 *
 * // Removable tag
 * <SmartBadge variant="outline" onRemove={() => removeTag(id)}>React</SmartBadge>
 * ```
 */
export const SmartBadge = ({
  dot,
  dotColor = "gray",
  onRemove,
  removeLabel = "Remove",
  children,
  className,
  variant,
}: SmartBadgeProps) => (
  <Badge
    variant={variant}
    className={cn("gap-1", onRemove && "pr-0.5", className)}
  >
    {dot && (
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          dotColors[dotColor] ?? dotColors.gray
        )}
      />
    )}
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full opacity-60 outline-none hover:opacity-100 focus-visible:ring-1 focus-visible:ring-current"
      >
        <X className="size-2.5" aria-hidden="true" />
      </button>
    )}
  </Badge>
)
