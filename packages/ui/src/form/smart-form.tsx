"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { ChevronDown } from "lucide-react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { Separator } from "@iamsaroj/smart-ui/components/separator"
import {
  GridLayoutProvider,
  resolveLayoutPreset,
  SmartGridItem,
  SmartGridLayout,
  useGridLayout,
  type GridLayoutOptions,
  type LayoutPreset,
} from "@iamsaroj/smart-ui/layout"
import {
  useSmartUIDefaults,
  useSmartUILabels,
} from "@iamsaroj/smart-ui/smart-components/provider"

import { deepEqual, schemaAcceptsUndefined } from "./smart-form-internals"
import type { FieldDefinition, ResolvedFieldDefinition } from "./field-types"
import {
  buildSectionPathMap,
  collectModeExcludedKeys,
  DEFAULT_SECTION_SPAN,
  flattenFields,
  isFieldNode,
  isSectionNode,
  sectionNodeId,
  type FormNode,
  type FormSection,
} from "./form-nodes"
import {
  defaultFieldRegistry,
  fieldDefaultValue,
  type FieldRegistry,
  type CommonFieldProps,
} from "./field-registry"
import { useSelector } from "@tanstack/react-store"

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

export interface SmartFormProps<
  T extends Record<string, unknown>,
> extends GridLayoutOptions {
  /**
   * Zod schema — the single source of truth for **validation**. It does not
   * drive presentation: the required asterisk comes from each field's own
   * `required` flag.
   */
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
   * Current form mode (e.g. `"create"` | `"edit"`). A field — or a whole
   * section — whose `modes` list excludes the active mode is dropped from
   * render **and** validation, so a single schema serves every mode. Omit for
   * no mode filtering.
   */
  mode?: string
  /**
   * The form's layout tree: fields, plus optional `section` / `custom` /
   * `divider` nodes. Sections nest, each with its own column count.
   */
  fields: FormNode<T>[]
  /**
   * Start from a named layout ({@link LAYOUT_PRESETS}) — `"twelve"`, `"pair"`,
   * `"fluid"`, … — and override any part of it with the layout props.
   */
  preset?: LayoutPreset
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
    preset,
    columns,
    gap,
    columnGap,
    rowGap,
    dense,
    align,
    justify,
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
  const effectiveSubmitLabel =
    submitLabel === undefined ? uiLabels.form.submit : submitLabel

  // Layout resolution order: explicit props → preset → provider defaults. The
  // provider only fills what neither of the first two spoke to.
  const layoutOptions = React.useMemo<GridLayoutOptions>(() => {
    const merged = resolveLayoutPreset(preset, {
      columns,
      gap,
      columnGap,
      rowGap,
      dense,
      align,
      justify,
    })
    return {
      ...merged,
      columns: merged.columns ?? uiDefaults.form.columns,
      gap: merged.gap ?? uiDefaults.form.gap,
    }
  }, [
    preset,
    columns,
    gap,
    columnGap,
    rowGap,
    dense,
    align,
    justify,
    uiDefaults.form.columns,
    uiDefaults.form.gap,
  ])

  const layout = useGridLayout(layoutOptions)

  // Every control in the tree, in document order. All validation bookkeeping
  // runs off this flat view — grouping is a layout concern, not a data one.
  const flatFields = React.useMemo(() => flattenFields(fields), [fields])

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
    (field: FieldDefinition<T>): unknown =>
      fieldDefaultValue(registry[field.type], field),
    [registry]
  )

  // Field names excluded by the active mode — omitted from validation + submit.
  // A section's `modes` cascades to everything nested inside it.
  const modeExcludedKeys = React.useMemo(
    () => collectModeExcludedKeys(fields, mode),
    [fields, mode]
  )
  const modeExcludedSet = React.useMemo(
    () => new Set(modeExcludedKeys),
    [modeExcludedKeys]
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
    for (const field of flatFields) base[field.name] = defaultForField(field)
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

  // Fields the schema treats as optional. For these, an empty string means "not
  // provided", so it should pass rather than fail — e.g. `z.email().optional()`
  // shouldn't flag a blank. Read from the schema alone: a field's `required`
  // flag is presentation (the asterisk) and must not move validation.
  const optionalKeys = React.useMemo(() => {
    const set = new Set<string>()
    for (const field of flatFields) {
      if (schemaAcceptsUndefined(schema, field.name)) set.add(field.name)
    }
    return set
  }, [schema, flatFields])

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

  // Collapse state for `collapsible` sections, keyed by section id. Held here
  // rather than inside each section so a failed submit can force open whichever
  // sections are hiding an error.
  const [collapsedById, setCollapsedById] = React.useState<
    Record<string, boolean>
  >({})
  const sectionPaths = React.useMemo(
    () => buildSectionPathMap(fields),
    [fields]
  )

  const focusField = React.useCallback((name: string) => {
    const wrapper = formRef.current?.querySelector<HTMLElement>(
      `[data-field="${CSS.escape(name)}"]`
    )
    // Focus the first focusable control inside the field — works across every
    // control type (input, trigger button, etc.) without threading ids around.
    wrapper
      ?.querySelector<HTMLElement>(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )
      ?.focus()
  }, [])

  // On a failed submit, move focus to the first field (in definition order) that
  // has an error, so the user lands right where they need to fix things. If that
  // field sits inside collapsed sections, open them first — an error nobody can
  // see is worse than no validation at all.
  const focusFirstError = React.useCallback(() => {
    for (const field of flatFields) {
      const meta = form.getFieldMeta(field.name as never)
      if (!meta || (meta.errors?.length ?? 0) === 0) continue

      const path = sectionPaths.get(field.name)
      if (path && path.length > 0) {
        setCollapsedById((prev) => {
          const next = { ...prev }
          for (const sectionId of path) next[sectionId] = false
          return next
        })
        // The field is not in the DOM until that state change commits.
        setTimeout(() => focusField(field.name), 0)
      } else {
        focusField(field.name)
      }
      break
    }
  }, [flatFields, form, sectionPaths, focusField])

  // Imperative handle: re-initialize (no `key` remount) or submit. `reset`
  // rebuilds the seed from field blanks + `initialData` + the passed `values`
  // and adopts it as the new baseline, clearing all field/submit state — the
  // same lockstep-baseline discipline the reconcile effect uses.
  React.useImperativeHandle(
    ref,
    (): SmartFormHandle<T> => ({
      reset: (values) => {
        const base: Record<string, unknown> = {}
        for (const field of flatFields)
          base[field.name] = defaultForField(field)
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
    [flatFields, defaultForField, initialData, form, focusFirstError]
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
    for (const field of flatFields) base[field.name] = defaultForField(field)
    const next = { ...base, ...(data as Record<string, unknown>) } as T
    // Advance the baseline in lockstep so the per-render `form.update(opts)` sees
    // no defaultValues change and leaves the freshly adopted values in place.
    setBaseline(next)
    form.reset(next as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // ── Rendering ─────────────────────────────────────────────────────────────
  // The layout tree is walked recursively: fields become grid cells, sections
  // become nested grids. `inherited` carries the enclosing grid's options so a
  // section without its own `columns` keeps the parent's rhythm.

  const renderField = (field: FieldDefinition<T>): React.ReactNode => {
    if (modeExcludedSet.has(field.name)) return null
    if (field.hidden?.(values)) return null

    // Presentation only, and explicit: the asterisk shows iff the definition
    // asks for it. The schema never puts one there (nor takes one away).
    const required = field.required === true

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
            <SmartGridItem
              span={field.span}
              colStart={field.colStart}
              rowSpan={field.rowSpan}
              order={field.order}
              newRow={field.newRow}
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
            </SmartGridItem>
          )
        }}
      </form.Field>
    )
  }

  const renderSection = (
    node: FormSection<T>,
    id: string,
    inherited: GridLayoutOptions
  ): React.ReactNode => {
    const nested: GridLayoutOptions = {
      columns: node.columns ?? inherited.columns,
      gap: node.gap ?? inherited.gap,
      columnGap: node.columnGap,
      rowGap: node.rowGap,
      dense: node.dense,
      align: node.align,
      justify: node.justify,
    }
    const collapsed = node.collapsible
      ? (collapsedById[id] ?? node.defaultCollapsed ?? false)
      : false

    return (
      <SmartGridItem
        key={id}
        span={node.span ?? DEFAULT_SECTION_SPAN}
        colStart={node.colStart}
        rowSpan={node.rowSpan}
        order={node.order}
        newRow={node.newRow}
      >
        <FormSectionChrome
          id={id}
          title={node.title}
          description={node.description}
          variant={node.variant ?? "plain"}
          collapsible={node.collapsible}
          collapsed={collapsed}
          onToggle={() =>
            setCollapsedById((prev) => ({ ...prev, [id]: !collapsed }))
          }
        >
          <SmartGridLayout {...nested}>
            {renderNodes(node.fields, nested, `${id}.`)}
          </SmartGridLayout>
        </FormSectionChrome>
      </SmartGridItem>
    )
  }

  const renderNodes = (
    nodes: readonly FormNode<T>[],
    inherited: GridLayoutOptions,
    prefix: string
  ): React.ReactNode[] =>
    nodes.flatMap((node, index): React.ReactNode[] => {
      if (isFieldNode(node)) {
        const rendered = renderField(node)
        return rendered ? [rendered] : []
      }

      // Non-field nodes gate on the same `modes` / `hidden` contract as fields.
      if (node.modes && mode !== undefined && !node.modes.includes(mode))
        return []
      if (node.hidden?.(values)) return []

      if (isSectionNode(node)) {
        return [
          renderSection(node, sectionNodeId(node, index, prefix), inherited),
        ]
      }

      const key = node.id ?? `${prefix}${index}`
      if (node.kind === "divider") {
        return [
          <SmartGridItem
            key={key}
            span={node.span ?? DEFAULT_SECTION_SPAN}
            colStart={node.colStart}
            order={node.order}
            newRow={node.newRow}
          >
            {node.label ? (
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {node.label}
                </span>
                <Separator className="flex-1" />
              </div>
            ) : (
              <Separator />
            )}
          </SmartGridItem>,
        ]
      }

      return [
        <SmartGridItem
          key={key}
          span={node.span}
          colStart={node.colStart}
          rowSpan={node.rowSpan}
          order={node.order}
          newRow={node.newRow}
        >
          {node.render({ values, mode })}
        </SmartGridItem>,
      ]
    })

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
      className={cn(layout.containerProps.className, className)}
    >
      <div
        className={layout.gridProps.className}
        style={layout.gridProps.style}
      >
        <GridLayoutProvider value={layout.context}>
          {renderNodes(fields, layoutOptions, "")}

          {children !== undefined ? (
            <SmartGridItem span="full">{children}</SmartGridItem>
          ) : effectiveSubmitLabel !== null ? (
            <SmartGridItem
              span="full"
              className="flex items-center justify-end gap-2 pt-1"
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
            </SmartGridItem>
          ) : null}
        </GridLayoutProvider>
      </div>
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
 * Validation and presentation are separate concerns: the schema is the single
 * source of truth for validation, while the required asterisk comes from the
 * field definition's `required` flag — a field can be required by the schema
 * without being marked in the UI, and the reverse. Pass
 * `data`/`setData` to mirror the live values into your own state; both are
 * optional — the form owns its state either way. For create/edit, seed with
 * `initialData` and re-load a record via the `ref` handle's `reset(row)` (no
 * `key` remount), and gate create/edit-only fields with per-field `modes` + the
 * `mode` prop so one schema serves both.
 *
 * **Layout** is the container-query grid from `@iamsaroj/smart-ui/layout`: pick
 * any column count (`columns={12}`, `columns={{ base: 1, md: 12 }}`,
 * `columns={{ auto: "fit", min: "16rem" }}`) and place each field with `span`.
 * Spans clamp to the live column count, so a wide field collapses to full width
 * on a narrow container by itself. Group fields with `kind: "section"` nodes to
 * nest a differently-shaped grid inside the form.
 *
 * ```tsx
 * const schema = z.object({ name: z.string().min(1), email: z.email().optional() })
 * type Form = z.infer<typeof schema>
 *
 * const fields: FormNode<Form>[] = [
 *   { name: "name",  type: "text",  label: "Name",  span: "1/2" },
 *   { name: "email", type: "email", label: "Email", span: "1/2" },
 * ]
 *
 * <SmartForm schema={schema} fields={fields} columns={12} onSubmit={save} />
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

/** Frame around a section's nested grid: heading, description, disclosure. */
const FormSectionChrome = ({
  id,
  title,
  description,
  variant,
  collapsible,
  collapsed,
  onToggle,
  children,
}: {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant: "plain" | "card" | "fieldset"
  collapsible?: boolean
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) => {
  const titleId = `${id}-title`
  const hasHeader = title != null || description != null

  const header = hasHeader ? (
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="space-y-0.5">
        {title != null &&
          (variant === "fieldset" ? (
            <legend id={titleId} className="text-sm font-semibold">
              {title}
            </legend>
          ) : (
            <h3 id={titleId} className="text-sm font-semibold">
              {title}
            </h3>
          ))}
        {description != null && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {collapsible && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={!collapsed}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
        >
          <ChevronDown
            className={cn("transition-transform", collapsed && "-rotate-90")}
          />
          <span className="sr-only">Toggle section</span>
        </Button>
      )}
    </div>
  ) : null

  // `hidden` rather than unmounting: TanStack keeps the values either way, but
  // staying mounted means a collapsed section's fields still hold their live
  // validation state when it reopens.
  const panel = (
    <div id={`${id}-panel`} hidden={collapsed}>
      {children}
    </div>
  )

  if (variant === "fieldset") {
    return (
      <fieldset className="min-w-0 rounded-lg border p-4">
        {header}
        {panel}
      </fieldset>
    )
  }

  return (
    <section
      aria-labelledby={title != null ? titleId : undefined}
      className={cn(
        "min-w-0",
        variant === "card" && "rounded-lg border bg-card p-4"
      )}
    >
      {header}
      {panel}
    </section>
  )
}

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
