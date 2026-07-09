import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { Button, buttonVariants } from "@imsaroj/smart-ui/components/button"
import { SmartSpinner } from "@imsaroj/smart-ui/smart-components/spinner"
import type { Button as ButtonPrimitive } from "@base-ui/react/button"

export interface SmartButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables the button when true. */
  loading?: boolean
  /** Text displayed while loading. Falls back to `children` when omitted. */
  loadingText?: React.ReactNode
}

/**
 * Button with a built-in loading state: shows an inline spinner, disables
 * the button, and optionally swaps the label.
 *
 * ```tsx
 * <SmartButton loading={isSaving} loadingText="Saving…" onClick={save}>
 *   Save changes
 * </SmartButton>
 * ```
 */
export const SmartButton = ({
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: SmartButtonProps) => (
  <Button disabled={disabled || loading} {...props}>
    {loading ? (
      <>
        <SmartSpinner size={12} label="Loading" />
        {loadingText ?? children}
      </>
    ) : (
      children
    )}
  </Button>
)
