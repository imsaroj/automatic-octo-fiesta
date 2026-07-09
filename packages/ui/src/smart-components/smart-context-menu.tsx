"use client"

import * as React from "react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@imsaroj/smart-ui/components/context-menu"

// ---- Item config types ----

export type SmartContextMenuSeparator = { type: "separator" }

export type SmartContextMenuLabel = { type: "label"; label: string }

export type SmartContextMenuAction = {
  type?: "item"
  label: string
  icon?: React.ReactNode
  shortcut?: string
  variant?: "default" | "destructive"
  disabled?: boolean
  onClick?: () => void
}

export type SmartContextMenuCheckbox = {
  type: "checkbox"
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  shortcut?: string
}

export type SmartContextMenuSub = {
  type: "sub"
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  items: SmartContextMenuItemConfig[]
}

export type SmartContextMenuItemConfig =
  | SmartContextMenuSeparator
  | SmartContextMenuLabel
  | SmartContextMenuAction
  | SmartContextMenuCheckbox
  | SmartContextMenuSub

// ---- Renderer ----

const renderItem = (
  item: SmartContextMenuItemConfig,
  index: number
): React.ReactNode => {
  if (item.type === "separator") {
    return <ContextMenuSeparator key={index} />
  }
  if (item.type === "label") {
    return <ContextMenuLabel key={index}>{item.label}</ContextMenuLabel>
  }
  if (item.type === "checkbox") {
    return (
      <ContextMenuCheckboxItem
        key={index}
        checked={item.checked}
        onCheckedChange={item.onCheckedChange}
        disabled={item.disabled}
      >
        {item.label}
        {item.shortcut && (
          <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
        )}
      </ContextMenuCheckboxItem>
    )
  }
  if (item.type === "sub") {
    return (
      <ContextMenuSub key={index}>
        <ContextMenuSubTrigger disabled={item.disabled}>
          {item.icon}
          {item.label}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {item.items.map((sub, si) => renderItem(sub, si))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    )
  }
  // default: "item" (type is undefined or "item")
  return (
    <ContextMenuItem
      key={index}
      variant={item.variant}
      disabled={item.disabled}
      onClick={item.onClick}
    >
      {item.icon}
      {item.label}
      {item.shortcut && (
        <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
      )}
    </ContextMenuItem>
  )
}

// ---- Component ----

export interface SmartContextMenuProps {
  /** The element that the user right-clicks to open the menu. */
  children: React.ReactNode
  /** Ordered list of menu items. */
  items: SmartContextMenuItemConfig[]
  className?: string
}

/**
 * Data-driven context menu (right-click menu). Supports items, labels,
 * separators, checkboxes, and recursive sub-menus via a typed config array.
 *
 * ```tsx
 * <SmartContextMenu
 *   items={[
 *     { label: "Edit", icon: <Pencil />, shortcut: "⌘E", onClick: onEdit },
 *     { type: "separator" },
 *     { label: "Delete", variant: "destructive", onClick: onDelete },
 *   ]}
 * >
 *   <div className="rounded border p-4">Right-click me</div>
 * </SmartContextMenu>
 * ```
 */
export const SmartContextMenu = ({
  children,
  items,
  className,
}: SmartContextMenuProps) => (
  <ContextMenu>
    <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
    <ContextMenuContent>
      {items.map((item, idx) => renderItem(item, idx))}
    </ContextMenuContent>
  </ContextMenu>
)
