"use client"

import * as React from "react"
import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  Gauge,
  KeyRound,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldBan,
  TriangleAlert,
  WifiOff,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { useSmartUILabels } from "@iamsaroj/smart-ui/smart-components/provider"

import {
  ERROR_KIND_RETRYABLE,
  ERROR_KIND_TONE,
  buildDiagnostics,
  inferErrorKind,
  normalizeError,
  type SmartPageErrorKind,
} from "./error-kind"

export type { SmartPageErrorKind, SmartPageErrorTone } from "./error-kind"

/** The mark for each failure kind. Copy lives in the label provider. */
const KIND_ICON: Record<SmartPageErrorKind, LucideIcon> = {
  error: TriangleAlert,
  network: WifiOff,
  timeout: Clock,
  rateLimited: Gauge,
  unauthorized: KeyRound,
  forbidden: ShieldBan,
  notFound: SearchX,
  server: ServerCrash,
  maintenance: Wrench,
}

// ── Online status ─────────────────────────────────────────────────────────────
// Read through `useSyncExternalStore` rather than state + listeners: connectivity
// is external, mutable, and shared, which is exactly what the store API is for —
// and it gives a correct server snapshot for free.

const subscribeOnline = (onChange: () => void) => {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

// `navigator.onLine === false` is trustworthy (no interface is up); `true` only
// means an interface exists, which is why it is a hint and never the whole story.
const getOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine !== false
const getOnlineServer = () => true

const useOnline = () =>
  React.useSyncExternalStore(subscribeOnline, getOnline, getOnlineServer)

export interface SmartPageErrorProps {
  /**
   * The raw caught value — an `Error`, a string, an axios rejection, a rejected
   * response envelope. Everything shown (message, status, trace id, stack, and
   * the inferred {@link SmartPageErrorKind}) is derived from it, so in the common
   * case this is the only prop you pass.
   */
  error?: unknown
  /**
   * Force a failure kind instead of inferring it from `error` / `status` /
   * connectivity. Sets the icon, tone, default copy, and whether a retry is
   * offered.
   */
  kind?: SmartPageErrorKind
  /** Headline. Defaults to the kind's copy. */
  title?: React.ReactNode
  /**
   * Supporting sentence. Defaults to the server's message when `error` carries
   * one, and to the kind's copy otherwise.
   */
  description?: React.ReactNode
  /** Replace the kind's icon. */
  icon?: React.ReactNode
  /** HTTP status, when it isn't already inside `error`. Shown as a chip. */
  status?: number
  /** Correlation id, when it isn't already inside `error`. Shown as a chip. */
  traceId?: string
  /**
   * Technical detail shown in the collapsed disclosure. Defaults to the stack
   * from `error`. Pass `""` to keep the disclosure but drop the stack.
   */
  detail?: string
  /** Extra key/values folded into the disclosure and the copied blob. */
  diagnostics?: Record<string, string | number | boolean | null | undefined>
  /** Show the "Technical details" disclosure. Defaults to on when there is anything to show. */
  showDetails?: boolean
  /**
   * Retry handler. May return a promise — the button shows a spinner and stays
   * disabled until it settles.
   */
  onRetry?: () => void | Promise<unknown>
  /** Label for the retry button. */
  retryLabel?: string
  /**
   * Force the retry affordance on/off. By default it renders whenever `onRetry`
   * is given **and** the kind is one a repeat request could fix (a 403 won't
   * stop being a 403, so no button is offered for it).
   */
  showRetry?: boolean
  /**
   * Retry automatically after this many seconds, with a visible draining
   * countdown the user can cancel. Off when omitted.
   */
  autoRetryAfter?: number
  /** How many automatic retries before giving up and waiting for a human. @default 3 */
  maxAutoRetries?: number
  /**
   * When the failure is a connectivity one, retry the moment the browser comes
   * back online. @default true
   */
  retryOnReconnect?: boolean
  /** Secondary actions rendered beside the retry button (Go back, Contact support…). */
  actions?: React.ReactNode
  /**
   * - `"page"` (default) — a full-bleed centred composition for a page's primary
   *   error slot; the counterpart to `SmartPageLoading`.
   * - `"overlay"` — a backdrop-blurred card covering its (relatively-positioned)
   *   parent. Use over content that failed to refresh, e.g. inside a data grid.
   * - `"inline"` — a compact banner for a card, section, or panel.
   */
  variant?: "page" | "overlay" | "inline"
  /** Additional class names on the root element. */
  className?: string
}

/**
 * Failure state for a page, a region, or a panel.
 *
 * Shown when a view can't render its primary data — a network drop, a 500, a
 * permission denial, a timeout. It is the error-side counterpart to
 * {@link SmartPageLoading} and shares its visual language: one calm centred
 * composition with a tinted bloom, not a red dashed box.
 *
 * ## What it does on its own
 * - **Classifies the failure.** Give it the raw caught value and it extracts the
 *   message, status, error code, trace id and stack (including from an axios
 *   rejection or a `{ success, code, message, traceId, path }` envelope), then
 *   picks an icon, a tone and default copy from the resulting
 *   {@link SmartPageErrorKind}. A 403 reads as a calm "no", not as a crash.
 * - **Knows about the network.** If the browser is offline it says so, and with
 *   `retryOnReconnect` (on by default) it retries by itself the moment the
 *   connection returns — the user never has to notice the button.
 * - **Handles async retries.** `onRetry` may return a promise; the button
 *   spins and locks until it settles. `autoRetryAfter` adds a draining countdown
 *   that gives up after `maxAutoRetries` rather than hammering a dead server.
 * - **Is support-ready.** The trace id is shown as a chip, and one click copies
 *   an aligned diagnostics block (status, code, trace id, path, URL, timestamp,
 *   user agent, stack) that can be pasted straight into a ticket.
 * - **Hides its own affordances when they'd lie.** No retry button for a kind a
 *   retry can't fix; no disclosure when there is nothing to disclose.
 *
 * All copy routes through `SmartUIProvider`'s `error` labels, so a translated
 * app gets translated failure states without touching a call site.
 *
 * ## Usage
 * ```tsx
 * // The whole thing, from a caught value
 * <SmartPageError error={error} onRetry={refetch} />
 *
 * // Pass to SmartPage's `error` prop for automatic placement
 * <SmartPage error={isError ? <SmartPageError error={error} onRetry={refetch} /> : undefined}>
 *   …children…
 * </SmartPage>
 *
 * // A flaky endpoint: try three times by itself before asking for help
 * <SmartPageError error={error} onRetry={refetch} autoRetryAfter={5} />
 *
 * // Inside a card
 * <SmartPageError variant="inline" error={error} onRetry={refetch} />
 * ```
 *
 * To catch *render* errors rather than data ones, wrap the subtree in
 * {@link SmartPageErrorBoundary}, which renders this component for you.
 */
export const SmartPageError = ({
  error,
  kind: kindProp,
  title: titleProp,
  description: descriptionProp,
  icon,
  status: statusProp,
  traceId: traceIdProp,
  detail,
  diagnostics,
  showDetails,
  onRetry,
  retryLabel,
  showRetry,
  autoRetryAfter,
  maxAutoRetries = 3,
  retryOnReconnect = true,
  actions,
  variant = "page",
  className,
}: SmartPageErrorProps) => {
  const labels = useSmartUILabels().error
  const online = useOnline()

  const normalized = React.useMemo(() => normalizeError(error), [error])
  const status = statusProp ?? normalized.status
  const traceId = traceIdProp ?? normalized.traceId

  const kind =
    kindProp ??
    inferErrorKind({
      status,
      message: normalized.message,
      code: normalized.code,
      name: normalized.name,
      offline: !online,
    })

  const tone = ERROR_KIND_TONE[kind]
  const kindCopy = labels.kinds[kind]
  const title = titleProp ?? kindCopy.title
  const description =
    descriptionProp ?? normalized.message ?? kindCopy.description

  const retryVisible =
    showRetry ?? (Boolean(onRetry) && ERROR_KIND_RETRYABLE[kind])

  // ── Retry ───────────────────────────────────────────────────────────────────
  const [pending, setPending] = React.useState(false)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const runRetry = React.useCallback(async () => {
    if (!onRetry) return
    setPending(true)
    try {
      await onRetry()
    } catch {
      // A retry that fails again is the normal case, not an exception: the
      // caller re-renders this component with the new error. Rethrowing would
      // only surface as an unhandled rejection.
    } finally {
      if (mounted.current) setPending(false)
    }
  }, [onRetry])

  // The auto-retry timer must not re-arm just because the handler's identity
  // changed between renders, so it reaches the callback through a ref.
  const runRetryRef = React.useRef(runRetry)
  React.useEffect(() => {
    runRetryRef.current = runRetry
  }, [runRetry])

  // ── Auto retry ──────────────────────────────────────────────────────────────
  const [autoAttempts, setAutoAttempts] = React.useState(0)
  const [autoCancelled, setAutoCancelled] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)

  const autoArmed = Boolean(
    onRetry &&
    retryVisible &&
    autoRetryAfter &&
    autoRetryAfter > 0 &&
    !autoCancelled &&
    !pending &&
    online &&
    autoAttempts < maxAutoRetries
  )

  // Seconds left, *derived* rather than stored: state holds only how many ticks
  // have elapsed in the current window, so disarming needs no write and the
  // first frame already shows the full window instead of flashing a blank.
  const remaining =
    autoArmed && autoRetryAfter ? Math.max(0, autoRetryAfter - elapsed) : null

  React.useEffect(() => {
    if (!autoArmed || !autoRetryAfter) return
    // The countdown is driven by a local, not by state, so the tick that fires
    // the retry can clear its own interval before React re-renders — no second
    // effect racing the "hit zero" transition.
    let left = autoRetryAfter
    const id = window.setInterval(() => {
      left -= 1
      if (left > 0) {
        setElapsed(autoRetryAfter - left)
        return
      }
      window.clearInterval(id)
      setAutoAttempts((count) => count + 1)
      void runRetryRef.current()
    }, 1000)
    // Every exit from an armed window — fired, cancelled, went offline — starts
    // the next one from zero.
    return () => {
      window.clearInterval(id)
      setElapsed(0)
    }
  }, [autoArmed, autoRetryAfter, autoAttempts])

  // ── Retry on reconnect ──────────────────────────────────────────────────────
  const wasOffline = React.useRef(!online)
  React.useEffect(() => {
    if (!online) {
      wasOffline.current = true
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    if (retryOnReconnect && retryVisible && kind === "network")
      void runRetryRef.current()
  }, [online, kind, retryOnReconnect, retryVisible])

  // ── Diagnostics ─────────────────────────────────────────────────────────────
  const stack = detail ?? normalized.stack
  const diagnosticsText = React.useMemo(
    () =>
      buildDiagnostics({
        ...normalized,
        title: typeof title === "string" ? title : undefined,
        kind,
        status,
        traceId,
        stack: stack || undefined,
        message:
          typeof description === "string" ? description : normalized.message,
        url: typeof window === "undefined" ? undefined : window.location.href,
        userAgent:
          typeof navigator === "undefined" ? undefined : navigator.userAgent,
        timestamp: new Date().toISOString(),
        extra: diagnostics,
      }),
    [normalized, title, description, kind, status, traceId, stack, diagnostics]
  )

  const hasDetails =
    showDetails ??
    Boolean(stack || traceId || status || normalized.code || diagnostics)

  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diagnosticsText)
      if (mounted.current) setCopied(true)
    } catch {
      // Clipboard access is permission-gated and absent over plain HTTP; the
      // text is on screen in the disclosure either way.
    }
  }, [diagnosticsText])

  // ── Pieces ──────────────────────────────────────────────────────────────────
  const Icon = KIND_ICON[kind]
  const inline = variant === "inline"

  const mark = icon ?? (
    <Icon className={inline ? "size-4.5" : "size-7"} strokeWidth={1.75} />
  )

  const chips = (status || traceId) && (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        inline ? "mt-2" : "mt-4 justify-center"
      )}
    >
      {status ? <Chip>{status}</Chip> : null}
      {traceId ? (
        <Chip mono title={traceId}>
          <span className="text-muted-foreground/70">{labels.traceLabel}</span>{" "}
          {traceId}
        </Chip>
      ) : null}
    </div>
  )

  const retryButton = retryVisible ? (
    <Button
      size={inline ? "sm" : "default"}
      onClick={() => void runRetry()}
      disabled={pending}
    >
      <RefreshCw className={cn(pending && "animate-spin")} />
      {pending ? labels.retrying : (retryLabel ?? labels.retry)}
    </Button>
  ) : null

  const actionRow =
    retryButton || actions ? (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          inline ? "shrink-0" : "mt-6 justify-center"
        )}
      >
        {retryButton}
        {actions}
      </div>
    ) : null

  const countdown =
    remaining !== null && autoRetryAfter ? (
      <div className="mt-4 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
        <span className="h-[3px] w-20 overflow-hidden rounded-full bg-foreground/[0.09]">
          <span
            className="sui-err__countdown block h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, (remaining / autoRetryAfter) * 100)}%`,
            }}
          />
        </span>
        <span>{labels.autoRetryIn(remaining)}</span>
        <button
          type="button"
          onClick={() => setAutoCancelled(true)}
          className="rounded-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {labels.cancel}
        </button>
      </div>
    ) : null

  const offlineHint =
    !online && kind === "network" ? (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          inline ? "mt-1.5" : "mt-4"
        )}
      >
        {labels.offlineHint}
      </p>
    ) : null

  const details = hasDetails ? (
    <details
      className={cn(
        "group w-full text-left",
        inline ? "mt-3" : "mt-8 max-w-md"
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
        {labels.details}
      </summary>
      <div className="mt-2 rounded-md border border-border/70 bg-muted/40">
        <pre className="max-h-52 overflow-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {diagnosticsText}
        </pre>
        <div className="flex justify-end border-t border-border/70 p-1.5">
          <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
            {copied ? <Check /> : <Copy />}
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
      </div>
    </details>
  ) : null

  // ── Inline variant ──────────────────────────────────────────────────────────
  if (inline) {
    return (
      <div
        role="alert"
        data-tone={tone}
        data-kind={kind}
        className={cn(
          "sui-err sui-err--inline sui-err__enter flex w-full flex-wrap items-start gap-3 rounded-lg border p-4 text-left sm:flex-nowrap",
          className
        )}
      >
        <span className="sui-err__mark sui-err__icon flex size-9 shrink-0 items-center justify-center rounded-lg border">
          {mark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
            {description}
          </p>
          {chips}
          {offlineHint}
          {details}
        </div>
        {actionRow}
      </div>
    )
  }

  // ── Page / overlay variants ─────────────────────────────────────────────────
  // The entrance is applied once, to the outermost element the variant owns: the
  // stage on a page, the whole backdrop for an overlay. Animating both would
  // multiply two opacity ramps and read as lag.
  const stage = (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center text-center",
        variant === "page" && "sui-err__enter"
      )}
    >
      <div className="relative flex size-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="sui-err__ring absolute inset-0 rounded-[1.25rem]"
        />
        <span className="sui-err__mark sui-err__icon relative flex size-16 items-center justify-center rounded-[1.25rem] border">
          {mark}
        </span>
      </div>

      <h3 className="mt-7 text-base font-semibold text-balance text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        {description}
      </p>

      {chips}
      {offlineHint}
      {actionRow}
      {countdown}
      {details}
    </div>
  )

  if (variant === "overlay") {
    return (
      <div
        role="alert"
        data-tone={tone}
        data-kind={kind}
        className={cn(
          "sui-err sui-err__enter absolute inset-0 z-20 flex items-center justify-center overflow-auto bg-background/70 p-6 backdrop-blur-sm",
          className
        )}
      >
        <div className="relative isolate flex w-full max-w-md justify-center overflow-hidden rounded-xl border bg-card px-6 py-8 shadow-lg">
          <div aria-hidden="true" className="sui-err__bloom" />
          {stage}
        </div>
      </div>
    )
  }

  return (
    <div
      role="alert"
      data-tone={tone}
      data-kind={kind}
      className={cn(
        "sui-err relative isolate flex h-full min-h-[280px] w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12",
        className
      )}
    >
      <div aria-hidden="true" className="sui-err__bloom" />
      {stage}
    </div>
  )
}

/** A small mono-ish metadata pill — status code, trace id. */
const Chip = ({
  children,
  mono,
  title,
}: {
  children: React.ReactNode
  mono?: boolean
  title?: string
}) => (
  <span
    title={title}
    className={cn(
      "inline-flex max-w-full items-center gap-1 truncate rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] leading-5 text-muted-foreground",
      mono && "font-mono"
    )}
  >
    {children}
  </span>
)
