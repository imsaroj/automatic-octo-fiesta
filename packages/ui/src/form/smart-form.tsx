"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import {
  useSmartUIDefaults,
  useSmartUILabels,
} from "@iamsaroj/smart-ui/smart-components/provider"

import { deepEqual, isFieldRequired } from "./smart-form-internals"
import type { FieldDefinition, ResolvedFieldDefinition } from "./field-types"
import {
  defaultFieldRegistry,
  type FieldRegistry,
  type CommonFieldProps,
} from "./field-registry"
import { useSelector } from "@tanstack/react-store"

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const
const SPAN = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
} as const

/** Imperative handle exposed via `ref` — re-initialize or submit the form. */
export interface SmartFormHandle<T extends Record<string, unknown>> {
  /**
   * Re-initialize the form to `values` (merged over `initialData`), or back to
   * the initial seed when omitted — clearing errors, touched, and submit state.
   * The explicit alternative to the `key={id}` remount trick for editing a
   * different record.
   */
  reset: (values?: Partial<T>) => void
  /** Programmatically submit (runs validation, then `onSubmit` if it passes). */
  submit: () => void
}

export interface SmartFormProps<T extends Record<string, unknown>> {
  /** Zod schema — the single source of truth for validation *and* required-ness. */
  schema: z.ZodType<T>
  /** Controlled form data. Seeds the form on mount and stays mirrored to edits. */
  data?: T
  /** Kept in sync with every edit — no manual per-field wiring required. */
  setData?: (data: T) => void
  /**
   * One-time seed for an **uncontrolled** form — initializes the fields but is
   * *not* mirrored back (unlike {@link data}). Use it for create/edit initial
   * values, then call `ref.reset(row)` to load a different record with no
   * `key={id}` remount. When both are given, `data` wins for the seed.
   */
  initialData?: Partial<T>
  /**
   * Current form mode (e.g. `"create"` | `"edit"`). A field whose `modes` list
   * excludes the active mode is dropped from render **and** validation, so a
   * single schema serves every mode. Omit for no mode filtering.
   */
  mode?: string
  fields: FieldDefinition<T>[]
  /** Number of grid columns. Default `1`. */
  columns?: 1 | 2 | 3 | 4
  /** Called with the parsed, validated values on a successful submit. */
  onSubmit?: (data: T) => void | Promise<void>
  /** `id` on the `<form>`, so a submit button placed outside can drive it via `form={id}`. */
  id?: string
  /** Label for the submit button. Pass `null` to suppress and use `children` instead. */
  submitLabel?: React.ReactNode | null
  /** Label for an optional reset button (resets to the initial `data`). */
  resetLabel?: string
  /** Rendered inside the form after the field grid (replaces default button row when provided). */
  children?: React.ReactNode
  className?: string
  /**
   * Custom field registry, merged over the built-in one. Use {@link registerField}
   * to add or override field types without forking the engine.
   */
  registry?: FieldRegistry
}

