/**
 * Search-engine field typing. Rather than fork the form engine, the search
 * field definition is **derived** from {@link FieldDefinition}: intersecting the
 * full discriminated union with a narrowed `type` distributes over the union, so
 * every member keeps its own per-type extras (options, decimalScale, …) while
 * the set of allowed `type`s is constrained to search-relevant controls. The
 * result is still assignable to `FieldDefinition<T>[]`, so it flows straight into
 * {@link SmartForm} and reuses the entire field registry unchanged.
 */

import type { FieldDefinition } from "@imsaroj/smart-ui/form-engine"

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
