import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

export interface SmartEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional illustrative icon. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Optional call-to-action (e.g. a SmartButton). */
  action?: ReactNode
}

/** Friendly placeholder for empty lists, tables and search results. */
const SmartEmptyState = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: SmartEmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center",
      className
    )}
    {...props}
  >
    {icon ? (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-6">
        {icon}
      </div>
    ) : null}
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="pt-1">{action}</div> : null}
  </div>
)

export { SmartEmptyState }
