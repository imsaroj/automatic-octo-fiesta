import * as React from "react"

import { ActionButton } from "@iamsaroj/smart-ui/smart-components/buttons"
import type { SmartButtonProps } from "@iamsaroj/smart-ui/smart-components/smart-button"

/**
 * Shared config-driven footer for the overlay wrappers (`SmartSheet`,
 * `SmartDialog`) — the overlay counterpart to the grids' `actions` prop.
 * Renders the standard Cancel + Save buttons without hand-writing the footer
 * JSX. The only thing that differs per overlay is the Close primitive used to
 * dismiss it, so that is passed in as `CloseWrapper`.
 */

/** Shared config for a config-driven footer button. */
export interface SmartFooterAction {
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
export interface SmartFooterSaveAction extends SmartFooterAction {
  /**
   * Associate the button with a form's `id` so a click submits that form.
   * Sets `type="submit"` unless `type` overrides it.
   */
  form?: string
  /** Native button type. @default `"submit"` when `form` is set, else `"button"`. */
  type?: "button" | "submit" | "reset"
}

/** The dismiss/cancel action. */
export interface SmartFooterCancelAction extends SmartFooterAction {
  /**
   * Wrap the button in the overlay's Close primitive so clicking it dismisses
   * the overlay (honoring `onOpenChange`). @default true
   */
  closeOnClick?: boolean
}

/**
 * Config-driven footer: renders the standard Cancel + Save buttons without
 * hand-writing the footer JSX. Both actions show by default when the object is
 * set; pass `false` (or `visible: false`) to drop one. The raw `footer` escape
 * hatch still wins when both are supplied.
 */
export interface SmartFooterActions {
  /** The dismiss button (wrapped in the overlay's Close). @default shown as "Cancel" */
  cancel?: boolean | SmartFooterCancelAction
  /** The confirm button. @default shown as "Save" */
  save?: boolean | SmartFooterSaveAction
  /** Default size for both buttons. @default "sm" */
  size?: SmartButtonProps["size"]
}

/** `false` / `visible:false` → null; `true` / undefined → defaults ({}). */
const normalizeFooterAction = <T extends SmartFooterAction>(
  input: boolean | T | undefined
): T | Record<string, never> | null => {
  if (input === false) return null
  if (input === undefined || input === true) return {}
  if (input.visible === false) return null
  return input
}

/** The overlay's Close primitive (`SheetClose` / `DialogClose`). */
type CloseWrapper = React.ComponentType<{ render: React.ReactElement }>

export const renderFooterActions = (
  actions: SmartFooterActions,
  CloseWrapper: CloseWrapper
): React.ReactNode => {
  const defaultSize = actions.size ?? "sm"

  const cancel = normalizeFooterAction<SmartFooterCancelAction>(actions.cancel)
  const save = normalizeFooterAction<SmartFooterSaveAction>(actions.save)

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
          <CloseWrapper render={cancelButton} />
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
