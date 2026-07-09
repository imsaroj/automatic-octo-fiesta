"use client"

import * as React from "react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@imsaroj/smart-ui/components/card"

export interface SmartCardHeader {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

export interface SmartCardProps {
  /**
   * Header zone: title, subtitle, and trailing actions.
   * Maps to CardHeader + CardTitle + CardDescription + CardAction.
   */
  header?: SmartCardHeader
  /**
   * Footer rendered at the bottom of the card.
   * Maps to CardFooter.
   */
  footer?: React.ReactNode
  /** Passed to CardContent. Useful for overriding padding on the body. */
  contentClassName?: string
  /** Compact sizing. @default "default" */
  size?: "default" | "sm"
  className?: string
  children?: React.ReactNode
}

/**
 * Flattened Card wrapper. Replaces the standard 5-part compound:
 *
 * ```tsx
 * // Before
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Orders</CardTitle>
 *     <CardDescription>Latest orders</CardDescription>
 *     <CardAction><Button>Add</Button></CardAction>
 *   </CardHeader>
 *   <CardContent>…</CardContent>
 *   <CardFooter><Pagination /></CardFooter>
 * </Card>
 *
 * // After
 * <SmartCard
 *   header={{ title: "Orders", subtitle: "Latest orders", actions: <Button>Add</Button> }}
 *   footer={<Pagination />}
 * >
 *   …
 * </SmartCard>
 * ```
 *
 * Fall back to the native Card primitives when the header contains a
 * multi-row or non-linear layout (search bar + filter dropdown, etc.).
 */
export {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  CardAction,
}

export const SmartCard = ({
  header,
  footer,
  contentClassName,
  size = "default",
  className,
  children,
}: SmartCardProps) => {
  const hasHeader =
    header &&
    (header.title != null || header.subtitle != null || header.actions != null)

  return (
    <Card size={size} className={className}>
      {hasHeader && (
        <CardHeader>
          {header.title != null && <CardTitle>{header.title}</CardTitle>}
          {header.subtitle != null && (
            <CardDescription>{header.subtitle}</CardDescription>
          )}
          {header.actions != null && <CardAction>{header.actions}</CardAction>}
        </CardHeader>
      )}
      {children != null && (
        <CardContent className={contentClassName}>{children}</CardContent>
      )}
      {footer != null && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
