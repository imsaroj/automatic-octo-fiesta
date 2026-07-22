"use client"

import * as React from "react"

import { SmartPageError, type SmartPageErrorProps } from "./smart-page-error"

/** What a render-time failure looks like to a custom fallback. */
export interface SmartPageErrorBoundaryState {
  /** The thrown value, exactly as React caught it. */
  error: unknown
  /** Component stack from React's `ErrorInfo`, when available. */
  componentStack?: string
  /** Clear the error and re-render the children. */
  reset: () => void
}

export interface SmartPageErrorBoundaryProps extends Pick<
  SmartPageErrorProps,
  | "variant"
  | "title"
  | "description"
  | "kind"
  | "actions"
  | "diagnostics"
  | "showDetails"
  | "className"
> {
  children: React.ReactNode
  /**
   * Replace the default {@link SmartPageError} fallback. As a function it gets
   * the error and a `reset` that re-renders the children.
   */
  fallback?:
    | React.ReactNode
    | ((state: SmartPageErrorBoundaryState) => React.ReactNode)
  /**
   * Called once per caught error — wire your logger here. Runs during React's
   * commit phase, so keep it cheap and never throw from it.
   */
  onError?: (error: unknown, componentStack?: string) => void
  /** Called when the boundary clears, whether via `reset` or `resetKeys`. */
  onReset?: () => void
  /**
   * Clear the error whenever any of these change — typically `[location.pathname]`
   * or the query key the subtree reads. Without it, a boundary that catches on
   * one route stays broken after navigating away.
   */
  resetKeys?: readonly unknown[]
}

interface State {
  error: unknown
  componentStack?: string
  hasError: boolean
}

const keysChanged = (a: readonly unknown[] = [], b: readonly unknown[] = []) =>
  a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]))

/**
 * Catches render-time errors in its subtree and shows {@link SmartPageError}.
 *
 * `SmartPageError` covers *data* failures a caller already caught. This covers
 * the other half: the ones that escape — a null dereference in a cell renderer,
 * a lazy chunk that fails to load, a bad shape from an API that only explodes at
 * render. React unmounts the whole tree for those, so without a boundary a
 * single bad row blanks the entire app.
 *
 * Class component by necessity: `componentDidCatch` / `getDerivedStateFromError`
 * have no hook equivalent, and React still has no plans to add one.
 *
 * ## Behaviour worth knowing
 * - The default fallback wires `reset` to the retry button, so "Try again" means
 *   "re-render the subtree" — which is exactly right for a transient failure and
 *   a no-op loop for a deterministic one, hence `resetKeys` for the common
 *   "navigate away and it should heal" case.
 * - It does **not** catch errors in event handlers, `setTimeout`, or rejected
 *   promises — React never routes those to a boundary. Catch those yourself and
 *   render `SmartPageError` directly.
 * - Place one per meaningful region, not just one at the root: a boundary around
 *   a chart lets the rest of the dashboard survive it.
 *
 * ## Usage
 * ```tsx
 * // Whole route, healing on navigation
 * <SmartPageErrorBoundary resetKeys={[location.pathname]}>
 *   <Routes>…</Routes>
 * </SmartPageErrorBoundary>
 *
 * // One region, reported to your logger
 * <SmartPageErrorBoundary variant="inline" onError={(e, stack) => log(e, stack)}>
 *   <RevenueChart />
 * </SmartPageErrorBoundary>
 * ```
 */
export class SmartPageErrorBoundary extends React.Component<
  SmartPageErrorBoundaryProps,
  State
> {
  state: State = {
    error: undefined,
    componentStack: undefined,
    hasError: false,
  }

  static getDerivedStateFromError(error: unknown): State {
    return { error, componentStack: undefined, hasError: true }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Keep the component stack for the diagnostics blob — it names the component
    // that threw, which the JS stack of a minified bundle usually does not.
    const componentStack = info.componentStack ?? undefined
    this.setState({ componentStack })
    this.props.onError?.(error, componentStack)
  }

  componentDidUpdate(prev: SmartPageErrorBoundaryProps) {
    if (
      this.state.hasError &&
      keysChanged(prev.resetKeys, this.props.resetKeys)
    ) {
      this.reset()
    }
  }

  reset = () => {
    if (!this.state.hasError) return
    this.setState({
      error: undefined,
      componentStack: undefined,
      hasError: false,
    })
    this.props.onReset?.()
  }

  render() {
    const { children, fallback, ...rest } = this.props
    if (!this.state.hasError) return children

    const { error, componentStack } = this.state

    if (typeof fallback === "function") {
      return fallback({ error, componentStack, reset: this.reset })
    }
    if (fallback !== undefined) return fallback

    const {
      variant,
      title,
      description,
      kind,
      actions,
      diagnostics,
      showDetails,
      className,
    } = rest

    // The component stack belongs with the JS stack, not in the aligned key/value
    // rows — it is multi-line, and splitting the two halves of one trace across
    // the blob makes the paste harder to read, not easier.
    const jsStack = error instanceof Error ? error.stack : undefined
    const detail = componentStack
      ? [jsStack, `Component stack:${componentStack}`]
          .filter(Boolean)
          .join("\n\n")
      : jsStack

    return (
      <SmartPageError
        error={error}
        kind={kind}
        title={title}
        description={description}
        variant={variant}
        actions={actions}
        showDetails={showDetails}
        className={className}
        detail={detail}
        diagnostics={diagnostics}
        onRetry={this.reset}
      />
    )
  }
}
