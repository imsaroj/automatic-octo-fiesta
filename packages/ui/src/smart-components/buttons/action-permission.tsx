import * as React from "react"

import type { ActionKind } from "./action-config"

/**
 * A permission check for a named action, optionally scoped to the resource the
 * action targets (e.g. the grid row for a row action). Return `false` to deny.
 *
 * The `context` argument is `unknown` on purpose — the library never couples to
 * an RBAC model. A checker that ignores it (the common `(action) => boolean`
 * shape) is still valid, since the parameter is optional.
 */
export type ActionPermissionChecker = (
  action: ActionKind | string,
  context?: unknown
) => boolean

const ActionPermissionContext =
  React.createContext<ActionPermissionChecker | null>(null)

/**
 * Optional role/permission gate for everything underneath — `ActionButton`s,
 * the grid action column, and any {@link Can} gate all consult this one
 * checker. Without a provider nothing is gated (everything is allowed).
 *
 * ```tsx
 * <ActionPermissionProvider can={(action, row) => menuFlags[action] ?? false}>
 *   <SmartServerGrid … actionColumn={{ actions: { edit: {…}, delete: {…} } }} />
 * </ActionPermissionProvider>
 * ```
 *
 * The action column consults `can(kind, row)` for any action without an
 * explicit `visible` — so `edit` shows only where `can("edit", row)` passes.
 */
export const ActionPermissionProvider = ({
  can,
  children,
}: {
  can: ActionPermissionChecker
  children: React.ReactNode
}) => (
  <ActionPermissionContext.Provider value={can}>
    {children}
  </ActionPermissionContext.Provider>
)

/**
 * The nearest permission checker, or `null` when no {@link
 * ActionPermissionProvider} is mounted (treat `null` as "allow everything").
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook + gate component intentionally colocated with the context they share
export const useActionPermission = (): ActionPermissionChecker | null =>
  React.useContext(ActionPermissionContext)

/**
 * Declarative permission gate: renders `children` only when `can(action,
 * context)` passes (or when no provider is mounted); renders `fallback`
 * otherwise. The component the front used to hand-roll, now shipped.
 *
 * ```tsx
 * <Can action="add"><AddButton onClick={openCreate} /></Can>
 * <Can action="delete" context={row} fallback={<Locked />}>
 *   <DeleteButton onClick={() => remove(row)} />
 * </Can>
 * ```
 */
export const Can = ({
  action,
  context,
  fallback = null,
  children,
}: {
  action: ActionKind | string
  context?: unknown
  fallback?: React.ReactNode
  children: React.ReactNode
}): React.ReactNode => {
  const can = useActionPermission()
  return (can?.(action, context) ?? true) ? children : fallback
}
