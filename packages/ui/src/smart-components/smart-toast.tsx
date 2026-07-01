"use client"

import { toast as sonnerToast } from "sonner"
import { Toaster } from "@workspace/ui/components/sonner"

type ToastOptions = Parameters<typeof sonnerToast.success>[1]

/**
 * Typed toast helpers built on Sonner.
 *
 * ```tsx
 * // One-liners for common toasts
 * toast.success("Saved!", { description: "Your changes have been applied." })
 * toast.error("Save failed", { description: "Please check your connection." })
 *
 * // Promise toast — auto-transitions loading → success/error
 * toast.promise(saveRecord(), {
 *   loading: "Saving…",
 *   success: "Record saved!",
 *   error:   (err) => `Failed: ${err.message}`,
 * })
 * ```
 *
 * Mount `<SmartToaster />` once in your app's root to render toasts.
 * All toasts are dismissible via Escape or clicking outside.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),

  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),

  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),

  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),

  loading: (message: string, options?: ToastOptions) =>
    sonnerToast.loading(message, options),

  /** Dismiss a specific toast by ID, or all toasts when called with no argument. */
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  /**
   * Shows a loading toast that automatically transitions to success or error
   * when the promise settles.
   *
   * @param messages.success - String or `(data) => string` to show on resolve.
   * @param messages.error   - String or `(err)  => string` to show on reject.
   */
  promise: sonnerToast.promise,
}

/**
 * Drop-in replacement for `<Toaster />`. Mount once at your app root.
 *
 * ```tsx
 * // apps/web/src/main.tsx
 * import { SmartToaster } from "@workspace/ui/smart-components/smart-toast"
 * <SmartToaster />
 * ```
 */
export { Toaster as SmartToaster }
