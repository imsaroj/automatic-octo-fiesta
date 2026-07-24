/**
 * Field type map, option shape, and the {@link FieldDefinition} config object
 * consumed by {@link SmartForm}. Kept separate from `smart-form.tsx` so the
 * field registry can depend on these types without a circular import.
 *
 * **{@link FieldTypeExtras} is the single source of truth.** It maps every
 * `type` to the extra props that type accepts, and everything else here is
 * generated from it: {@link FieldType} is its keys, {@link FieldDefinition} is
 * the discriminated union, and {@link ResolvedFieldDefinition} is the flattened
 * superset the runtime reads. Adding a field type is one entry in that map — no
 * union member, no wide-type property, nothing to keep in sync by hand.
 *
 * Most entries are **derived from the control's own props** via
 * {@link AuthorProps}, so a field type cannot drift from the component that
 * renders it: drop `maxLength` from `SmartInputField` and the `text` entry stops
 * compiling. The exceptions are called out inline — option-based fields go
 * through the {@link OptionField} adapter, which retypes `options` to
 * {@link FieldOptions} so async resolvers and non-string values work.
 *
 * Because each key carries a single literal `type`, the union is a genuine
 * discriminated union: invalid configs (`decimalScale` on a checkbox, `options`
 * on a text field) are unrepresentable and rejected at compile time.
 */

import type { GridPlacement } from "@iamsaroj/smart-ui/layout"

import type { FieldBaseProps } from "./base"
import type { SmartInputFieldProps } from "./smart-input-field"
import type { SmartPasswordFieldProps } from "./smart-password-field"
import type { SmartTelFieldProps } from "./smart-tel-field"
import type { SmartSlugFieldProps } from "./smart-slug-field"
import type { SmartTextareaFieldProps } from "./smart-textarea-field"
import type { SmartTextEditorFieldProps } from "./smart-text-editor-field"
import type { SmartNumberFieldProps } from "./smart-number-field"
import type { SmartDateFieldProps } from "./smart-date-field"
import type { SmartTimeFieldProps } from "./smart-time-field"
import type { SmartDateTimeFieldProps } from "./smart-datetime-field"
import type { SmartMonthFieldProps } from "./smart-month-field"
import type { SmartYearFieldProps } from "./smart-year-field"
import type { SmartDateRangeFieldProps } from "./smart-date-range-field"
import type { SmartTimeRangeFieldProps } from "./smart-time-range-field"
import type { SmartSelectFieldProps } from "./smart-select-field"
import type { SmartComboboxFieldProps } from "./smart-combobox-field"
import type { SmartMultiSelectFieldProps } from "./smart-multi-select-field"
import type { SmartRadioGroupFieldProps } from "./smart-radio-group-field"
import type { SmartSegmentedFieldProps } from "./smart-segmented-field"
import type { SmartCheckboxGroupFieldProps } from "./smart-checkbox-group-field"
import type { SmartCheckboxFieldProps } from "./smart-checkbox-field"
import type { SmartSwitchFieldProps } from "./smart-switch-field"
import type { SmartYesNoFieldProps } from "./smart-yesno-field"

/** The value types an option may carry. Serialized to a string key for the DOM;
 * the form value keeps the real type. */
export type PrimitiveOptionValue = string | number | boolean

/**
 * A single selectable choice for `select` / `combobox` / `multiselect` / `radio`
 * / `segmented` / `checkbox-group` fields. Generic over the value type so a
 * numeric- or boolean-valued select keeps an honest schema (`roleId: z.number()`)
 * with no `String()`/`Number()` conversion at the boundary. Defaults to the wide
 * `PrimitiveOptionValue` so existing string-valued options are unaffected.
 */
export interface FieldOption<
  V extends PrimitiveOptionValue = PrimitiveOptionValue,
> {
  value: V
  label: string
  description?: string
  disabled?: boolean
}

/**
 * Async options resolver for select/combobox/multiselect/radio/segmented/
 * checkbox-group fields: called with an `AbortSignal` (and, for search-aware
 * backends, the current `search` term) and resolves to the option list. The
 * library never imports a fetch client — the *function* is supplied by the app,
 * so data-fetching stays app-owned while the control handles loading/empty state.
 */
export type AsyncFieldOptions<
  V extends PrimitiveOptionValue = PrimitiveOptionValue,
> = (ctx: { search?: string; signal: AbortSignal }) => Promise<FieldOption<V>[]>

/** A field's `options`: a materialized list or an async resolver. */
export type FieldOptions<
  V extends PrimitiveOptionValue = PrimitiveOptionValue,
