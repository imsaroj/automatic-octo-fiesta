"use client"

import * as React from "react"
import { z } from "zod"
import { Loader2, RotateCcw, Search } from "lucide-react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { Badge } from "@iamsaroj/smart-ui/components/badge"
import {
  SmartForm,
  defaultFieldRegistry,
  type FieldRegistry,
} from "@iamsaroj/smart-ui/form"
import { useSmartUILabels } from "@iamsaroj/smart-ui/smart-components/provider"

import type { SearchFieldDefinition } from "./types"
import { buildSearchQuery, countActiveFilters } from "./build-query"

/** Loose fallback schema when the consumer supplies none — validates nothing. */
const PASSTHROUGH_SCHEMA = z.looseObject({})

/**
 * Responsive column classes per `columns` setting. Unlike SmartForm's fixed
 * grid, a search bar should collapse on smaller screens: one column on mobile,
 * two on tablet, the requested count on desktop. Passed as SmartForm's
 * `className`, where tailwind-merge lets it override the fixed `grid-cols-*`.
 */
const RESPONSIVE_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const

export interface SmartSearchFormProps<T extends Record<string, unknown>> {
  /** Search fields — same shape as form fields, narrowed to search controls. */
  fields: SearchFieldDefinition<T>[]
  /**
   * Zod schema — validated before a search fires. Optional: with no schema every
   * value is accepted. When present, required-ness / the asterisk derive from it.
   */
  schema?: z.ZodType<T>
  /** Controlled search state. Own it in the parent to wire URL-sync or presets. */
  data?: T
  /** Kept in sync with every field edit. */
  setData?: (data: T) => void
  /**
   * The empty state Reset returns to. Defaults to each field type's blank value
   * (from the registry), so you rarely need to pass it.
   */
  defaultValues?: T
  /** Grid columns on desktop. Collapses responsively (2 on tablet, 1 on mobile). Default `1`. */
  columns?: 1 | 2 | 3 | 4

  /**
   * Manual search: show the Search button and only emit on submit / Enter.
   * Default `true`. Pass `search={false}` (or {@link autoSearch}) for auto mode.
   */
  search?: boolean
  /**
   * Auto search: emit automatically (debounced) whenever a filter changes, with
   * no Search button. Takes precedence over {@link search}.
   */
  autoSearch?: boolean
  /** Debounce for auto search, in ms. Default `400`. */
  debounce?: number
  /** Show the Reset button. Default `true`. */
  reset?: boolean
  /** In manual mode, also run the search after a reset. Default `false`. */
  searchOnReset?: boolean

  /** Called with the pruned, validated query — only meaningful values. */
  onSearch?: (query: Partial<T>) => void
  /** Alias of {@link onSearch} to match the `<SForm onSubmit>` convention. */
  onSubmit?: (query: Partial<T>) => void
  /** Called after fields are cleared to their defaults. */
  onReset?: () => void

  /** Show a spinner + disable actions while a search is in flight. */
  loading?: boolean
  /** Show a badge with the active-filter count on the Search button. */
  showCount?: boolean
  searchLabel?: React.ReactNode
  resetLabel?: React.ReactNode
  /** Extra controls rendered at the start of the action bar (before Reset). */
  actions?: React.ReactNode

  /** Custom field registry, merged over the built-in one (e.g. async selects). */
  registry?: FieldRegistry
  className?: string
}

/**
 * A declarative, reusable **search / filter bar** built on {@link SmartForm}.
 * Supply the fields (and optionally a Zod schema) and it renders the right
 * control per filter, validates, prunes empty values into a clean query, and
 * emits it — either on demand (manual) or automatically as filters change.
 *
 * ```tsx
 * // Manual — search on click / Enter
 * <SmartSearchForm
 *   data={search}
 *   setData={setSearch}
 *   fields={searchFields}
 *   schema={searchSchema}
 *   columns={4}
 *   reset
 *   onSearch={(query) => setFilters(toFilters(query))}
 * />
 *
 * // Auto — debounced search as you type
 * <SmartSearchForm data={search} setData={setSearch} fields={searchFields} autoSearch />
 * ```
 *
 * @remarks
 * Composes `SmartForm` rather than reimplementing it, so validation, required
 * derivation, layout, and error display are shared. Keep `data`/`setData` in the
 * parent to layer URL synchronization, saved searches, or filter presets on top
 * without changes here.
 */
