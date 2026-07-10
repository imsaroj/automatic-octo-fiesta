/**
 * `@iamsaroj/smart-ui/search` — a reusable search / filter bar built on top of
 * the form engine.
 *
 *   import { SmartSearchForm, type SearchFieldDefinition } from "@iamsaroj/smart-ui/search"
 *
 * `SmartSearchForm` composes `SmartForm`: same declarative fields and Zod
 * validation, plus manual/auto search, empty-value pruning, and an action bar.
 * `SearchEngine` is an alias of the same component.
 */

export { SmartSearchForm, SearchEngine } from "./smart-search-form"
export type { SmartSearchFormProps } from "./smart-search-form"
export type { SearchFieldDefinition, SearchFieldType } from "./types"
export {
  buildSearchQuery,
  countActiveFilters,
  isEmptyValue,
} from "./build-query"
