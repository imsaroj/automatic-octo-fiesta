"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Separator } from "@workspace/ui/components/separator"

export interface SmartPageSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional section heading. */
  title?: string
  /** Optional supporting description rendered below the title. */
  description?: string
  /**
   * Show a border beneath the section heading, separating it from the body.
   * @default false
   */
  divider?: boolean
  /**
   * Renders a border around the entire section.
   * @default false
   */
  bordered?: boolean
  /**
   * Applies standard section padding (horizontal + vertical).
   * @default true
   */
  padding?: boolean
}

/**
 * Named region within a content area, used to group related form fields,
 * settings controls, or information blocks.
 *
 * SmartPageSection provides a consistent heading + body structure without
 * imposing card or box styling — it's a semantic wrapper, not a visual frame.
 * For framed cards, combine with the shadcn `Card` primitive.
 *
 * ## When to use
 * - Settings pages: one section per logical settings group
 * - Forms: one section per form fieldset
 * - Detail pages: one section per entity attribute group
 *
 * @example Settings section
 * ```tsx
 * <SmartPageSection
 *   title="Notifications"
 *   description="Choose how and when you receive notifications."
 *   divider
 * >
 *   <NotificationForm />
 * </SmartPageSection>
 * ```
 *
 * @example Borderless information block
 * ```tsx
 * <SmartPageSection title="Recent activity">
 *   <ActivityList />
 * </SmartPageSection>
 * ```
 */
export const SmartPageSection = React.forwardRef<
  HTMLElement,
  SmartPageSectionProps
>(
  (
    {
      title,
      description,
      divider = false,
      bordered = false,
      padding = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const hasHeading = Boolean(title || description)

    return (
      <section
        ref={ref}
        data-slot="page-section"
        className={cn(
          "flex flex-col gap-4",
          padding && "py-6",
          bordered && "rounded-lg border p-6",
          className
        )}
        {...props}
      >
        {hasHeading && (
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-sm leading-tight font-semibold">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {divider && <Separator className="mt-2" />}
          </div>
        )}
        <div className="flex flex-col gap-3">{children}</div>
      </section>
    )
  }
)
