/**
 * Search-engine field typing. Rather than fork the form engine, the search
 * field definition is **derived** from {@link FieldDefinition}: intersecting the
 * full discriminated union with a narrowed `type` distributes over the union, so
 * every member keeps its own per-type extras (options, decimalScale, …) while
 * the set of allowed `type`s is constrained to search-relevant controls. The
 * result is still assignable to `FieldDefinition<T>[]`, so it flows straight into
 * {@link SmartForm} and reuses the entire field registry unchanged.
 */

import type {
  FieldDefinition,
  FormCustomNode,
  FormDividerNode,
  FormSection,
} from "@iamsaroj/smart-ui/form"

/**
 * The subset of {@link FieldType} that makes sense as a search/filter control.
 * Excludes authoring-only inputs (password, textarea, slug, rich text) that have
 * no place in a filter bar.
 *
 * `combobox` / `autocomplete` are the searchable single-selects — use them for
 * "async select" style fields; supply their `options` from your own loaded data,
 * or register a custom async field type via the `registry` prop for true
 * server-side option loading.
 */
export type SearchFieldType =
  // Text
  | "text"
  | "email"
  | "url"
  // Numeric
  | "number"
  | "integer"
  | "decimal"
  | "currency"
  | "percentage"
  // Selection
  | "select"
  | "combobox"
  | "autocomplete"
  | "multiselect"
  | "radio"
  | "segmented"
  // Boolean
  | "checkbox"
  | "checkbox-group"
  | "switch"
  | "yesno"
  // Date & time
  | "date"
  | "daterange"
  | "month"
  | "year"
  | "time"
  | "datetime"

/**
 * A single search field's configuration — the same discriminated union as
 * {@link FieldDefinition}, but with `type` constrained to {@link SearchFieldType}.
 * Authoring keeps full per-type autocomplete and rejects non-search field types
 * at compile time.
 *
 * ```tsx
 * const fields: SearchFieldDefinition<UserSearch>[] = [
 *   { name: "name", label: "Name", type: "text", placeholder: "Search name…" },
 *   { name: "role", type: "select", options: roleOptions },
 *   { name: "status", type: "multiselect", options: statusOptions },
 *   { name: "createdAt", type: "daterange" },
 * ]
 * ```
 */
export type SearchFieldDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> = FieldDefinition<T> & { type: SearchFieldType }

/**
 * A section inside a filter bar — the form engine's {@link FormSection} with its
 * children re-narrowed to search nodes, so "Advanced filters" can be a
 * collapsible group with its own column count and still reject a password field
 * at compile time.
 */
export type SearchSection<
  T extends Record<string, unknown> = Record<string, unknown>,
> = Omit<FormSection<T>, "fields"> & { fields: SearchNode<T>[] }

/**
 * One entry in a filter bar's layout tree: a search field, a nested section, or
 * the engine's presentational nodes. Assignable to `FormNode<T>[]`, so it flows
 * into {@link SmartForm} unchanged.
 */
export type SearchNode<
  T extends Record<string, unknown> = Record<string, unknown>,
> =
  | SearchFieldDefinition<T>
  | SearchSection<T>
  | FormCustomNode<T>
  | FormDividerNode<T>