> = FieldOption<V>[] | AsyncFieldOptions<V>

// ── Deriving a field type's extras from its control ─────────────────────────

/**
 * The props {@link SmartForm} supplies itself — the `data`/`setData` binding
 * plus the label/placeholder/description/validation set it derives from the
 * definition and live form state. Never authored on a field definition.
 */
type EngineOwnedProp = keyof FieldBaseProps<unknown>

/**
 * A control's **author-facing** props: its own props minus everything the engine
 * owns, minus `type` (the field definition owns that as its discriminant).
 *
 * This is what makes a field type's config and its component impossible to
 * drift apart — the config *is* the component's surface, not a hand-kept copy.
 */
type AuthorProps<P> = Omit<P, EngineOwnedProp | "type">

/**
 * Author-facing props for an **option-based** field. These render through
 * {@link OptionField} rather than the control directly, which is what lets
 * `options` be an async resolver and carry non-string values — so the control's
 * own string-only `options` (and `SmartSelectField`'s `groups`, which the engine
 * does not surface) are replaced with {@link FieldOptions}.
 */
type OptionAuthorProps<P> = Omit<AuthorProps<P>, "options" | "groups"> & {
  options?: FieldOptions
}

/**
 * Author-facing props for a **numeric** field. `integer` is dropped because the
 * engine derives it from the field type — the `integer` type sets it, the others
 * must not.
 */
type NumberAuthorProps = Omit<AuthorProps<SmartNumberFieldProps>, "integer">

/**
 * **The single source of truth for field types.** Each key is a `type` value;
 * each value is the extra props that type accepts on a {@link FieldDefinition},
 * on top of the shared {@link FieldBase}.
 *
 * Declared as an `interface` (not a type alias) so applications can add their
 * own field types by declaration merging, and have them type-checked at
 * authoring time exactly like the built-ins:
 *
 * ```ts
 * declare module "@iamsaroj/smart-ui/form" {
 *   interface FieldTypeExtras {
 *     rating: { max?: number; allowHalf?: boolean }
 *   }
 * }
 * ```
 *
 * Pair that with a `defineFieldType("rating", …)` entry passed to
 * {@link SmartForm}'s `registry` prop and the new type is fully wired.
 */
export interface FieldTypeExtras {
  // ── Text ─────────────────────────────────────────────────────────────────
  text: AuthorProps<SmartInputFieldProps>
  email: AuthorProps<SmartInputFieldProps>
  url: AuthorProps<SmartInputFieldProps>
  password: AuthorProps<SmartPasswordFieldProps>
  tel: AuthorProps<SmartTelFieldProps>
  slug: AuthorProps<SmartSlugFieldProps>
  textarea: AuthorProps<SmartTextareaFieldProps>
  "text-editor": AuthorProps<SmartTextEditorFieldProps>

  // ── Numeric ──────────────────────────────────────────────────────────────
  number: NumberAuthorProps
  decimal: NumberAuthorProps
  integer: NumberAuthorProps
  currency: NumberAuthorProps
  percentage: NumberAuthorProps

  // ── Date & time ──────────────────────────────────────────────────────────
  date: AuthorProps<SmartDateFieldProps>
  time: AuthorProps<SmartTimeFieldProps>
  datetime: AuthorProps<SmartDateTimeFieldProps>
  month: AuthorProps<SmartMonthFieldProps>
  year: AuthorProps<SmartYearFieldProps>
  daterange: AuthorProps<SmartDateRangeFieldProps>
  timerange: AuthorProps<SmartTimeRangeFieldProps>

  // ── Selection ────────────────────────────────────────────────────────────
  select: OptionAuthorProps<SmartSelectFieldProps>
  combobox: OptionAuthorProps<SmartComboboxFieldProps>
  autocomplete: OptionAuthorProps<SmartComboboxFieldProps>
  multiselect: OptionAuthorProps<SmartMultiSelectFieldProps>
  radio: OptionAuthorProps<SmartRadioGroupFieldProps>
  segmented: OptionAuthorProps<SmartSegmentedFieldProps>
  "checkbox-group": OptionAuthorProps<SmartCheckboxGroupFieldProps>

  // ── Boolean ──────────────────────────────────────────────────────────────
  checkbox: AuthorProps<SmartCheckboxFieldProps>
  switch: AuthorProps<SmartSwitchFieldProps>
  yesno: AuthorProps<SmartYesNoFieldProps>
}

/**
 * Every field type the engine knows about — the keys of {@link FieldTypeExtras}.
 * **Open**: an app that augments `FieldTypeExtras` widens this too.
 */
