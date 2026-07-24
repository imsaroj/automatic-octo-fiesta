"use client"

import * as React from "react"

// Type-only, and the layout engine imports nothing but `lib/utils` — the
// provider stays the leaf module every layer can depend on.
import type {
  GapValue,
  GridColumnsValue,
  Responsive,
} from "@iamsaroj/smart-ui/layout"
// Type-only, and `page/error-kind` imports nothing at all — the kind union stays
// defined next to its classification logic while the label map still fails to
// compile if a kind is added and left untranslated.
import type { SmartPageErrorKind } from "./page/error-kind"

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
    /**
     * Submit button text for a form that asks for one with `submitLabel`
     * (`true` takes this; a `SmartForm` with no `submitLabel` renders no
     * button).
     */
    submit: string
    /** Placeholder shown in a select/combobox while async options load. */
    loadingOptions: string
    /**
     * The blank choice at the top of an **optional** select/combobox — picking
     * it clears the field. Never shown on a required one.
     */
    emptyOption: string
  }
  /** Failure states — {@link SmartPageError} and its error boundary. */
  error: {
    /** Retry button. */
    retry: string
    /** Retry button while an async retry is in flight. */
    retrying: string
    /** Disclosure toggle above the diagnostics blob. */
    details: string
    /** Copy-diagnostics button. */
    copy: string
    /** Copy-diagnostics button, for ~2s after a successful copy. */
    copied: string
    /** Auto-retry countdown, e.g. `(4) => "Retrying in 4s"`. */
    autoRetryIn: (seconds: number) => string
    /** Cancels the auto-retry countdown. */
    cancel: string
    /** Shown while the browser reports no connection. */
    offlineHint: string
    /** Prefix on the trace-id chip. */
    traceLabel: string
    /** Headline + supporting sentence per failure kind. */
    kinds: Record<SmartPageErrorKind, { title: string; description: string }>
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
    /**
     * Default grid columns for `SmartForm` / `SmartSearchForm` — any value the
     * layout engine accepts, including a per-breakpoint map
     * (`{ base: 1, md: 12 }`) or intrinsic tracks
     * (`{ auto: "fit", min: "16rem" }`).
     */
    columns: Responsive<GridColumnsValue>
    /** Default gap between fields. */
    gap: Responsive<GapValue>
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
  form: { submit: "Submit", loadingOptions: "Loading…", emptyOption: "Select" },
  error: {
    retry: "Try again",
    retrying: "Retrying…",
    details: "Technical details",
    copy: "Copy details",
    copied: "Copied",
    autoRetryIn: (seconds) => `Retrying in ${seconds}s`,
    cancel: "Cancel",
    offlineHint: "We'll retry as soon as you're back online.",
    traceLabel: "Trace",
    // Written to be true of the situation and useful to the reader: what
    // happened, and what (if anything) they can do about it. No apologies, no
    // "oops", and no blaming the user for a 403.
    kinds: {
      error: {
        title: "Something went wrong",
        description: "An unexpected error stopped this view from loading.",
      },
      network: {
        title: "Can't reach the server",
        description:
          "Check your connection — the request never made it through.",
      },
      timeout: {
        title: "This is taking too long",
        description: "The server didn't answer in time. It may just be busy.",
      },
      rateLimited: {
        title: "Too many requests",
        description:
          "You've hit the rate limit. Give it a moment before trying again.",
      },
      unauthorized: {
        title: "Your session has expired",
        description: "Sign in again to continue where you left off.",
      },
      forbidden: {
        title: "You don't have access to this",
        description:
          "Ask an administrator if you need permission for this area.",
      },
      notFound: {
        title: "Not found",
        description:
          "This page or record doesn't exist, or it has been removed.",
      },
      server: {
        title: "The server hit an error",
        description:
          "Nothing is wrong on your side. The team can look it up by trace id.",
      },
      maintenance: {
        title: "Down for maintenance",
        description:
          "This service is temporarily unavailable. It should be back shortly.",
      },
    },
  },
}

/** Built-in canonical defaults — match each component's own literal fallback. */
export const DEFAULT_DEFAULTS: SmartUIDefaults = {
  grid: { pageSize: 20, density: "normal", pageSizeOptions: [5, 10, 20, 50] },
  form: { columns: 1, gap: "md" },
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
