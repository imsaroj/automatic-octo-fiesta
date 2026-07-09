"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as BreadcrumbCurrent,
  BreadcrumbSeparator,
} from "@imsaroj/smart-ui/components/breadcrumb"
import { SMART_PAGE_SLOT } from "./slot"

// ─── SmartPageHeader ───────────────────────────────────────────────────────────

export interface SmartPageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
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

  // ─── Flat convenience props ──────────────────────────────────────────────
  // Cover the common breadcrumb + title + description + actions header without
  // hand-nesting the sub-components. Any set flat prop renders its standard
  // block; `children` still render below it (see the doc comment).

  /** Breadcrumb trail rendered above the title. */
  breadcrumb?: SmartPageBreadcrumbItem[]
  /** Page title. A string is wrapped in {@link SmartPageTitle}; pass a node for custom title rows (e.g. a badge beside it). */
  title?: React.ReactNode
  /** Supporting description rendered below the title (always wrapped in {@link SmartPageDescription}; inline nodes like `<code>` are fine). */
  description?: React.ReactNode
  /** Right-aligned action group, laid out on the same row as the title. */
  actions?: React.ReactNode
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
 * ## Flat props vs. composition
 * For the common case, pass `breadcrumb` / `title` / `description` / `actions`
 * and the header lays them out for you. Composition is still the escape hatch:
 * any `children` render *below* the flat block, so you can mix both.
 *
 * @example Flat props (the common case)
 * ```tsx
 * <SmartPageHeader
 *   breadcrumb={[{ label: "Users", href: "/users" }, { label: "New" }]}
 *   title="New User"
 *   description="Fill in the details below."
 *   actions={
 *     <>
 *       <Button variant="outline">Cancel</Button>
 *       <Button>Save</Button>
 *     </>
 *   }
 * />
 * ```
 *
 * @example Composition escape hatch (full control)
 * ```tsx
 * <SmartPageHeader>
 *   <SmartPageBreadcrumb items={[{ label: "Users", href: "/users" }, { label: "New" }]} />
 *   <div className="flex items-center justify-between">
 *     <div>
 *       <SmartPageTitle>New User</SmartPageTitle>
 *       <SmartPageDescription>Fill in the details below.</SmartPageDescription>
 *     </div>
 *     <SmartPageActions>
 *       <Button>Save</Button>
 *     </SmartPageActions>
 *   </div>
 * </SmartPageHeader>
 * ```
 */
export const SmartPageHeader = React.forwardRef<
  HTMLElement,
  SmartPageHeaderProps
>(
  (
    {
      border = true,
      compact = false,
      breadcrumb,
      title,
      description,
      actions,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const hasTitleRow = title != null || description != null || actions != null
    const hasFlat = (breadcrumb?.length ?? 0) > 0 || hasTitleRow

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
        {breadcrumb && breadcrumb.length > 0 && (
          <SmartPageBreadcrumb items={breadcrumb} />
        )}
        {hasTitleRow && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <SmartPageTitle>{title}</SmartPageTitle>
              ) : (
                title
              )}
              {description != null && (
                <SmartPageDescription>{description}</SmartPageDescription>
              )}
            </div>
            {actions != null && <SmartPageActions>{actions}</SmartPageActions>}
          </div>
        )}
        {hasFlat && children ? (
          <div className="mt-2">{children}</div>
        ) : (
          children
        )}
      </header>
    )
  }
)
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
>(({ as: Tag = "h1", className, ...props }, ref) => (
  <Tag
    ref={ref}
    data-slot="page-title"
    className={cn(
      "text-lg leading-tight font-semibold tracking-tight",
      className
    )}
    {...props}
  />
))

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
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="page-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))

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
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="page-actions"
    className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
    {...props}
  />
))

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
export const SmartPageBreadcrumb = ({
  items,
  className,
}: SmartPageBreadcrumbProps) => {
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
