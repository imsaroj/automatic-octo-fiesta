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
} from "@iamsaroj/smart-ui/components/sheet"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { ActionButton } from "@iamsaroj/smart-ui/smart-components/buttons"
import type { SmartButtonProps } from "@iamsaroj/smart-ui/smart-components/smart-button"

import { useDeferredOpen } from "../internal/use-deferred-open"

export { SheetClose }

/* ------------------------------ footer actions ----------------------------- */

/** Shared config for a config-driven footer button. */
export interface SmartSheetFooterAction {
  /** Button label. Falls back to the action's default ("Cancel" / "Save"). */
  label?: React.ReactNode
  /** Override the default variant (cancel → `outline`, save → `default`). */
  variant?: SmartButtonProps["variant"]
  /** Button size. Falls back to the `footerActions.size` default (`sm`). */
  size?: SmartButtonProps["size"]
  /** Leading icon; `null` keeps the button text-only (the default). */
  icon?: React.ReactNode
  /** Disable the button while keeping it visible. */
  disabled?: boolean
  /** Show a spinner and disable the button (e.g. while a save is in flight). */
  loading?: boolean
  /** Label swapped in while `loading`. */
  loadingText?: string
  /** Fired on click. */
  onClick?: () => void
  /** Hide this action. @default true */
  visible?: boolean
}

/** The confirm/save action; can drive a `<SmartForm id>` via `form`. */
export interface SmartSheetSaveAction extends SmartSheetFooterAction {
  /**
   * Associate the button with a form's `id` so a click submits that form.
   * Sets `type="submit"` unless `type` overrides it.
   */
  form?: string
  /** Native button type. @default `"submit"` when `form` is set, else `"button"`. */
  type?: "button" | "submit" | "reset"
}

/** The dismiss/cancel action. */
export interface SmartSheetCancelAction extends SmartSheetFooterAction {
  /**
   * Wrap the button in `SheetClose` so clicking it dismisses the sheet
   * (honoring `onOpenChange`). @default true
   */
  closeOnClick?: boolean
}

/**
 * Config-driven footer: renders the standard Cancel + Save buttons without
 * hand-writing the footer JSX — the sheet counterpart to the grids' `actions`
 * prop. Both actions show by default when `footerActions` is set; pass `false`
 * (or `visible: false`) to drop one. The raw {@link SmartSheetProps.footer}
 * escape hatch still wins when both are supplied.
 */
export interface SmartSheetFooterActions {
  /** The dismiss button (wrapped in `SheetClose`). @default shown as "Cancel" */
  cancel?: boolean | SmartSheetCancelAction
  /** The confirm button. @default shown as "Save" */
  save?: boolean | SmartSheetSaveAction
  /** Default size for both buttons. @default "sm" */
  size?: SmartButtonProps["size"]
}

/** `false` / `visible:false` → null; `true` / undefined → defaults ({}). */
const normalizeFooterAction = <T extends SmartSheetFooterAction>(
  input: boolean | T | undefined
): T | Record<string, never> | null => {
  if (input === false) return null
  if (input === undefined || input === true) return {}
  if (input.visible === false) return null
  return input
}

const renderFooterActions = (
  actions: SmartSheetFooterActions
): React.ReactNode => {
  const defaultSize = actions.size ?? "sm"

  const cancel = normalizeFooterAction<SmartSheetCancelAction>(actions.cancel)
  const save = normalizeFooterAction<SmartSheetSaveAction>(actions.save)

  const cancelButton = cancel && (
    <ActionButton
      action="cancel"
      variant={cancel.variant ?? "outline"}
      size={cancel.size ?? defaultSize}
      icon={cancel.icon ?? null}
      disabled={cancel.disabled}
      loading={cancel.loading}
      loadingText={cancel.loadingText}
      onClick={cancel.onClick}
    >
      {cancel.label ?? "Cancel"}
    </ActionButton>
  )

  return (
    <>
      {cancelButton &&
        (cancel.closeOnClick === false ? (
          cancelButton
        ) : (
          <SheetClose render={cancelButton} />
        ))}
      {save && (
        <ActionButton
          action="save"
          variant={save.variant}
          size={save.size ?? defaultSize}
          icon={save.icon ?? null}
          type={save.type ?? (save.form ? "submit" : undefined)}
          form={save.form}
          disabled={save.disabled}
          loading={save.loading}
          loadingText={save.loadingText}
          onClick={save.onClick}
        >
          {save.label ?? "Save"}
        </ActionButton>
      )}
    </>
  )
}

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
   *
   * Escape hatch: prefer {@link footerActions} for the standard Cancel + Save
   * footer. A raw `footer` wins when both are supplied.
   */
  footer?: React.ReactNode
  /**
   * Config-driven footer — renders the standard Cancel + Save buttons without
   * hand-writing the JSX (the sheet counterpart to the grids' `actions` prop).
   *
   * ```tsx
   * footerActions={{
   *   save: { label: "Save changes", form: "user-form", loading: saving },
   *   cancel: { disabled: saving },
   * }}
   * ```
   */
  footerActions?: SmartSheetFooterActions
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
  footerActions,
  showCloseButton = true,
  dividers = false,
  className,
  children,
}: SmartSheetProps) => {
  // A controlled open lands one macrotask later, so a sheet opened from
  // inside another interaction (a grid row's Edit button) can't read that
  // same interaction as its own outside-press and self-close before painting.
  const deferredOpen = useDeferredOpen(open)
  // A raw `footer` wins as the escape hatch; otherwise build it from config.
  const footerContent =
    footer ?? (footerActions ? renderFooterActions(footerActions) : null)
  return (
    <Sheet open={deferredOpen} onOpenChange={onOpenChange}>
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
        {footerContent && (
          <SheetFooter className={cn(dividers && "border-t")}>
            {footerContent}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
