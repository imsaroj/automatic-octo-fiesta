"use client"

import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@iamsaroj/smart-ui/components/breadcrumb"

export interface SmartBreadcrumbItem {
  label: string
  href?: string
  /**
   * Applied to the BreadcrumbItem and the separator that precedes it,
   * so hiding an item also hides its separator automatically.
   */
  className?: string
}

export interface SmartBreadcrumbProps {
  items: SmartBreadcrumbItem[]
  className?: string
}

/**
 * Flattened Breadcrumb wrapper. The last item always renders as
 * BreadcrumbPage (non-linkable); preceding items render as BreadcrumbLink.
 * Each separator inherits the `className` of the item that follows it.
 *
 * ```tsx
 * // Before
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem className="hidden md:block">
 *       <BreadcrumbLink href="#">Settings</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator className="hidden md:block" />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>Messages & media</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 *
 * // After
 * <SmartBreadcrumb
 *   items={[
 *     { label: "Settings", href: "#", className: "hidden md:block" },
 *     { label: "Messages & media" },
 *   ]}
 * />
 * ```
 */
export const SmartBreadcrumb = ({ items, className }: SmartBreadcrumbProps) => (
  <Breadcrumb className={className}>
    <BreadcrumbList>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={item.label}>
            {index > 0 && <BreadcrumbSeparator className={item.className} />}
            <BreadcrumbItem className={item.className}>
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        )
      })}
    </BreadcrumbList>
  </Breadcrumb>
)
