"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

export { DialogContent, DialogTitle, DialogDescription }

/**
 * Dialog width presets (fixed px width + max-height):
 * xs 400px/60vh · sm 600px/70vh · md 800px/80vh · lg 1000px/85vh ·
 * xl 1200px/90vh · 2xl 1400px/90vh · 3xl 1600px/92vh ·
 * full calc(100vw-48px) × calc(100vh-48px).
 */
export type SmartDialogSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full"

/**
 * Fixed width + max-height per size. These override the default
 * `sm:max-w-sm` on `DialogContent` via tailwind-merge. `WIDTH_CAP` keeps the
 * fixed width from overflowing narrow viewports (and re-overrides the default
 * `sm:` cap so the pixel width can grow past it). `overflow-y-auto` lets tall
 * content scroll within the max-height. The dialog stays centered.
 */
const WIDTH_CAP = "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"

const SIZE_CLASSES: Record<SmartDialogSize, string> = {
  xs: `w-[400px] ${WIDTH_CAP} max-h-[60vh] overflow-y-auto`,
  sm: `w-[600px] ${WIDTH_CAP} max-h-[70vh] overflow-y-auto`,
  md: `w-[800px] ${WIDTH_CAP} max-h-[80vh] overflow-y-auto`,
  lg: `w-[1000px] ${WIDTH_CAP} max-h-[85vh] overflow-y-auto`,
  xl: `w-[1200px] ${WIDTH_CAP} max-h-[90vh] overflow-y-auto`,
  "2xl": `w-[1400px] ${WIDTH_CAP} max-h-[90vh] overflow-y-auto`,
  "3xl": `w-[1600px] ${WIDTH_CAP} max-h-[92vh] overflow-y-auto`,
  full: "h-[calc(100vh-48px)] max-h-[calc(100vh-48px)] w-[calc(100vw-48px)] max-w-[calc(100vw-48px)] sm:max-w-[calc(100vw-48px)] overflow-y-auto",
}

export interface SmartDialogHeader {
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export interface SmartDialogProps {
  /** Controls open state (controlled mode). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Element rendered as the dialog trigger.
   * Passed as the `render` prop to DialogTrigger — must be a single element.
   * Omit when using controlled `open` without a built-in trigger.
   */
  trigger?: React.ReactElement
  /** Dialog header: title and optional subtitle. */
  header?: SmartDialogHeader
  /** Footer content (actions row). Maps to DialogFooter. */
  footer?: React.ReactNode
  /** Show the × close button in the top-right corner. @default true */
  showCloseButton?: boolean
  /** Dialog width preset. `full` fills the whole page. @default "sm" */
  size?: SmartDialogSize
  className?: string
  children?: React.ReactNode
}

/**
 * Flattened Dialog wrapper.
 *
 * ```tsx
 * // Before
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger render={<Button>Edit profile</Button>} />
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Edit profile</DialogTitle>
 *       <DialogDescription>Make changes here.</DialogDescription>
 *     </DialogHeader>
 *     <form>…</form>
 *     <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * // After
 * <SmartDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   trigger={<Button>Edit profile</Button>}
 *   header={{ title: "Edit profile", subtitle: "Make changes here." }}
 *   footer={<Button onClick={save}>Save</Button>}
 * >
 *   <form>…</form>
 * </SmartDialog>
 * ```
 *
 * Fall back to native Dialog primitives when the trigger needs conditional
 * rendering, multiple triggers, or the header has a non-standard layout.
 */
export function SmartDialog({
  open,
  onOpenChange,
  trigger,
  header,
  footer,
  showCloseButton = true,
  size = "sm",
  className,
  children,
}: SmartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(SIZE_CLASSES[size], className)}
      >
        {header && (
          <DialogHeader>
            <DialogTitle>{header.title}</DialogTitle>
            {header.subtitle && (
              <DialogDescription>{header.subtitle}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
