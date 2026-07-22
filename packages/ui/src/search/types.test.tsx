import { expect, test } from "vitest"
import type { FieldType } from "@iamsaroj/smart-ui/form"
import type { SearchFieldDefinition, SearchFieldType } from "./types"

/**
 * `SearchFieldDefinition<T>` is `FieldDefinition<T>` with `type` narrowed to the
 * search-relevant subset. These are compile-time assertions: the
 * `@ts-expect-error` lines fail `tsc` if the narrowing ever stops holding.
 */

type Search = { q: string; status: string; active: boolean; createdAt: string }

test("search fields keep their per-type extras", () => {
  const fields: SearchFieldDefinition<Search>[] = [
    { name: "q", label: "Search", type: "text", placeholder: "Code or name…" },
    { name: "status", type: "select", options: [{ value: "a", label: "A" }] },
    { name: "active", type: "yesno", yesLabel: "On" },
    { name: "createdAt", type: "daterange", numberOfMonths: 2 },
    { name: "status", type: "multiselect", maxSelected: 2 },
  ]

  expect(fields).toHaveLength(5)
})

test("authoring-only field types are rejected in a filter bar", () => {
  const password: SearchFieldDefinition<Search> = {
    name: "q",
    // @ts-expect-error — `password` has no meaning as a filter.
    type: "password",
  }

  const textarea: SearchFieldDefinition<Search> = {
    name: "q",
    // @ts-expect-error — `textarea` is authoring-only.
    type: "textarea",
  }

  const richText: SearchFieldDefinition<Search> = {
    name: "q",
    // @ts-expect-error — `text-editor` is authoring-only.
    type: "text-editor",
  }

  const timerange: SearchFieldDefinition<Search> = {
    name: "q",
    // @ts-expect-error — `timerange` filters nothing on its own.
    type: "timerange",
  }

  expect([password, textarea, richText, timerange]).toHaveLength(4)
})

test("per-type extras are still enforced inside a filter bar", () => {
  const optionsOnText: SearchFieldDefinition<Search> = {
    name: "q",
    type: "text",
    // @ts-expect-error — `options` is not valid on a text field.
    options: [{ value: "x", label: "X" }],
  }

  expect(optionsOnText).toBeDefined()
})

test("SearchFieldType is a subset of FieldType", () => {
  // Assignable one way only: every search type is a field type, and the
  // exclusions mean the reverse does not hold.
  const widen: FieldType = "select" satisfies SearchFieldType
  const excluded: Exclude<SearchFieldType, FieldType> = undefined as never

  expect(widen).toBe("select")
  expect(excluded).toBeUndefined()
})
