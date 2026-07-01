"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import { SMART_PAGE_SLOT } from "./smart-page"

// ─── SmartPageTabs ─────────────────────────────────────────────────────────────

export interface SmartPageTabsProps {
  /** The value of the tab selected by default (uncontrolled). */
  defaultValue?: string
  /** The controlled active tab value. */
  value?: string
  onValueChange?: (value: string) => void
  /**
   * Render a bottom border on the tab list strip.
   * @default true
   */
  border?: boolean
  /**
   * Visual variant of the tab list.
   * - `"line"` — underline style (recommended for page-level tabs)
   * - `"default"` — pill/chip style
   */
  variant?: "default" | "line"
  className?: string
  children?: React.ReactNode
}

/**
 * Page-level tab navigation bar.
 *
 * Used when a single page exposes multiple views or sub-sections (Overview,
 * Activity, Settings). The tab list renders as a horizontal strip below the
 * toolbar; each panel renders its content below the strip.
 *
 * Compose with {@link SmartPageTab} (tab triggers) and
 * {@link SmartPageTabPanel} (tab content panels).
 *
 * ## When to use
 * Use SmartPageTabs for **navigation** between views that share the same URL
 * context (e.g. a profile page with Overview / Posts / Followers tabs).
 * For tabs that switch localised UI state within a card, use the
 * shadcn `Tabs` component directly.
 *
 * ## Scroll note
 * Tab panels participate in the parent's scroll mode. If you need each panel
 * to scroll independently, wrap content in a `SmartPageContent` inside the panel.
 *
 * @example
 * ```tsx
 * <SmartPage>
 *   <SmartPageHeader>
 *     <SmartPageTitle>Project Alpha</SmartPageTitle>
 *   </SmartPageHeader>
 *   <SmartPageTabs defaultValue="overview" variant="line">
 *     <SmartPageTab value="overview">Overview</SmartPageTab>
 *     <SmartPageTab value="activity">Activity</SmartPageTab>
 *     <SmartPageTab value="settings">Settings</SmartPageTab>
 *     <SmartPageTabPanel value="overview"><OverviewView /></SmartPageTabPanel>
 *     <SmartPageTabPanel value="activity"><ActivityView /></SmartPageTabPanel>
 *     <SmartPageTabPanel value="settings"><SettingsView /></SmartPageTabPanel>
 *   </SmartPageTabs>
 * </SmartPage>
 * ```
 */
export function SmartPageTabs({
  defaultValue,
  value,
  onValueChange,
  border = true,
  variant = "line",
  className,
  children,
}: SmartPageTabsProps) {
  // Collect SmartPageTab triggers vs SmartPageTabPanel panels from children
  const triggers: React.ReactNode[] = []
  const panels: React.ReactNode[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const role = (child.type as any)._smartTabRole as string | undefined
    if (role === "tab") triggers.push(child)
    else if (role === "panel") panels.push(child)
    else triggers.push(child) // unknown children fall into trigger area
  })

  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex shrink-0 flex-col", className)}
    >
      <div className={cn("px-4", border && "border-b")}>
        <TabsList
          variant={variant}
          className="h-9 gap-0 rounded-none bg-transparent p-0"
        >
          {triggers}
        </TabsList>
      </div>
      {panels}
    </Tabs>
  )
}
;(SmartPageTabs as any)[SMART_PAGE_SLOT] = "tabs"

// ─── SmartPageTab ──────────────────────────────────────────────────────────────

export interface SmartPageTabProps {
  /** Must match the corresponding SmartPageTabPanel value. */
  value: string
  className?: string
  children?: React.ReactNode
}

/**
 * A single tab trigger inside {@link SmartPageTabs}.
 *
 * @example
 * ```tsx
 * <SmartPageTab value="overview">Overview</SmartPageTab>
 * ```
 */
export function SmartPageTab({
  value,
  className,
  children,
}: SmartPageTabProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "h-9 rounded-none border-0 px-4 text-xs font-medium",
        className
      )}
    >
      {children}
    </TabsTrigger>
  )
}
;(SmartPageTab as any)._smartTabRole = "tab"

// ─── SmartPageTabPanel ─────────────────────────────────────────────────────────

export interface SmartPageTabPanelProps {
  /** Must match the corresponding SmartPageTab value. */
  value: string
  className?: string
  children?: React.ReactNode
}

/**
 * Content panel for a tab inside {@link SmartPageTabs}.
 * Only rendered when its `value` matches the active tab.
 *
 * @example
 * ```tsx
 * <SmartPageTabPanel value="overview">
 *   <SmartPageContent><OverviewCards /></SmartPageContent>
 * </SmartPageTabPanel>
 * ```
 */
export function SmartPageTabPanel({
  value,
  className,
  children,
}: SmartPageTabPanelProps) {
  return (
    <TabsContent value={value} className={cn("flex-1 outline-none", className)}>
      {children}
    </TabsContent>
  )
}
;(SmartPageTabPanel as any)._smartTabRole = "panel"
