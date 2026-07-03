"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

// ─── PortalDropdown ───────────────────────────────────────────────────────────
// Renders the panel into document.body — same pattern as the Lexical playground
// DropDown. Because the panel lives outside the editor DOM, clicking items
// does not steal the editor's DOM focus.

const DROPDOWN_PADDING = 4

interface PortalDropdownProps {
  label: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  children: React.ReactNode
  panelClassName?: string
  disabled?: boolean
  title?: string
  chevron?: boolean
}

export function PortalDropdown({
  label,
  isOpen,
  onToggle,
  onClose,
  children,
  panelClassName,
  disabled,
  title,
  chevron = true,
}: PortalDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !panelRef.current) return
    const { top, left, height } = triggerRef.current.getBoundingClientRect()
    panelRef.current.style.top = `${top + height + DROPDOWN_PADDING}px`
    panelRef.current.style.left = `${Math.min(left, window.innerWidth - panelRef.current.offsetWidth - 8)}px`
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const close = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [isOpen, onClose])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={onToggle}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded border border-border bg-background",
          "px-1.5 text-xs font-medium transition-colors outline-none",
          "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          isOpen && "bg-muted"
        )}
      >
        {label}
        {chevron && (
          <ChevronDown className="size-2.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            className={cn(
              "fixed z-[9999] min-w-[9rem] rounded-md border border-border",
              "bg-popover py-1 shadow-lg",
              panelClassName
            )}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

export function DropdownItem({
  label,
  icon,
  active,
  onClick,
  description,
  className,
  style,
}: {
  label: string
  icon?: React.ReactNode
  active?: boolean
  onClick: () => void
  description?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      style={style}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs",
        "transition-colors hover:bg-muted",
        active && "bg-muted font-medium",
        className
      )}
    >
      {icon && (
        <span className="size-3.5 shrink-0 text-muted-foreground">{icon}</span>
      )}
      <span className="flex-1">{label}</span>
      {description && (
        <span className="text-[10px] text-muted-foreground">{description}</span>
      )}
    </button>
  )
}

// ─── Toolbar primitives ───────────────────────────────────────────────────────

export function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={className}
    >
      {children}
    </Button>
  )
}

export function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-0.5 h-4 self-center" />
}
