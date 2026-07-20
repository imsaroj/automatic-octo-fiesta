"use client"

import * as React from "react"

/**
 * Row-density presets. Declared here (rather than imported from `data-grid`) so
 * the provider stays a leaf module the grid can depend on without a cycle — the
 * union is identical to the grid's `DataGridDensity`.
 */
export type SmartUIDensity = "compact" | "normal" | "comfortable"

/**
 * Every built-in user-facing string, grouped by area. Values are plain strings
 * or functions for the few that interpolate (e.g. a selected-row count). This
 * map is the label API: keys are stable, additive, and overridable per-area via
 * {@link SmartUIProvider}. English is the built-in default ({@link DEFAULT_LABELS}).
 *
 * Not every hard-coded string in the library reads from here yet — the highest-
 * traffic surfaces (grid, search, confirm, form) do, and the rest are being
 * migrated onto these keys incrementally.
 */
export interface SmartUILabels {
  grid: {
    /** Overlay shown during the first load. */
    loading: string
    /** Error overlay headline. */
    errorTitle: string
    /** Error overlay retry button. */
    retry: string
    /** `aria-label` on the infinite-scroll "loading more" bar. */
    loadingMore: string
    /** Selected-row count, e.g. `(3) => "3 selected"`. */
    selected: (count: number) => string
    /** Empty-state copy when there are no rows. */
    empty: { title: string; description: string }
    /** Placeholder in the client grid's quick-search box. */
    searchPlaceholder: string
  }
  search: {
    /** Search-submit button. */
    search: string
    /** Reset button. */
    reset: string
  }
  confirm: {
    /** Default confirm-dialog headline. */
    title: string
    /** Confirm button. */
    confirm: string
    /** Cancel button. */
    cancel: string
  }
  form: {
    /** Default submit button. */
    submit: string
  }
}

/**
 * App-wide fallbacks for per-instance props. A component prop always wins; when
 * omitted, the value here applies (built-in canonical values in
 * {@link DEFAULT_DEFAULTS}).
 */
export interface SmartUIDefaults {
  grid: {
    pageSize: number
    density: SmartUIDensity
    pageSizeOptions: number[]
  }
  form: {
    columns: 1 | 2 | 3 | 4
  }
}

/**
 * Formatting hooks shared across date/number-rendering components. All optional;
 * a component uses its own formatting when a hook is absent. (Wiring these into
 * the calendar/date pickers is in progress — the shape is stable.)
 */
export interface SmartUIFormats {
  /** A `date-fns` (or compatible) locale forwarded to calendar/date pickers. */
  locale?: unknown
  /** Format a `Date` for display. */
  formatDate?: (date: Date) => string
  /** Format a number for display. */
  formatNumber?: (value: number) => string
}

/** The fully-resolved configuration read by components. */
export interface SmartUIConfig {
  labels: SmartUILabels
  defaults: SmartUIDefaults
  formats: SmartUIFormats
}

/** A recursive partial that treats functions and arrays as leaf values. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends readonly unknown[]
      ? T[K]
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K]
}

/** Built-in English labels — the fallback when no provider overrides a key. */
export const DEFAULT_LABELS: SmartUILabels = {
  grid: {
    loading: "Loading data…",
    errorTitle: "Couldn’t load data",
    retry: "Retry",
    loadingMore: "Loading more rows",
    selected: (count) => `${count} selected`,
    empty: {
      title: "No data",
      description: "There is nothing to display yet.",
    },
    searchPlaceholder: "Search…",
  },
  search: { search: "Search", reset: "Reset" },
  confirm: { title: "Are you sure?", confirm: "Confirm", cancel: "Cancel" },
  form: { submit: "Submit" },
}

/** Built-in canonical defaults — match each component's own literal fallback. */
export const DEFAULT_DEFAULTS: SmartUIDefaults = {
  grid: { pageSize: 20, density: "normal", pageSizeOptions: [5, 10, 20, 50] },
  form: { columns: 1 },
}

const DEFAULT_CONFIG: SmartUIConfig = {
  labels: DEFAULT_LABELS,
  defaults: DEFAULT_DEFAULTS,
  formats: {},
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * Deep-merge an override over a base, treating functions and arrays as leaves
 * (a provided array/function replaces wholesale; only nested plain objects
 * recurse). Undefined override values are skipped so a partial override keeps
 * its siblings.
 */
const deepMerge = <T,>(base: T, override: DeepPartial<T> | undefined): T => {
  if (!override) return base
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const key of Object.keys(override)) {
    const next = (override as Record<string, unknown>)[key]
    if (next === undefined) continue
    const prev = (base as Record<string, unknown>)[key]
    out[key] =
      isPlainObject(prev) && isPlainObject(next)
        ? deepMerge(prev, next as DeepPartial<typeof prev>)
        : next
  }
  return out as T
}

const SmartUIContext = React.createContext<SmartUIConfig>(DEFAULT_CONFIG)

export interface SmartUIProviderProps {
  /** Per-area label overrides, deep-merged over English (and any parent provider). */
  labels?: DeepPartial<SmartUILabels>
  /** Default prop values, deep-merged over the canonical defaults. */
  defaults?: DeepPartial<SmartUIDefaults>
  /** Shared date/number formatting hooks. */
  formats?: SmartUIFormats
  children: React.ReactNode
}

/**
 * Optional global configuration for `@iamsaroj/smart-ui`: app-wide labels
 * (i18n), default prop values, and formatting hooks. Mount it once near the app
 * root; nested providers compose (a child's overrides merge over its parent's).
 * With no provider, components behave exactly as before (English + canonical
 * defaults), so it is purely additive.
 *
 * ```tsx
 * <SmartUIProvider
 *   labels={{ confirm: { confirm: "삭제", cancel: "취소" }, grid: { retry: "다시 시도" } }}
 *   defaults={{ grid: { pageSize: 50, density: "compact" } }}
 * >
 *   <App />
 * </SmartUIProvider>
 * ```
 */
export const SmartUIProvider = ({
  labels,
  defaults,
  formats,
  children,
}: SmartUIProviderProps) => {
  const parent = React.useContext(SmartUIContext)
  const value = React.useMemo<SmartUIConfig>(
    () => ({
      labels: deepMerge(parent.labels, labels),
      defaults: deepMerge(parent.defaults, defaults),
      formats: formats ? { ...parent.formats, ...formats } : parent.formats,
    }),
    [parent, labels, defaults, formats]
  )
  return (
    <SmartUIContext.Provider value={value}>{children}</SmartUIContext.Provider>
  )
}

/** Read the whole resolved config (labels + defaults + formats). */
export const useSmartUI = (): SmartUIConfig => React.useContext(SmartUIContext)

/** Read the resolved label map — English merged with any provider overrides. */
export const useSmartUILabels = (): SmartUILabels =>
  React.useContext(SmartUIContext).labels

/** Read the resolved default prop values. */
export const useSmartUIDefaults = (): SmartUIDefaults =>
  React.useContext(SmartUIContext).defaults

/** Read the shared formatting hooks (may be empty). */
export const useSmartUIFormats = (): SmartUIFormats =>
  React.useContext(SmartUIContext).formats
