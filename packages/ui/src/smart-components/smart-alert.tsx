"use client"

import * as React from "react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@imsaroj/smart-ui/components/alert"

export interface SmartAlertProps {
  /**
   * Icon placed on the leading edge (auto-sized by Alert styles).
   * Recommended: a Lucide icon with no explicit size class.
   */
  icon?: React.ReactNode
  /** Bold headline. */
  title?: React.ReactNode
  /** Supporting body text. */
  description?: React.ReactNode
  /**
   * Action element anchored to the trailing edge (inside AlertAction).
   * Typically a small Button or link.
   */
  action?: React.ReactNode
  /** `"destructive"` renders the alert in error/red tones. @default "default" */
  variant?: "default" | "destructive"
  className?: string
}

/**
 * Flattened Alert wrapper for inline status banners.
 *
 * ```tsx
 * // Before
 * <Alert variant="destructive">
 *   <AlertCircle />
 *   <AlertTitle>Payment failed</AlertTitle>
 *   <AlertDescription>Please update your payment method.</AlertDescription>
 *   <AlertAction><Button size="sm" variant="outline">Update</Button></AlertAction>
 * </Alert>
 *
 * // After
 * <SmartAlert
 *   icon={<AlertCircle />}
 *   title="Payment failed"
 *   description="Please update your payment method."
 *   action={<Button size="sm" variant="outline">Update</Button>}
 *   variant="destructive"
 * />
 * ```
 */
export const SmartAlert = ({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: SmartAlertProps) => (
  <Alert variant={variant} className={className}>
    {icon}
    {title != null && <AlertTitle>{title}</AlertTitle>}
    {description != null && <AlertDescription>{description}</AlertDescription>}
    {action != null && <AlertAction>{action}</AlertAction>}
  </Alert>
)
