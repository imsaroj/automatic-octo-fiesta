import { expect, test } from "vitest"
import { z } from "zod"

import { deepEqual, isFieldRequired } from "./smart-form-internals"

/**
 * Pure helpers behind SmartForm's state wiring. `deepEqual` decides whether an
 * external `data` change is real (a wrong answer either drops updates or
 * re-triggers the sync loop the smart-form-sync tests guard against), and
 * `isFieldRequired` derives the required asterisk from the Zod schema. Lock
 * both contracts in directly.
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

// --- isFieldRequired ----------------------------------------------------------

const schema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  role: z.string().default("user"),
  nickname: z.string().nullable(),
})

test("isFieldRequired: required iff the field schema rejects undefined", () => {
  expect(isFieldRequired(schema, "name")).toBe(true)
  // optional() and default() both accept undefined → not required.
  expect(isFieldRequired(schema, "email")).toBe(false)
  expect(isFieldRequired(schema, "role")).toBe(false)
  // nullable() still rejects undefined → required.
  expect(isFieldRequired(schema, "nickname")).toBe(true)
})

test("isFieldRequired: unknown fields and shapeless schemas are not required", () => {
  expect(isFieldRequired(schema, "missing")).toBe(false)
  expect(isFieldRequired(z.string(), "name")).toBe(false)
})

test("isFieldRequired: unwraps optional/default wrappers around the object", () => {
  expect(isFieldRequired(schema.optional(), "name")).toBe(true)
  expect(isFieldRequired(schema.optional(), "email")).toBe(false)
  const withDefault = schema.default({
    name: "x",
    role: "user",
    nickname: null,
  })
  expect(isFieldRequired(withDefault, "name")).toBe(true)
})
