import { describe, expect, test } from "vitest"

import {
  ERROR_KIND_RETRYABLE,
  ERROR_KIND_TONE,
  buildDiagnostics,
  inferErrorKind,
  normalizeError,
} from "./error-kind"

/**
 * The pure half of SmartPageError: turning an arbitrary caught value into a
 * normalized record, classifying it, and rendering the copyable blob.
 */

describe("normalizeError", () => {
  test("survives values that aren't errors at all", () => {
    expect(normalizeError(undefined)).toEqual({})
    expect(normalizeError(null)).toEqual({})
    expect(normalizeError("boom")).toEqual({ message: "boom" })
    expect(normalizeError("   ").message).toBeUndefined()
    expect(normalizeError(42).message).toBe("42")
    expect(normalizeError([1, 2]).message).toBe("1,2")
  })

  test("reads message, name and stack off a real Error", () => {
    const error = new TypeError("Failed to fetch")
    const result = normalizeError(error)

    expect(result.message).toBe("Failed to fetch")
    expect(result.name).toBe("TypeError")
    expect(result.stack).toContain("TypeError")
  })

  test("prefers the server envelope's message over the transport's", () => {
    // The shape axios produces for a rejected ApiResponse.
    const result = normalizeError({
      message: "Request failed with status code 409",
      code: "ERR_BAD_REQUEST",
      config: { url: "/api/v1/users" },
      response: {
        status: 409,
        data: {
          success: false,
          code: "USER_EMAIL_TAKEN",
          message: "That email is already registered.",
          path: "/api/v1/users",
          traceId: "b7f1c2e4",
        },
      },
    })

    expect(result.message).toBe("That email is already registered.")
    expect(result.status).toBe(409)
    expect(result.traceId).toBe("b7f1c2e4")
    expect(result.path).toBe("/api/v1/users")
    // `code` on the rejection itself is the transport's and wins — it is the one
    // that explains a failure with no response at all.
    expect(result.code).toBe("ERR_BAD_REQUEST")
  })

  test("falls back to a field-level error when the envelope has no message", () => {
    const result = normalizeError({
      response: {
        status: 400,
        data: { errors: [{ message: "name must not be blank" }] },
      },
    })

    expect(result.message).toBe("name must not be blank")
    expect(result.status).toBe(400)
  })

  test("finds the status wherever the transport parked it", () => {
    expect(normalizeError({ status: 503 }).status).toBe(503)
    expect(normalizeError({ statusCode: 500 }).status).toBe(500)
    // Numeric strings happen — a header, or a body that round-tripped as text.
    expect(normalizeError({ response: { status: "404" } }).status).toBe(404)
  })

  test("reads a numeric retry-after from the envelope or the headers", () => {
    expect(
      normalizeError({ response: { data: { retryAfter: 30 } } }).retryAfter
    ).toBe(30)
    expect(
      normalizeError({ response: { headers: { "retry-after": "12" } } })
        .retryAfter
    ).toBe(12)
  })
})

describe("inferErrorKind", () => {
  test("offline wins over everything", () => {
    expect(inferErrorKind({ offline: true, status: 500 })).toBe("network")
  })

  test("maps the statuses that mean something specific", () => {
    expect(inferErrorKind({ status: 401 })).toBe("unauthorized")
    expect(inferErrorKind({ status: 403 })).toBe("forbidden")
    expect(inferErrorKind({ status: 404 })).toBe("notFound")
    expect(inferErrorKind({ status: 408 })).toBe("timeout")
    expect(inferErrorKind({ status: 504 })).toBe("timeout")
    expect(inferErrorKind({ status: 429 })).toBe("rateLimited")
    expect(inferErrorKind({ status: 503 })).toBe("maintenance")
    expect(inferErrorKind({ status: 500 })).toBe("server")
    expect(inferErrorKind({ status: 502 })).toBe("server")
    // An unrecognized 4xx is a failure, not a crash.
    expect(inferErrorKind({ status: 422 })).toBe("error")
  })

  test("classifies transport failures that never get a status", () => {
    expect(inferErrorKind({ message: "TypeError: Failed to fetch" })).toBe(
      "network"
    )
    expect(inferErrorKind({ code: "ECONNREFUSED" })).toBe("network")
    expect(inferErrorKind({ name: "AbortError" })).toBe("timeout")
    expect(
      inferErrorKind({
        code: "ECONNABORTED",
        message: "timeout of 5000ms exceeded",
      })
    ).toBe("timeout")
  })

  test("falls back to the generic kind", () => {
    expect(inferErrorKind({})).toBe("error")
    expect(
      inferErrorKind({ message: "Cannot read properties of undefined" })
    ).toBe("error")
  })
})

describe("kind tables", () => {
  test("only kinds a repeat request could fix offer a retry", () => {
    expect(ERROR_KIND_RETRYABLE.forbidden).toBe(false)
    expect(ERROR_KIND_RETRYABLE.unauthorized).toBe(false)
    expect(ERROR_KIND_RETRYABLE.notFound).toBe(false)
    expect(ERROR_KIND_RETRYABLE.network).toBe(true)
    expect(ERROR_KIND_RETRYABLE.server).toBe(true)
  })

  test("a denial is neutral, a crash is danger", () => {
    expect(ERROR_KIND_TONE.forbidden).toBe("neutral")
    expect(ERROR_KIND_TONE.notFound).toBe("neutral")
    expect(ERROR_KIND_TONE.server).toBe("danger")
    expect(ERROR_KIND_TONE.network).toBe("warning")
  })
})

describe("buildDiagnostics", () => {
  test("aligns present fields, omits absent ones, and trails the stack", () => {
    const text = buildDiagnostics({
      title: "The server hit an error",
      kind: "server",
      status: 500,
      traceId: "b7f1c2e4",
      message: "Unexpected end of input",
      stack: "Error: boom\n  at handler",
      timestamp: "2026-07-22T09:15:00.000Z",
    })

    expect(text).toContain("The server hit an error")
    // Labels are padded to a common width so the block stays scannable.
    expect(text).toMatch(/^Status:\s+500$/m)
    expect(text).toMatch(/^Trace ID:\s+b7f1c2e4$/m)
    expect(text).toMatch(/^(Status|Trace ID|Message|Kind):\s{2}\S/m)
    expect(text).not.toContain("Code:")
    expect(text).not.toContain("undefined")
    expect(text.trimEnd().endsWith("  at handler")).toBe(true)
    expect(text.indexOf("Stack:")).toBeGreaterThan(text.indexOf("Trace ID:"))
  })

  test("folds app-supplied extras in and skips their empty values", () => {
    const text = buildDiagnostics({
      status: 500,
      extra: { tenant: "acme", build: "a1b2c3", user: undefined, note: "" },
    })

    expect(text).toContain("tenant:")
    expect(text).toContain("acme")
    expect(text).toContain("build:")
    expect(text).not.toContain("user:")
    expect(text).not.toContain("note:")
  })

  test("is empty for an empty input rather than printing a skeleton", () => {
    expect(buildDiagnostics({})).toBe("")
  })
})