export type FieldType = keyof FieldTypeExtras

/**
 * The field types the library itself ships — {@link FieldType} minus anything an
 * app added by declaration merging.
 *
 * Deliberately a written-out list rather than `keyof FieldTypeExtras`. The
 * built-in registry must be exhaustive over *these*, and no more: were it keyed
 * on the open `FieldType`, an app that added a `rating` type would make the
 * library's own registry fail to compile for a `rating` entry it cannot possibly
 * have — the app supplies that through `SmartForm`'s `registry` prop.
 *
 * `field-types.test.tsx` asserts this list and `FieldTypeExtras` match exactly.
 * That assertion lives in a test because it only holds where no augmentation is
 * in scope, which is precisely the library's own build.
 */
export type BuiltinFieldType =
  | "text"
  | "email"
  | "url"
  | "password"
  | "tel"
  | "slug"
  | "textarea"
  | "text-editor"
  | "number"
  | "decimal"
  | "integer"
  | "currency"
  | "percentage"
  | "date"
  | "time"
  | "datetime"
  | "month"
  | "year"
  | "daterange"
  | "timerange"
  | "select"
  | "combobox"
  | "autocomplete"
  | "multiselect"
  | "radio"
  | "segmented"
  | "checkbox-group"
  | "checkbox"
  | "switch"
  | "yesno"

/**
 * Props every field shares, regardless of type — the discriminated union base.
 *
 * Layout comes from {@link GridPlacement}: `span` / `colStart` / `rowSpan` /
 * `order` / `newRow`, resolved against the form's column count at each
 * container breakpoint. A span wider than the current column count clamps to
 * it, so `span: 6` on a `{ base: 1, md: 12 }` form is half a row on desktop and
 * a full row on mobile without a second declaration.
 *
 * ```ts
 * { name: "street", type: "text", span: "full" }   // edge to edge
 * { name: "city",   type: "text", span: "1/2" }    // half, any column count
 * { name: "zip",    type: "text", span: 3 }        // 3 tracks
 * { name: "notes",  type: "textarea", span: 6, rowSpan: 2 }
 * ```
 */
export interface FieldBase<
  T extends Record<string, unknown>,
> extends GridPlacement {
  name: keyof T & string
  label?: string
  placeholder?: string
  description?: string
  /**
   * Shows the required asterisk on the label. **Presentation only** — it is
   * never read by validation, and validation never sets it: a `z.string().min(1)`
   * field stays unmarked unless you ask for the asterisk here, and marking an
   * `.optional()` field doesn't make a blank fail. Keep the Zod schema the
   * single source of truth for what a valid value is.
   */
  required?: boolean
  disabled?: boolean
  /** Return `true` to hide the field (and skip validation for it). */
  hidden?: (data: T) => boolean
  /**
   * Modes this field appears in (e.g. `["create"]`). Omit to show in every mode.
   * With {@link SmartForm}'s `mode` prop set, a field is rendered **and validated**
   * only when its `modes` include the active mode — so one schema serves create,
   * edit, and any other mode without a `pick`/`extend` hack.
   */
  modes?: string[]
}

/**
 * One field type's complete configuration — the shared base plus that type's
 * own extras. Use it to name a single variant:
 *
 * ```ts
 * const status: FieldVariant<UserForm, "select"> = {
 *   name: "status",
 *   type: "select",
 *   options: statusOptions,
 * }
 * ```
 */
export type FieldVariant<
  T extends Record<string, unknown>,
  K extends FieldType,
> = FieldBase<T> & { type: K } & FieldTypeExtras[K]

/**
 * A single field's configuration — a discriminated union on `type`, generated
 * from {@link FieldTypeExtras}. Each type permits only its own extras, so the
 * editor autocompletes per type and invalid combinations fail to compile.
 */
export type FieldDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> = { [K in FieldType]: FieldVariant<T, K> }[FieldType]

/** Collapse a union into an intersection — used to flatten every type's extras. */
type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

/**
 * The flattened superset of every field type's props: a single wide shape the
 * engine and field registry read from at runtime. Every {@link FieldDefinition}
 * variant is assignable to it, so a `field` typed as the union can be passed
 * wherever a resolved definition is expected. **Authoring should use
 * {@link FieldDefinition}** (the strict union) — this exists for the registry's
 * `mapProps`, which reads extras generically without narrowing.
 *
 * Generated from {@link FieldTypeExtras}, so it can never fall behind the map.
 */
export type ResolvedFieldDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> = FieldBase<T> & { type: FieldType } & Partial<
    UnionToIntersection<FieldTypeExtras[FieldType]>
  >
