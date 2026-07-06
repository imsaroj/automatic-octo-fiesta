import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  SmartButton,
  type SmartButtonProps,
} from "@workspace/ui/smart-components/smart-button"

import {
  ACTION_BUTTON_CONFIG,
  type ActionDefaults,
  type ActionKind,
} from "./action-config"

export type ActionPermissionChecker = (action: ActionKind) => boolean

const ActionPermissionContext =
  React.createContext<ActionPermissionChecker | null>(null)

/**
 * Optional role/permission gate for all `ActionButton`s underneath. Buttons
 * whose action `can(action)` rejects are hidden (or disabled, per their
 * `deniedBehavior`). A per-button `permission` prop overrides the checker.
 *
 * ```tsx
 * <ActionPermissionProvider can={(action) => role === "admin" || action !== "delete"}>
 *   <EditButton onClick={edit} />
 *   <DeleteButton onClick={remove} />
 * </ActionPermissionProvider>
 * ```
 */
export function ActionPermissionProvider({
  can,
  children,
}: {
  can: ActionPermissionChecker
  children: React.ReactNode
}) {
  return (
    <ActionPermissionContext.Provider value={can}>
      {children}
    </ActionPermissionContext.Provider>
  )
}

export interface ActionButtonProps extends SmartButtonProps {
  /** Which entry of `ACTION_BUTTON_CONFIG` supplies the defaults. */
  action: ActionKind
  /** Override the default icon; pass `null` to render without an icon. */
  icon?: React.ReactNode
  /**
   * Render only the icon (switches to the matching `icon-*` size). The default
   * label is kept as `aria-label` and shown as a tooltip.
   */
  iconOnly?: boolean
  /**
   * Tooltip content. `true` uses the default label, `false` disables the
   * automatic icon-only tooltip. Defaults to the label when `iconOnly`.
   */
  tooltip?: React.ReactNode | boolean
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"]
  /** Explicit permission override; wins over `ActionPermissionProvider`. */
  permission?: boolean
  /** What to do when the action is not permitted. @default "hide" */
  deniedBehavior?: "hide" | "disable"
}

function toIconOnlySize(
  size: SmartButtonProps["size"]
): SmartButtonProps["size"] {
  switch (size) {
    case undefined:
    case null:
    case "default":
      return "icon"
    case "xs":
      return "icon-xs"
    case "sm":
      return "icon-sm"
    case "lg":
      return "icon-lg"
    default:
      return size
  }
}

/**
 * `SmartButton` pre-configured for a named action: default icon, label,
 * variant, loading text, and button type all come from
 * `ACTION_BUTTON_CONFIG[action]`; every prop stays overridable. Prefer the
 * named presets (`<AddButton />`, `<DeleteButton />`, …) — this component is
 * the escape hatch for choosing the action dynamically.
 *
 * ```tsx
 * <ActionButton action="save" loading={isSaving} onClick={save} />
 * <ActionButton action="delete" iconOnly onClick={remove} />
 * ```
 */
export function ActionButton({
  action,
  icon,
  iconOnly = false,
  tooltip,
  tooltipSide,
  permission,
  deniedBehavior = "hide",
  variant,
  size,
  type,
  loadingText,
  disabled,
  children,
  "aria-label": ariaLabel,
  ...props
}: ActionButtonProps) {
  const can = React.useContext(ActionPermissionContext)
  const allowed = permission ?? can?.(action) ?? true
  if (!allowed && deniedBehavior === "hide") return null

  const config: ActionDefaults = ACTION_BUTTON_CONFIG[action]
  const DefaultIcon = config.icon
  const resolvedIcon = icon === undefined ? <DefaultIcon aria-hidden /> : icon
  const label = children ?? config.label
  const iconSide = config.iconSide ?? "start"

  const button = (
    <SmartButton
      variant={variant ?? config.variant}
      size={iconOnly ? toIconOnlySize(size) : size}
      type={type ?? config.type ?? "button"}
      loadingText={loadingText ?? (iconOnly ? "" : config.loadingText)}
      disabled={disabled || !allowed}
      aria-label={ariaLabel ?? (iconOnly ? config.label : undefined)}
      {...props}
    >
      {iconSide === "start" && resolvedIcon}
      {!iconOnly && label}
      {iconSide === "end" && resolvedIcon}
    </SmartButton>
  )

  const tooltipContent =
    tooltip === true
      ? config.label
      : tooltip === false
        ? null
        : (tooltip ?? (iconOnly ? config.label : null))

  if (tooltipContent == null) return button

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export type ActionButtonPresetProps = Omit<ActionButtonProps, "action">

/**
 * Builds a named preset bound to one action. Used for all built-in buttons in
 * `action-buttons.tsx`; call it yourself after extending
 * `ACTION_BUTTON_CONFIG` with a new action.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function createActionButton(action: ActionKind, displayName: string) {
  function ActionButtonPreset(props: ActionButtonPresetProps) {
    return <ActionButton action={action} {...props} />
  }
  ActionButtonPreset.displayName = displayName
  return ActionButtonPreset
}
