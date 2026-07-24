import type { z } from "zod"

/**
 * Pure helpers extracted from {@link SmartForm} so the engine file stays focused
 * on rendering / state wiring. **Internal** — not re-exported from the package.
 */

/** Structural equality for plain form data (objects, arrays, primitives, `Date`). */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const aKeys = Object.keys(ao)
  if (aKeys.length !== Object.keys(bo).length) return false
  return aKeys.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(bo, k) && deepEqual(ao[k], bo[k])
  )
}

/**
 * Best-effort access to a Zod object's `.shape`, unwrapping optional / nullable /
 * default wrappers. Used only to read per-field schemas for the empty-string
 * normalization below — never changes what the schema itself validates.
 */
const getZodShape = (
  schema: unknown
): Record<string, z.ZodType> | undefined => {
  let current = schema as
    | {
        shape?: unknown
        def?: { innerType?: unknown }
        _def?: { innerType?: unknown }
      }
    | undefined
  for (let depth = 0; current && depth < 6; depth += 1) {
    if (current.shape && typeof current.shape === "object") {
      return current.shape as Record<string, z.ZodType>
    }
    const inner = current.def?.innerType ?? current._def?.innerType
    if (!inner || inner === current) break
    current = inner as typeof current
  }
  return undefined
}

/**
 * Whether a field's schema accepts `undefined` — i.e. it is `.optional()` /
 * `.default()`. A **validation** detail, not a presentation one: {@link SmartForm}
 * uses it to decide which blank strings to normalize to `undefined` before
 * validating, so `z.email().optional()` doesn't flag an untouched field. The
 * required asterisk is *not* derived from this — it comes solely from the field
 * definition's `required` flag, so validation and presentation stay independent.
 *
 * A field the schema says nothing about (unknown key, or a non-object schema)
 * counts as accepting `undefined`: there is no rule to violate, so a blank is
 * normalized away rather than sent through as `""`.
 */
export const schemaAcceptsUndefined = (
  schema: z.ZodType,
  name: string
): boolean => {
  const shape = getZodShape(schema)
  const fieldSchema = shape?.[name]
  if (!fieldSchema) return true
  try {
    return fieldSchema.safeParse(undefined).success
  } catch {
    return true
  }
}
