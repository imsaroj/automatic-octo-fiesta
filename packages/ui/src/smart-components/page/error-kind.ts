/**
 * Error classification & diagnostics — the pure half of {@link SmartPageError}.
 *
 * Deliberately free of React and the DOM so every branch is unit-testable
 * (`error-kind.test.ts`) and so the component file stays presentation only.
 *
 * The job here is to turn the *shape* an app actually catches — an `Error`, a
 * string, an axios rejection, a rejected response envelope — into a small,
 * honest record, and then into one of a handful of failure **kinds**. The kind
 * is what decides the icon, the tone, the default copy, and whether retrying
 * the same request could plausibly work.
 */

/**
 * The failure modes worth telling apart on a page. Anything unrecognized is
 * `"error"` — the union is a presentation aid, not an exhaustive taxonomy of
 * HTTP.
 */
export type SmartPageErrorKind =
  | "error"
  | "network"
  | "timeout"
  | "rateLimited"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "server"
  | "maintenance"

/**
 * How loud a kind should look. `danger` is "something is broken", `warning` is
 * "something is in the way, probably temporarily", `neutral` is "the system is
 * working correctly and the answer is no" — a 403 is not a crash and shouldn't
 * be painted like one.
 */
export type SmartPageErrorTone = "danger" | "warning" | "neutral"

export const ERROR_KIND_TONE: Record<SmartPageErrorKind, SmartPageErrorTone> = {
  error: "danger",
  network: "warning",
  timeout: "warning",
  rateLimited: "warning",
  unauthorized: "neutral",
  forbidden: "neutral",
  notFound: "neutral",
  server: "danger",
  maintenance: "warning",
}

/**
 * Whether repeating the identical request could succeed. Drives whether a retry
 * affordance is offered by default: re-issuing a request that 403'd just fails
 * again, and a button that reliably does nothing is worse than no button.
 */
export const ERROR_KIND_RETRYABLE: Record<SmartPageErrorKind, boolean> = {
  error: true,
  network: true,
  timeout: true,
  rateLimited: true,
  unauthorized: false,
  forbidden: false,
  notFound: false,
  server: true,
  maintenance: true,
}

/** The fields worth extracting from an arbitrary caught value. */
export interface NormalizedError {
  /** Human-readable message, preferring the server's over the transport's. */
  message?: string
  /** `Error.name`, e.g. `"AbortError"`. */
  name?: string
  /** `Error.stack`, when the value was a real `Error`. */
  stack?: string
  /** HTTP status, wherever the transport parked it. */
  status?: number
  /** Application/transport error code, e.g. `"ECONNABORTED"`, `"USER_LOCKED"`. */
  code?: string
  /** Correlation id from a response envelope — the single most useful field to
   *  put in front of a user, because support can search it. */
  traceId?: string
  /** Request path from a response envelope. */
  path?: string
  /** Seconds to wait before retrying, from a `Retry-After`-style field. */
  retryAfter?: number
}

const asText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  // `Retry-After` and some status fields arrive as numeric strings.
  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value)
  }
  return undefined
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const firstOf = <T>(...values: (T | undefined)[]): T | undefined =>
  values.find((value) => value !== undefined)

/**
 * Flatten whatever was caught into {@link NormalizedError}.
 *
 * Reads, in order of specificity: an `Error`'s own fields, an axios-style
 * `error.response.status` / `.data`, and a response **envelope** inside that
 * body (`{ success, code, message, traceId, path }` — the shape this library's
 * reference backend returns, including for errors). The envelope's `message`
 * wins over the transport's, because `"Request failed with status code 500"` is
 * never what the user should read when the server said something specific.
 *
 * Total: any input is safe, including `null`, a number, or a cyclic object.
 */