// Inner (pre-forwardRef) implementation. The public `SmartForm` — with its
// generic call signature and docs — is the cast wrapper below.
const SmartFormInner = <T extends Record<string, unknown>>(
  {
    schema,
    data,
    setData,
    initialData,
    mode,
    fields,
    columns,
    onSubmit,
    id,
    submitLabel,
    resetLabel,
    children,
    className,
    registry: registryProp,
  }: SmartFormProps<T>,
  ref: React.ForwardedRef<SmartFormHandle<T>>
) => {
  // Provider fallbacks: an explicit prop always wins. `submitLabel` uses an
  // `undefined` check (not `??`) because `null` is meaningful — it suppresses
  // the default button row in favor of `children`.
  const uiDefaults = useSmartUIDefaults()
  const uiLabels = useSmartUILabels()
  const effectiveColumns = columns ?? uiDefaults.form.columns
  const effectiveSubmitLabel =
    submitLabel === undefined ? uiLabels.form.submit : submitLabel

  // Resolved once per form: custom entries merged over the built-in registry.
  const registry = React.useMemo<FieldRegistry>(
    () =>
      registryProp
        ? { ...defaultFieldRegistry, ...registryProp }
        : (defaultFieldRegistry as FieldRegistry),
    [registryProp]
  )

  // The empty value a field starts at when `data` omits it — sourced from the
  // registry entry so custom field types bring their own default.
  const defaultForField = React.useCallback(
    (field: FieldDefinition<T>): unknown => registry[field.type]?.defaultValue,
    [registry]
  )

  // A field is active when it declares no `modes`, or no `mode` is set, or its
  // `modes` include the active one. Inactive fields are dropped from render,
  // validation, and the submitted value.
  const isActiveInMode = React.useCallback(
    (field: FieldDefinition<T>): boolean =>
      !field.modes || mode === undefined || field.modes.includes(mode),
    [mode]
  )

  // Field names excluded by the active mode — omitted from validation + submit.
  const modeExcludedKeys = React.useMemo(
    () => fields.filter((field) => !isActiveInMode(field)).map((f) => f.name),
    [fields, isActiveInMode]
  )

  // A mode-scoped schema: omit the excluded field keys so one schema validates
  // in every mode. Requires a plain `ZodObject` (has `.omit`); a schema wrapped
  // in `.refine`/`.superRefine` can't be scoped, so it validates as-is — make
  // mode-only fields `.optional()` in that case, and note cross-field refinements
  // see the excluded fields' raw store values, not `undefined`.
  const scopedSchema = React.useMemo<z.ZodType<T>>(() => {
    if (modeExcludedKeys.length === 0) return schema
    const maybeObject = schema as unknown as {
      omit?: (mask: Record<string, true>) => z.ZodType<T>
    }
    if (typeof maybeObject.omit !== "function") return schema
    const mask: Record<string, true> = {}
    for (const key of modeExcludedKeys) mask[key] = true
    return maybeObject.omit(mask)
  }, [schema, modeExcludedKeys])

  // Strip mode-excluded keys from the value handed to `onSubmit`, so an edit-mode
  // submit never carries a create-only field's blank default.
  const stripExcluded = React.useCallback(
    (value: T): T => {
      if (modeExcludedKeys.length === 0) return value
      const out = { ...(value as Record<string, unknown>) }
      for (const key of modeExcludedKeys) delete out[key]
      return out as T
    },
    [modeExcludedKeys]
  )

  // Mount-time defaults: field-type blanks, overridden by `initialData` (seed
  // only), then by any controlled `data`.
  const defaultValues = React.useMemo<T>(() => {
    const base: Record<string, unknown> = {}
    for (const field of fields) base[field.name] = defaultForField(field)
    return {
      ...base,
      ...(initialData as Record<string, unknown>),
      ...(data as Record<string, unknown>),
    } as T
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The current form baseline. Kept in sync with `form.reset` in the reconcile
  // effect so it matches the `defaultValues` TanStack re-applies on every render
  // (`useForm` calls `form.update(opts)` each render): if they diverged, that
  // update would revert an adopted external value straight back to the stale
  // mount baseline.
  const [baseline, setBaseline] = React.useState<T>(defaultValues)

  // Fields the schema treats as optional (and that aren't forced required in the
  // definition). For these, an empty string means "not provided", so it should
  // pass rather than fail — e.g. `z.email().optional()` shouldn't flag a blank.
  const optionalKeys = React.useMemo(() => {
    const set = new Set<string>()
    for (const field of fields) {
      if (field.required) continue
      if (!isFieldRequired(schema, field.name)) set.add(field.name)
    }
    return set
  }, [schema, fields])

  // Normalize empty optional strings to `undefined` before validation so an
  // optional field only validates once the user actually types something.
  // Required fields keep their empty string, so their own messages still fire.
  const validationSchema = React.useMemo(
    () =>
      z.preprocess((raw) => {
        if (raw == null || typeof raw !== "object") return raw
        const out = { ...(raw as Record<string, unknown>) }
        for (const key of optionalKeys)
          if (out[key] === "") out[key] = undefined
        return out
      }, scopedSchema as z.ZodType),
    [scopedSchema, optionalKeys]
  )

  const form = useForm({
    defaultValues: baseline,
    // Zod v4 schemas are Standard Schemas; TanStack types the validator input as
    // `T` while Zod reports `unknown`. Runtime-identical, so the cast only bridges
    // that TS-only divergence — validation runs exactly as written.
    validators: {
      onChange: validationSchema as never,
      onSubmit: validationSchema as never,
    },
    onSubmit: ({ value }) => onSubmit?.(stripExcluded(value as T)),
  })

  const values = useSelector(form.store, (state) => state.values) as T
  // A submit attempt should reveal every error, even for fields never blurred.
  const submitAttempted = useSelector(
    form.store,
    (state) => state.submissionAttempts > 0
  )
  const lastSyncedRef = React.useRef<T>(defaultValues)
  // Set right before we push our own edits into `setData`, so the resulting
  // `data` change is recognized as *our* echo (not an external override) and
  // doesn't trigger a form reset — see the two sync effects below.
  const selfUpdateRef = React.useRef(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  // On a failed submit, move focus to the first field (in definition order) that
  // has an error, so the user lands right where they need to fix things.
  const focusFirstError = React.useCallback(() => {
    for (const field of fields) {
      const meta = form.getFieldMeta(field.name as never)
      if (!meta || (meta.errors?.length ?? 0) === 0) continue
      const wrapper = formRef.current?.querySelector<HTMLElement>(
        `[data-field="${CSS.escape(field.name)}"]`
      )
      // Focus the first focusable control inside the field — works across every
      // control type (input, trigger button, etc.) without threading ids around.
      wrapper
        ?.querySelector<HTMLElement>(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        )
        ?.focus()
      break
    }
  }, [fields, form])

  // Imperative handle: re-initialize (no `key` remount) or submit. `reset`
  // rebuilds the seed from field blanks + `initialData` + the passed `values`
  // and adopts it as the new baseline, clearing all field/submit state — the
  // same lockstep-baseline discipline the reconcile effect uses.
  React.useImperativeHandle(
    ref,
    (): SmartFormHandle<T> => ({
      reset: (values) => {
        const base: Record<string, unknown> = {}
        for (const field of fields) base[field.name] = defaultForField(field)
        const next = {
          ...base,
          ...(initialData as Record<string, unknown>),
          ...(values as Record<string, unknown>),
        } as T
        lastSyncedRef.current = next
        setBaseline(next)
        form.reset(next as never)
      },
      submit: () => void form.handleSubmit().then(focusFirstError),
    }),
    [fields, defaultForField, initialData, form, focusFirstError]
  )

  // Mirror live form values back into the consumer's `setData`.
  React.useEffect(() => {
    if (!setData) return
    if (deepEqual(values, lastSyncedRef.current)) return
    lastSyncedRef.current = values
    // Flag the `data` update this triggers as self-originated so the reconcile
    // effect skips it. Without this, rapid edits race: `values` runs ahead of
    // the mirrored `data`, the reconcile effect sees them differ and resets the
    // form back to the stale `data`, which loops (max update depth).
    selfUpdateRef.current = true
    setData(values)
  }, [values, setData])

  // Reconcile external `data` changes (async load / programmatic reset) into the
  // form — e.g. `setData(EMPTY)` after a successful submit. `form.reset(values)`
  // adopts them as the new baseline and clears *all* state (field meta *and*
  // `submissionAttempts`), so the fresh values start pristine: no lingering
  // blurred/touched flags and no leftover submit attempt keeping errors visible.
  React.useEffect(() => {
    if (data === undefined) return
    // Ignore the `data` change our own mirror effect just produced — adopting it
    // back into the form would fight live edits (and can loop under rapid input).
    if (selfUpdateRef.current) {
      selfUpdateRef.current = false
      return
    }
    if (deepEqual(data, lastSyncedRef.current)) return
    lastSyncedRef.current = data
    const base: Record<string, unknown> = {}
    for (const field of fields) base[field.name] = defaultForField(field)
    const next = { ...base, ...(data as Record<string, unknown>) } as T
    // Advance the baseline in lockstep so the per-render `form.update(opts)` sees
    // no defaultValues change and leaves the freshly adopted values in place.
    setBaseline(next)
    form.reset(next as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <form
      ref={formRef}
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit().then(focusFirstError)
      }}
      className={cn("grid gap-4", COLS[effectiveColumns], className)}
    >
      {fields.map((field) => {
        if (!isActiveInMode(field)) return null
        if (field.hidden?.(values)) return null

        const spanClass = field.colSpan ? SPAN[field.colSpan] : undefined
        const required = field.required ?? isFieldRequired(schema, field.name)

        return (
          <form.Field key={field.name} name={field.name as never}>
            {(fieldApi) => {
              // Validation runs live (`onChange` schema), but errors only *display*
              // after the field is blurred — so typing doesn't flash an error, yet
              // once shown it clears in real time as the value becomes valid. A
              // submit attempt reveals errors on every field, blurred or not.
              const meta = fieldApi.state.meta
              const error =
                meta.isBlurred || submitAttempted
                  ? getErrorMessage(meta.errors)
                  : undefined

              return (
                // `onBlur` bubbles from whatever control is inside (React blur is
                // focusout), so the field flips to blurred/touched when focus leaves
                // without every field component needing to forward an onBlur prop.
                <div
                  className={spanClass}
                  data-field={field.name}
                  onBlur={() => fieldApi.handleBlur()}
                >
                  <FieldRenderer
                    field={field}
                    registry={registry}
                    required={required}
                    value={fieldApi.state.value}
                    onChange={(v) => fieldApi.handleChange(v as never)}
                    error={error}
                  />
                </div>
              )
            }}
          </form.Field>
        )
      })}

      {children !== undefined ? (
        <div className={SPAN[effectiveColumns]}>{children}</div>
      ) : effectiveSubmitLabel !== null ? (
        <div
          className={cn(
            "flex items-center justify-end gap-2 pt-1",
            SPAN[effectiveColumns]
          )}
        >
          {resetLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              {resetLabel}
            </Button>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {effectiveSubmitLabel}
              </Button>
            )}
          </form.Subscribe>
        </div>
      ) : null}
    </form>
  )
}

const SmartFormForwarded = React.forwardRef(SmartFormInner)
SmartFormForwarded.displayName = "SmartForm"

/**
 * Declarative form engine on **TanStack Form + Zod**: supply a Zod schema and a
 * field definition array — the engine renders the right control for each field,
 * validates against the schema (live, per-field), and surfaces errors inline.
 *
 * The schema is the single source of truth: validation *and* the required
 * asterisk are both derived from it, so field definitions stay UI-only. Pass
 * `data`/`setData` to mirror the live values into your own state; both are
 * optional — the form owns its state either way. For create/edit, seed with
 * `initialData` and re-load a record via the `ref` handle's `reset(row)` (no
 * `key` remount), and gate create/edit-only fields with per-field `modes` + the
 * `mode` prop so one schema serves both.
 *
 * ```tsx
 * const schema = z.object({ name: z.string().min(1), email: z.email().optional() })
 * type Form = z.infer<typeof schema>
 *
 * const fields: FieldDefinition<Form>[] = [
 *   { name: "name", type: "text",  label: "Name" },
 *   { name: "email", type: "email", label: "Email" },
 * ]
 *
 * <SmartForm schema={schema} fields={fields} onSubmit={(value) => save(value)} />
 * ```
 *
 * `forwardRef` erases generics, so the call signature is re-asserted below — the
 * standard "generic forwardRef" cast, runtime unchanged.
 */
export const SmartForm = SmartFormForwarded as <
  T extends Record<string, unknown>,
>(
  props: SmartFormProps<T> & { ref?: React.ForwardedRef<SmartFormHandle<T>> }
) => React.ReactElement

/** The subset of a Standard-Schema validation issue we read for display. */
interface StandardSchemaIssue {
  message: string
}

const isStandardSchemaIssue = (value: unknown): value is StandardSchemaIssue =>
  typeof value === "object" &&
  value !== null &&
  "message" in value &&
  typeof (value as { message: unknown }).message === "string"

/** Normalize TanStack field errors (strings or Standard-Schema issues) to text. */
const getErrorMessage = (
  errors: ReadonlyArray<unknown>
): string | undefined => {
  const first = errors?.[0]
  if (first == null) return undefined
  if (typeof first === "string") return first
  if (isStandardSchemaIssue(first)) return first.message
  return undefined
}

const FieldRenderer = <T extends Record<string, unknown>>({
  field,
  registry,
  required,
  value,
  onChange,
  error,
}: {
  field: FieldDefinition<T>
  registry: FieldRegistry
  required: boolean
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) => {
  const entry = registry[field.type]
  if (!entry) return null

  const common: CommonFieldProps = {
    label: field.label,
    placeholder: field.placeholder,
    description: field.description,
    error,
    required,
    disabled: field.disabled,
  }

  const Component = entry.component
  return (
    <Component
      {...entry.mapProps({
        // Every union variant is assignable to the wide resolved shape the
        // registry reads from; the union narrows *authoring*, not runtime. The
        // `hidden` callback is contravariant in `T`, so bridge via `unknown`.
        field: field as unknown as ResolvedFieldDefinition,
        common,
        value,
        setValue: onChange,
      })}
    />
  )
}