export const SmartSearchForm = <T extends Record<string, unknown>>({
  fields,
  schema,
  data,
  setData,
  defaultValues,
  columns = 1,
  search = true,
  autoSearch,
  debounce = 400,
  reset = true,
  searchOnReset = false,
  onSearch,
  onSubmit,
  onReset,
  loading = false,
  showCount = false,
  searchLabel,
  resetLabel,
  actions,
  registry,
  className,
}: SmartSearchFormProps<T>) => {
  const auto = autoSearch === true || !search
  const emitFn = onSearch ?? onSubmit

  // Button labels fall back to the provider (English by default); props win.
  const labels = useSmartUILabels().search
  const resolvedSearchLabel = searchLabel ?? labels.search
  const resolvedResetLabel = resetLabel ?? labels.reset

  // The blank state a Reset returns to: each field type's registry default,
  // overlaid with any explicit `defaultValues`.
  const defaults = React.useMemo<T>(() => {
    const reg = registry ?? defaultFieldRegistry
    const base: Record<string, unknown> = {}
    for (const field of fields) base[field.name] = reg[field.type]?.defaultValue
    return { ...base, ...defaultValues } as T
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, registry])

  // Live values: the controlled `data` is the source of truth when provided;
  // otherwise fall back to internal state so an uncontrolled bar still works and
  // auto-search has something to observe. Deriving (rather than mirroring in an
  // effect) keeps external `data` changes — async load, URL restore — in sync
  // with no extra render.
  const isControlled = data !== undefined
  const [internal, setInternal] = React.useState<T>(() => ({
    ...defaults,
    ...data,
  }))
  const values = isControlled ? (data as T) : internal

  const handleSetData = React.useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next)
      setData?.(next)
    },
    [isControlled, setData]
  )

  // Serialized last-emitted query — dedupes auto-search so identical filter
  // states don't refire. Seeded on mount so the initial render doesn't search.
  const lastEmittedRef = React.useRef<string | undefined>(undefined)

  const emit = React.useCallback(
    (raw: T, { dedupe }: { dedupe: boolean }) => {
      const query = buildSearchQuery(raw)
      const serialized = JSON.stringify(query)
      if (dedupe && serialized === lastEmittedRef.current) return
      lastEmittedRef.current = serialized
      emitFn?.(query)
    },
    [emitFn]
  )

  // Auto search: debounce on value changes, gated by schema validation so an
  // invalid filter (bad email, reversed range) never fires a request. Seed the
  // dedupe ref on the first run so mount doesn't trigger an unwanted search.
  const mountedRef = React.useRef(false)
  React.useEffect(() => {
    if (!auto) return
    if (!mountedRef.current) {
      mountedRef.current = true
      lastEmittedRef.current = JSON.stringify(buildSearchQuery(values))
      return
    }
    const id = setTimeout(() => {
      if (schema && !schema.safeParse(values).success) return
      emit(values, { dedupe: true })
    }, debounce)
    return () => clearTimeout(id)
  }, [auto, values, debounce, schema, emit])

  const handleReset = React.useCallback(() => {
    handleSetData(defaults)
    lastEmittedRef.current = undefined
    onReset?.()
    // Auto mode re-searches via the debounced effect once `values` updates; in
    // manual mode only re-run when explicitly asked.
    if (!auto && searchOnReset) emit(defaults, { dedupe: false })
  }, [handleSetData, defaults, onReset, auto, searchOnReset, emit])

  const activeCount = React.useMemo(() => countActiveFilters(values), [values])

  const showSearchButton = !auto
  const showResetButton = reset
  const hasActions = showSearchButton || showResetButton || actions != null

  const actionBar = hasActions ? (
    <div className="flex items-center justify-end gap-2 pt-1">
      {actions}
      {showResetButton && (
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          onClick={handleReset}
        >
          <RotateCcw />
          {resolvedResetLabel}
        </Button>
      )}
      {showSearchButton && (
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {resolvedSearchLabel}
          {showCount && activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  ) : null

  return (
    <SmartForm<T>
      schema={schema ?? (PASSTHROUGH_SCHEMA as unknown as z.ZodType<T>)}
      data={values}
      setData={handleSetData}
      fields={fields}
      columns={columns}
      registry={registry}
      className={cn(RESPONSIVE_COLS[columns], className)}
      // Manual submit path: SmartForm validates, then hands over the valid
      // values — prune and emit (no dedupe: an explicit Search should always run).
      onSubmit={(valid) => emit(valid, { dedupe: false })}
      submitLabel={null}
    >
      {/* `undefined` (not `null`) so SmartForm renders no action row at all. */}
      {actionBar ?? undefined}
    </SmartForm>
  )
}

/**
 * Alias of {@link SmartSearchForm}.
 *
 * @deprecated Prefer {@link SmartSearchForm} — the canonical name. `SearchEngine`
 * is kept for backward compatibility and will be removed in a future major.
 */
export const SearchEngine = SmartSearchForm
