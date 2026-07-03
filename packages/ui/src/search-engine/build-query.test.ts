import { describe, expect, it } from "vitest"

import {
  buildSearchQuery,
  countActiveFilters,
  isEmptyValue,
} from "./build-query"

describe("isEmptyValue", () => {
  it("treats null/undefined/blank/empty as empty", () => {
    expect(isEmptyValue(null)).toBe(true)
    expect(isEmptyValue(undefined)).toBe(true)
    expect(isEmptyValue("")).toBe(true)
    expect(isEmptyValue("   ")).toBe(true)
    expect(isEmptyValue([])).toBe(true)
    expect(isEmptyValue(false)).toBe(true)
    expect(isEmptyValue({ from: undefined, to: undefined })).toBe(true)
  })

  it("keeps meaningful values, including 0 and Date", () => {
    expect(isEmptyValue("a")).toBe(false)
    expect(isEmptyValue(0)).toBe(false)
    expect(isEmptyValue(true)).toBe(false)
    expect(isEmptyValue(["x"])).toBe(false)
    expect(isEmptyValue(new Date())).toBe(false)
    expect(isEmptyValue({ from: new Date() })).toBe(false)
  })
})

describe("buildSearchQuery", () => {
  it("drops empty values and trims strings", () => {
    const query = buildSearchQuery({
      name: "",
      email: "  abc@test.com  ",
      role: null,
      status: [],
      active: false,
      score: 0,
    })
    expect(query).toEqual({ email: "abc@test.com", score: 0 })
  })

  it("keeps populated collections and ranges", () => {
    const range = { from: new Date("2026-01-01"), to: new Date("2026-02-01") }
    const query = buildSearchQuery({
      status: ["Active", "Pending"],
      createdAt: range,
      empty: "",
    })
    expect(query).toEqual({ status: ["Active", "Pending"], createdAt: range })
  })
})

describe("countActiveFilters", () => {
  it("counts only meaningful values", () => {
    expect(
      countActiveFilters({ name: "", role: "Admin", status: [], q: "x" })
    ).toBe(2)
  })
})
