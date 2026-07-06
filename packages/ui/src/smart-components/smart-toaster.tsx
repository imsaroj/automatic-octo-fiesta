import type { ComponentProps } from "react"
import { Toaster as SonnerToaster, toast } from "sonner"

export type SToasterProps = ComponentProps<typeof SonnerToaster>

/**
 * Pre-themed Sonner toaster. Render once near the app root, then call `toast(...)`
 * anywhere. Colors are mapped to the design tokens so toasts track light/dark.
 */
const SmartToaster = (props: SToasterProps) => (
  <SonnerToaster
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
        description: "group-[.toast]:text-muted-foreground",
        actionButton:
          "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
        cancelButton:
          "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
        success: "group-[.toaster]:text-success",
        error: "group-[.toaster]:text-destructive",
        warning: "group-[.toaster]:text-warning",
        info: "group-[.toaster]:text-info",
      },
    }}
    {...props}
  />
)

// eslint-disable-next-line react-refresh/only-export-components
export { SmartToaster, toast }
