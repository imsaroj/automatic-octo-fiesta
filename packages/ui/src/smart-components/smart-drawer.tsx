"use client"

import * as React from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"

export interface SmartDrawerHeader {
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export interface SmartDrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Element that opens the drawer when clicked. Rendered via `asChild`. */
  trigger?: React.ReactElement
  /** Slide-in direction. @default "bottom" */
  direction?: "top" | "bottom" | "left" | "right"
  header?: SmartDrawerHeader
  /** Footer content. Use `<DrawerClose asChild>` inside for a close button. */
  footer?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/**
 * Drawer with integrated trigger, header, scrollable body, and footer.
 *
 * ```tsx
 * // Before
 * <Drawer open={open} onOpenChange={setOpen}>
 *   <DrawerTrigger asChild><Button>Open</Button></DrawerTrigger>
 *   <DrawerContent>
 *     <DrawerHeader><DrawerTitle>Settings</DrawerTitle></DrawerHeader>
 *     <div className="overflow-y-auto px-4 py-2">...</div>
 *     <DrawerFooter><Button onClick={save}>Save</Button></DrawerFooter>
 *   </DrawerContent>
 * </Drawer>
 *
 * // After
 * <SmartDrawer
 *   open={open}
 *   onOpenChange={setOpen}
 *   trigger={<Button>Open</Button>}
 *   header={{ title: "Settings" }}
 *   footer={<Button onClick={save}>Save</Button>}
 * >
 *   ...
 * </SmartDrawer>
 * ```
 */
export function SmartDrawer({
  open,
  onOpenChange,
  trigger,
  direction = "bottom",
  header,
  footer,
  className,
  children,
}: SmartDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className={className}>
        {header && (
          <DrawerHeader>
            <DrawerTitle>{header.title}</DrawerTitle>
            {header.subtitle && (
              <DrawerDescription>{header.subtitle}</DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-2">{children}</div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}

export { DrawerClose }
