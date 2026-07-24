import { expect, test } from "vitest"
import { z } from "zod"

import { deepEqual, schemaAcceptsUndefined } from "./smart-form-internals"

/**
 * Pure helpers behind SmartForm's state wiring. `deepEqual` decides whether an
 * external `data` change is real (a wrong answer either drops updates or
 * re-triggers the sync loop the smart-form-sync tests guard against), and
 * `schemaAcceptsUndefined` decides which blank strings are normalized to
 * `undefined` before validation. Lock both contracts in directly.
 */

// --- deepEqual ---------------------------------------------------------------

test("deepEqual: primitives compare by Object.is (including NaN)", () => {
  expect(deepEqual(1, 1)).toBe(true)
  expect(deepEqual("a", "a")).toBe(true)
  expect(deepEqual("a", "b")).toBe(false)
  expect(deepEqual(1, "1")).toBe(false)
  expect(deepEqual(NaN, NaN)).toBe(true)
  expect(deepEqual(null, null)).toBe(true)
  expect(deepEqual(undefined, undefined)).toBe(true)
  expect(deepEqual(null, undefined)).toBe(false)
  expect(deepEqual(null, {})).toBe(false)
  expect(deepEqual({}, undefined)).toBe(false)
  expect(deepEqual(false, 0)).toBe(false)
})

test("deepEqual: Dates compare by timestamp, never equal to plain objects", () => {
  expect(deepEqual(new Date(1000), new Date(1000))).toBe(true)
  expect(deepEqual(new Date(1000), new Date(2000))).toBe(false)
  // A Date on only one side must not fall through to key comparison
  // (a Date has no enumerable keys, so {} would otherwise "equal" it).
  expect(deepEqual(new Date(1000), {})).toBe(false)
  expect(deepEqual({}, new Date(1000))).toBe(false)
})

test("deepEqual: arrays compare element-wise, not equal to objects", () => {
  expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
  expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
  expect(deepEqual([], [])).toBe(true)
  // Array vs plain object with the same "shape" must be unequal.
  expect(deepEqual([1], { 0: 1 })).toBe(false)
  expect(deepEqual({ 0: 1 }, [1])).toBe(false)
})

test("deepEqual: objects compare structurally at any depth", () => {
  const a = {
    text: "x",
    range: { from: "2024-01-01", to: undefined },
    tags: ["a"],
  }
  const b = {
    text: "x",
    range: { from: "2024-01-01", to: undefined },
    tags: ["a"],
  }
  expect(deepEqual(a, b)).toBe(true)

  expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
  // Missing / extra keys in either direction.
  expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  // Same key count but different key names.
  expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
  // Nested mismatch.
  expect(deepEqual({ r: { from: "a" } }, { r: { from: "b" } })).toBe(false)
})

// --- schemaAcceptsUndefined ---------------------------------------------------

const schema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  role: z.string().default("user"),
  nickname: z.string().nullable(),
})

test("schemaAcceptsUndefined: true iff the field schema accepts undefined", () => {
  expect(schemaAcceptsUndefined(schema, "name")).toBe(false)
  // optional() and default() both accept undefined.
  expect(schemaAcceptsUndefined(schema, "email")).toBe(true)
  expect(schemaAcceptsUndefined(schema, "role")).toBe(true)
  // nullable() still rejects undefined.
  expect(schemaAcceptsUndefined(schema, "nickname")).toBe(false)
})

test("schemaAcceptsUndefined: unknown fields and shapeless schemas count as optional", () => {
  // No rule to violate → a blank is normalized away rather than sent as "".
  expect(schemaAcceptsUndefined(schema, "missing")).toBe(true)
  expect(schemaAcceptsUndefined(z.string(), "name")).toBe(true)
})

test("schemaAcceptsUndefined: unwraps optional/default wrappers around the object", () => {
  expect(schemaAcceptsUndefined(schema.optional(), "name")).toBe(false)
  expect(schemaAcceptsUndefined(schema.optional(), "email")).toBe(true)
  const withDefault = schema.default({
    name: "x",
    role: "user",
    nickname: null,
  })
  expect(schemaAcceptsUndefined(withDefault, "name")).toBe(false)
})
