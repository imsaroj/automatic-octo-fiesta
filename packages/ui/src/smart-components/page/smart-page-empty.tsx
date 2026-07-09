"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"

export interface SmartPageEmptyProps {
  /** Illustrative icon rendered above the title. */
  icon?: React.ReactNode
  /** Short headline (required). */
  title: string
  /** Supporting sentence that explains the empty state. */
  description?: React.ReactNode
  /** Call-to-action (e.g. a Button to create the first item). */
  action?: React.ReactNode
  /** Additional class names on the root element. */
  className?: string
}

/**
 * Full-page empty state.
 *
 * Used when a page's primary data set returns no results — whether because
 * the user has no items yet, a search/filter found nothing, or the view is
 * genuinely empty.
 *
 * Render it inside {@link SmartPageContent} or pass it to SmartPage's `empty`
 * prop for automatic placement:
 *
 * ```tsx
 * <SmartPage empty={data.length === 0 ? <SmartPageEmpty title="No users" … /> : undefined}>
 *   …
 * </SmartPage>
 * ```
 *
 * ## Standalone usage (inside SmartPageContent)
 * ```tsx
 * <SmartPageContent>
 *   {data.length === 0 ? (
 *     <SmartPageEmpty
 *       icon={<Users />}
 *       title="No team members yet"
 *       description="Invite your first team member to get started."
 *       action={<Button><UserPlus /> Invite member</Button>}
 *     />
 *   ) : (
 *     <MemberList data={data} />
 *   )}
 * </SmartPageContent>
 * ```
 */
export const SmartPageEmpty = ({
  icon,
  title,
  description,
  action,
  className,
}: SmartPageEmptyProps) => (
  <div
    role="status"
    className={cn(
      "flex h-full min-h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center",
      className
    )}
  >
    {icon && (
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-6">
        {icon}
      </div>
    )}
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    {action && <div className="pt-1">{action}</div>}
  </div>
)
