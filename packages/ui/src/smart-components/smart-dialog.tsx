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
} from "@iamsaroj/smart-ui/components/dialog"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

import { useDeferredOpen } from "../internal/use-deferred-open"

export { DialogContent, DialogTitle, DialogDescription }

/**
 * Dialog size presets (fixed px width × fixed vh height):
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
 * Fixed width + fixed height per size. These override the default
 * `sm:max-w-sm` on `DialogContent` via tailwind-merge. `SIZE_CAP` keeps the
 * fixed dimensions from overflowing small viewports (and re-overrides the
 * default `sm:` width cap so the pixel width can grow past it). Scrolling
 * happens on the inner body (see the component), not the popup — so the
 * absolute close button stays pinned to the corner. The dialog stays centered.
 */
const SIZE_CAP =
  "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"

const SIZE_CLASSES: Record<SmartDialogSize, string> = {
  xs: `w-[400px] h-[60vh] ${SIZE_CAP}`,
  sm: `w-[600px] h-[70vh] ${SIZE_CAP}`,
  md: `w-[800px] h-[80vh] ${SIZE_CAP}`,
  lg: `w-[1000px] h-[85vh] ${SIZE_CAP}`,
  xl: `w-[1200px] h-[90vh] ${SIZE_CAP}`,
  "2xl": `w-[1400px] h-[90vh] ${SIZE_CAP}`,
  "3xl": `w-[1600px] h-[92vh] ${SIZE_CAP}`,
  full: "h-[calc(100vh-48px)] w-[calc(100vw-48px)] max-w-[calc(100vw-48px)] sm:max-w-[calc(100vw-48px)]",
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
  /**
   * Draw full-width separator lines under the header and above the footer,
   * visually grouping them apart from the scrollable body (shadcn style).
   * @default false
   */
  dividers?: boolean
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
export const SmartDialog = ({
  open,
  onOpenChange,
  trigger,
  header,
  footer,
  showCloseButton = true,
  size = "sm",
  dividers = false,
  className,
  children,
}: SmartDialogProps) => {
  // A controlled open lands one macrotask later, so a dialog opened from
  // inside another interaction (row action, menu item) can't read that same
  // interaction as its own outside-press/focus-out and self-close.
  const deferredOpen = useDeferredOpen(open)
  return (
    <Dialog open={deferredOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        showCloseButton={showCloseButton}
        // Flex column so the header/footer stay fixed and only the body
        // scrolls — keeps the absolute close button pinned to the corner.
        className={cn("flex flex-col", SIZE_CLASSES[size], className)}
      >
        {header && (
          // `-mx-4 px-4` bleeds the border to the popup edges (cancels the
          // p-4), `pb-4` sets the gap between title and the divider line.
          <DialogHeader
            className={cn("shrink-0", dividers && "-mx-4 border-b px-4 pb-4")}
          >
            <DialogTitle>{header.title}</DialogTitle>
            {header.subtitle && (
              <DialogDescription>{header.subtitle}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <DialogFooter
            className={cn("shrink-0", dividers && "-mx-4 border-t px-4 pt-4")}
          >
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