export const normalizeError = (error: unknown): NormalizedError => {
  if (error === null || error === undefined) return {}
  if (typeof error === "string") return { message: asText(error) }

  const source = asRecord(error)
  if (!source) return { message: String(error) }

  const response = asRecord(source.response)
  const body =
    asRecord(response?.data) ?? asRecord(source.data) ?? asRecord(source.body)
  // Some backends nest the failure under `error`; ours puts it at the top level.
  const envelope = asRecord(body?.error) ?? body

  const errors = envelope?.errors
  const firstFieldError = Array.isArray(errors)
    ? (asText(errors[0]) ?? asText(asRecord(errors[0])?.message))
    : undefined

  return {
    message: firstOf(
      asText(envelope?.message),
      asText(body?.message),
      firstFieldError,
      asText(source.message),
      asText(source.statusText),
      asText(response?.statusText)
    ),
    name: asText(source.name),
    stack: asText(source.stack),
    status: firstOf(
      asNumber(response?.status),
      asNumber(source.status),
      asNumber(source.statusCode),
      asNumber(envelope?.status)
    ),
    code: firstOf(asText(source.code), asText(envelope?.code)),
    traceId: firstOf(
      asText(envelope?.traceId),
      asText(body?.traceId),
      asText(source.traceId),
      asText(envelope?.correlationId)
    ),
    path: firstOf(
      asText(envelope?.path),
      asText(source.path),
      asText(asRecord(source.config)?.url)
    ),
    retryAfter: firstOf(
      asNumber(envelope?.retryAfter),
      asNumber(asRecord(response?.headers)?.["retry-after"])
    ),
  }
}

/**
 * Pick the {@link SmartPageErrorKind} that best describes a failure.
 *
 * Status code first (it is the only signal that never lies), then a text probe
 * over code/name/message for the transport-level failures that never get one —
 * `TypeError: Failed to fetch`, `AbortError`, `ECONNREFUSED`. `offline` short-
 * circuits everything: if the browser says there is no connection, that is the
 * story regardless of what the request reported.
 */
export const inferErrorKind = (input: {
  status?: number
  message?: string
  code?: string
  name?: string
  offline?: boolean
}): SmartPageErrorKind => {
  if (input.offline) return "network"

  const { status } = input
  if (status !== undefined) {
    if (status === 401) return "unauthorized"
    if (status === 403) return "forbidden"
    if (status === 404) return "notFound"
    if (status === 408 || status === 504) return "timeout"
    if (status === 429) return "rateLimited"
    if (status === 503) return "maintenance"
    if (status >= 500) return "server"
    // A 4xx we don't recognize is a real failure, but not a server crash.
    if (status >= 400) return "error"
  }

  const probe =
    `${input.code ?? ""} ${input.name ?? ""} ${input.message ?? ""}`.toLowerCase()
  if (!probe.trim()) return "error"
  if (/abort|timed?\s?out|timeout|econnaborted|etimedout/.test(probe))
    return "timeout"
  if (
    /network|failed to fetch|load failed|econnrefused|enotfound|dns|offline|fetch failed/.test(
      probe
    )
  ) {
    return "network"
  }
  return "error"
}

/** Everything a support ticket wants, in one copyable blob. */
export interface DiagnosticsInput extends NormalizedError {
  title?: string
  kind?: SmartPageErrorKind
  /** Page URL at the time of failure. */
  url?: string
  /** ISO timestamp; the caller supplies it so this stays pure. */
  timestamp?: string
  userAgent?: string
  /** App-supplied extras (tenant, user id, build sha…). */
  extra?: Record<string, string | number | boolean | null | undefined>
}

const DIAGNOSTIC_ORDER: [keyof DiagnosticsInput, string][] = [
  ["kind", "Kind"],
  ["status", "Status"],
  ["code", "Code"],
  ["traceId", "Trace ID"],
  ["path", "Path"],
  ["message", "Message"],
  ["name", "Type"],
  ["url", "URL"],
  ["timestamp", "Time"],
  ["userAgent", "User agent"],
]

/**
 * Render diagnostics as an aligned plain-text block — the thing behind the copy
 * button. Plain text, not JSON, because it gets pasted into a chat message or a
 * ticket by a person, and it has to survive that trip readably.
 *
 * Empty fields are omitted rather than printed as `undefined`; the stack, when
 * present, always goes last.
 */
export const buildDiagnostics = (input: DiagnosticsInput): string => {
  const rows: [string, string][] = []

  for (const [key, label] of DIAGNOSTIC_ORDER) {
    const value = input[key]
    if (value === undefined || value === null || value === "") continue
    rows.push([label, String(value)])
  }

  for (const [key, value] of Object.entries(input.extra ?? {})) {
    if (value === undefined || value === null || value === "") continue
    rows.push([key, String(value)])
  }

  const width = rows.reduce((max, [label]) => Math.max(max, label.length), 0)
  const body = rows.map(
    ([label, value]) => `${(label + ":").padEnd(width + 2)}${value}`
  )

  const heading = input.title?.trim()
  const lines = heading
    ? [heading, "─".repeat(Math.max(heading.length, 24)), ...body]
    : body

  if (input.stack) lines.push("", "Stack:", input.stack)

  return lines.join("\n")
}
