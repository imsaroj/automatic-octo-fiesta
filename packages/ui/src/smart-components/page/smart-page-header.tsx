"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as BreadcrumbCurrent,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { SMART_PAGE_SLOT } from "./smart-page"

// ─── SmartPageHeader ───────────────────────────────────────────────────────────

export interface SmartPageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Renders a bottom border beneath the header.
   * @default true
   */
  border?: boolean
  /**
   * Uses tighter internal padding — useful when the header sits inside a
   * compact shell that already provides spacing.
   * @default false
   */
  compact?: boolean
}

/**
 * Top-level header zone for a page.
 *
 * Hosts breadcrumbs, title, description, and actions in a consistent
 * horizontal layout. Stickiness and border-bottom are controlled by context
 * (SmartPage props) and the `border` / `compact` props respectively.
 *
 * ## Layout
 * Renders as a flex row: left side for title group, right side for actions.
 * Children are laid out via natural flex flow — compose
 * {@link SmartPageTitle}, {@link SmartPageDescription}, and
 * {@link SmartPageActions} inside.
 *
 * ## Stickiness
 * In `"page"` scroll mode SmartPage wraps the header in a `sticky top-0`
 * container when `stickyHeader` is enabled. In `"content"` / `"grid"` modes
 * the header sits above the scroll container so it's always visible.
 *
 * @example
 * ```tsx
 * <SmartPageHeader>
 *   <SmartPageBreadcrumb items={[{ label: "Users", href: "/users" }, { label: "New" }]} />
 *   <div className="flex items-center justify-between">
 *     <div>
 *       <SmartPageTitle>New User</SmartPageTitle>
 *       <SmartPageDescription>Fill in the details below.</SmartPageDescription>
 *     </div>
 *     <SmartPageActions>
 *       <Button variant="outline">Cancel</Button>
 *       <Button>Save</Button>
 *     </SmartPageActions>
 *   </div>
 * </SmartPageHeader>
 * ```
 */
export const SmartPageHeader = React.forwardRef<
  HTMLElement,
  SmartPageHeaderProps
>(function SmartPageHeader(
  { border = true, compact = false, className, children, ...props },
  ref
) {
  return (
    <header
      ref={ref}
      data-slot="page-header"
      className={cn(
        "flex shrink-0 flex-col",
        compact ? "px-4 py-2" : "px-6 py-4",
        border && "border-b",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
})
;(SmartPageHeader as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "header"

// ─── SmartPageTitle ────────────────────────────────────────────────────────────

export interface SmartPageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Override the heading level. @default "h1" */
  as?: "h1" | "h2" | "h3"
}

/**
 * Page-level heading. Always renders as `<h1>` by default for correct
 * document outline; override with `as` when the page title is nested inside
 * a section hierarchy.
 *
 * @example
 * ```tsx
 * <SmartPageTitle>Users</SmartPageTitle>
 * ```
 */
export const SmartPageTitle = React.forwardRef<
  HTMLHeadingElement,
  SmartPageTitleProps
>(function SmartPageTitle({ as: Tag = "h1", className, ...props }, ref) {
  return (
    <Tag
      ref={ref}
      data-slot="page-title"
      className={cn(
        "text-lg leading-tight font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
})

// ─── SmartPageDescription ──────────────────────────────────────────────────────

/**
 * Supporting description rendered below the page title.
 * Automatically muted and limited to a comfortable reading width.
 *
 * @example
 * ```tsx
 * <SmartPageDescription>Manage your organisation's members and roles.</SmartPageDescription>
 * ```
 */
export const SmartPageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function SmartPageDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="page-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})

// ─── SmartPageActions ──────────────────────────────────────────────────────────

/**
 * Right-aligned action group inside a page header.
 * Lay out buttons, dropdowns, or any controls inside. Items are spaced
 * with a consistent gap and aligned vertically to the centre.
 *
 * @example
 * ```tsx
 * <SmartPageActions>
 *   <Button variant="outline"><Download /> Export</Button>
 *   <Button><Plus /> New User</Button>
 * </SmartPageActions>
 * ```
 */
export const SmartPageActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function SmartPageActions({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="page-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
})

// ─── SmartPageBreadcrumb ───────────────────────────────────────────────────────

export interface SmartPageBreadcrumbItem {
  /** Display label for this crumb. */
  label: string
  /** When provided, renders as a link. The last item ignores this. */
  href?: string
}

export interface SmartPageBreadcrumbProps {
  /** Ordered list of crumbs from root to current page. */
  items: SmartPageBreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb trail rendered above the page title.
 * The last item is always rendered as the current page (non-link).
 * All preceding items are rendered as links when `href` is provided.
 *
 * @example
 * ```tsx
 * <SmartPageBreadcrumb
 *   items={[
 *     { label: "Settings", href: "/settings" },
 *     { label: "Team", href: "/settings/team" },
 *     { label: "Members" },
 *   ]}
 * />
 * ```
 */
export function SmartPageBreadcrumb({
  items,
  className,
}: SmartPageBreadcrumbProps) {
  if (!items.length) return null
  return (
    <Breadcrumb className={cn("mb-1", className)}>
      <BreadcrumbList>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbCurrent>{item.label}</BreadcrumbCurrent>
                ) : (
                  <BreadcrumbLink href={item.href ?? "#"}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
