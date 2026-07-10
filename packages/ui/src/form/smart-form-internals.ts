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
 * default wrappers. Used only to read which fields are required (for the
 * asterisk) — never affects validation.
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
 * Whether a field is required, derived from the schema (the single source of
 * truth): a field is required when its schema rejects `undefined` — i.e. it is
 * not `.optional()` / `.default()`. Keeps field definitions UI-only.
 */
export const isFieldRequired = (schema: z.ZodType, name: string): boolean => {
  const shape = getZodShape(schema)
  const fieldSchema = shape?.[name]
  if (!fieldSchema) return false
  try {
    return !fieldSchema.safeParse(undefined).success
  } catch {
    return false
  }
}
