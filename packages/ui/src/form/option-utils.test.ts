import { describe, expect, it } from "vitest"
import { buildOptionCodec, serializeOptionValue } from "./option-utils"

describe("serializeOptionValue", () => {
  it("serializes each primitive to a stable string key", () => {
    expect(serializeOptionValue("admin")).toBe("admin")
    expect(serializeOptionValue(3)).toBe("3")
    expect(serializeOptionValue(true)).toBe("true")
    expect(serializeOptionValue(false)).toBe("false")
    expect(serializeOptionValue(0)).toBe("0")
  })
})

describe("buildOptionCodec", () => {
  it("exposes string-keyed options while preserving labels and flags", () => {
    const codec = buildOptionCodec([
      { value: 1, label: "Admin" },
      { value: 2, label: "Editor", disabled: true, description: "Limited" },
    ])
    expect(codec.stringOptions).toEqual([
      {
        value: "1",
        label: "Admin",
        description: undefined,
        disabled: undefined,
      },
      { value: "2", label: "Editor", description: "Limited", disabled: true },
    ])
  })

  it("round-trips a numeric value through key ↔ real value", () => {
    const codec = buildOptionCodec([
      { value: 1, label: "One" },
      { value: 2, label: "Two" },
    ])
    const key = codec.toKey(2)
    expect(key).toBe("2")
    // fromKey recovers the number, not the string "2".
    expect(codec.fromKey(key)).toBe(2)
    expect(typeof codec.fromKey(key)).toBe("number")
  })

  it("round-trips boolean values", () => {
    const codec = buildOptionCodec([
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ])
    expect(codec.fromKey(codec.toKey(false))).toBe(false)
    expect(codec.fromKey(codec.toKey(true))).toBe(true)
  })

  it("passes an unknown key through as a string (e.g. the empty/unselected key)", () => {
    const codec = buildOptionCodec([{ value: 1, label: "One" }])
    expect(codec.fromKey("")).toBe("")
    expect(codec.fromKey("nope")).toBe("nope")
  })
})
