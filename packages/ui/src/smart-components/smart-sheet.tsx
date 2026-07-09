"use client"

import * as React from "react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@imsaroj/smart-ui/components/sheet"
import { cn } from "@imsaroj/smart-ui/lib/utils"

export { SheetClose }

export interface SmartSheetHeader {
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export interface SmartSheetProps {
  /** Controls open state (controlled mode). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Element rendered as the sheet trigger.
   * Passed as the `render` prop to SheetTrigger — must be a single element.
   */
  trigger?: React.ReactElement
  /** Which edge the sheet slides in from. @default "right" */
  side?: "top" | "right" | "bottom" | "left"
  /** Sheet header: title and optional subtitle. */
  header?: SmartSheetHeader
  /**
   * Footer pinned at the bottom of the sheet.
   * Common pattern: Cancel + Save buttons.
   * Use `SheetClose render={<Button variant="outline">Cancel</Button>}` for the cancel button.
   */
  footer?: React.ReactNode
  /** Show the × close button. @default true */
  showCloseButton?: boolean
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
 * Flattened Sheet wrapper for slide-in panels.
 *
 * Ideal for edit forms that should not navigate away from the current page.
 * The body area between header and footer scrolls independently.
 *
 * ```tsx
 * // Before
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetTrigger render={<Button>Edit</Button>} />
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Edit user</SheetTitle>
 *       <SheetDescription>Update the user details below.</SheetDescription>
 *     </SheetHeader>
 *     <div className="flex-1 overflow-y-auto px-6 py-2"><UserForm /></div>
 *     <SheetFooter>
 *       <SheetClose render={<Button variant="outline">Cancel</Button>} />
 *       <Button onClick={save}>Save</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 *
 * // After
 * <SmartSheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   trigger={<Button>Edit</Button>}
 *   header={{ title: "Edit user", subtitle: "Update the user details below." }}
 *   footer={
 *     <>
 *       <SheetClose render={<Button variant="outline">Cancel</Button>} />
 *       <Button onClick={save}>Save</Button>
 *     </>
 *   }
 * >
 *   <UserForm />
 * </SmartSheet>
 * ```
 */
export const SmartSheet = ({
  open,
  onOpenChange,
  trigger,
  side = "right",
  header,
  footer,
  showCloseButton = true,
  dividers = false,
  className,
  children,
}: SmartSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    {trigger && <SheetTrigger render={trigger} />}
    <SheetContent
      side={side}
      showCloseButton={showCloseButton}
      className={className}
    >
      {header && (
        <SheetHeader className={cn(dividers && "border-b")}>
          <SheetTitle>{header.title}</SheetTitle>
          {header.subtitle && (
            <SheetDescription>{header.subtitle}</SheetDescription>
          )}
        </SheetHeader>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-2">{children}</div>
      {footer && (
        <SheetFooter className={cn(dividers && "border-t")}>
          {footer}
        </SheetFooter>
      )}
    </SheetContent>
  </Sheet>
)
