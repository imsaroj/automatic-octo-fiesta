import { afterEach, beforeEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPageError } from "./smart-page-error"
import { SmartUIProvider } from "../provider"

/**
 * SmartPageError derives everything it shows from the raw caught value: the
 * message, the status/trace chips, the failure kind (and with it the tone and
 * whether a retry is even offered), the async retry state, the auto-retry
 * countdown, and the copyable diagnostics blob.
 */

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  setOnline(true)
})

const render = (ui: React.ReactElement) => {
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const alert = () => container.querySelector<HTMLElement>('[role="alert"]')!
const text = () => alert().textContent ?? ""
const buttons = () => [...alert().querySelectorAll("button")]
const buttonWith = (label: string) =>
  buttons().find((button) => button.textContent?.includes(label))

const setOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  })
}

// ── Defaults & derivation ─────────────────────────────────────────────────────

test("defaults: generic copy, no retry button, no diagnostics disclosure", () => {
  render(<SmartPageError />)

  expect(text()).toContain("Something went wrong")
  expect(alert().dataset.kind).toBe("error")
  expect(alert().dataset.tone).toBe("danger")
  expect(buttons()).toHaveLength(0)
  expect(alert().querySelector("details")).toBeNull()
})

test("derives kind, copy, chips and tone from a rejected response envelope", () => {
  render(
    <SmartPageError
      error={{
        message: "Request failed with status code 403",
        response: {
          status: 403,
          data: {
            success: false,
            message: "You need the Reports role to open this.",
            traceId: "b7f1c2e4",
          },
        },
      }}
      onRetry={vi.fn()}
    />
  )

  expect(alert().dataset.kind).toBe("forbidden")
  // A denial is not a crash — it must not be painted like one.
  expect(alert().dataset.tone).toBe("neutral")
  expect(text()).toContain("You don't have access to this")
  expect(text()).toContain("You need the Reports role to open this.")
  expect(text()).toContain("403")
  expect(text()).toContain("b7f1c2e4")
  // A 403 does not stop being a 403: no retry button even though onRetry exists.
  expect(buttonWith("Try again")).toBeUndefined()
})

test("a server error is retryable and shows the stack in the disclosure", () => {
  const error = new Error("Unexpected end of JSON input")
  render(<SmartPageError error={error} status={500} onRetry={vi.fn()} />)

  expect(alert().dataset.kind).toBe("server")
  expect(buttonWith("Try again")).toBeDefined()

  const details = alert().querySelector("details")!
  expect(details.textContent).toContain("Status:")
  expect(details.textContent).toContain("500")
  expect(details.textContent).toContain("Stack:")
})

test("explicit kind and copy beat everything derived", () => {
  render(
    <SmartPageError
      error={new Error("Failed to fetch")}
      kind="maintenance"
      title="Back at 09:00"
      description="Scheduled upgrade in progress."
    />
  )

  expect(alert().dataset.kind).toBe("maintenance")
  expect(alert().querySelector("h3")!.textContent).toBe("Back at 09:00")
  // The derived message is displaced from the headline area, but the raw error
  // still rides along in the (collapsed) diagnostics — that is the point of it.
  expect(alert().querySelector("h3")!.nextElementSibling!.textContent).toBe(
    "Scheduled upgrade in progress."
  )
  expect(alert().querySelector("details")!.textContent).toContain(
    "Failed to fetch"
  )
})

// ── Retry ─────────────────────────────────────────────────────────────────────

test("retry fires the callback and locks the button while a promise is pending", async () => {
  let resolveRetry: () => void = () => {}
  const onRetry = vi.fn(
    () => new Promise<void>((resolve) => (resolveRetry = resolve))
  )

  render(
    <SmartPageError
      error={new Error("boom")}
      onRetry={onRetry}
      retryLabel="Reload"
    />
  )

  const retry = buttonWith("Reload")!
  await act(async () => {
    retry.click()
  })

  expect(onRetry).toHaveBeenCalledTimes(1)
  expect(retry.disabled).toBe(true)
  expect(text()).toContain("Retrying…")

  await act(async () => {
    resolveRetry()
  })

  expect(retry.disabled).toBe(false)
  expect(text()).toContain("Reload")
})

test("a retry that rejects settles the button instead of leaving it spinning", async () => {
  const onRetry = vi.fn(() => Promise.reject(new Error("still down")))
  render(<SmartPageError error={new Error("boom")} onRetry={onRetry} />)

  await act(async () => {
    buttonWith("Try again")!.click()
  })

  expect(buttonWith("Try again")!.disabled).toBe(false)
})

test("showRetry forces the affordance on for a kind that normally hides it", () => {
  render(<SmartPageError status={404} onRetry={vi.fn()} showRetry />)
  expect(buttonWith("Try again")).toBeDefined()
})

// ── Auto retry ────────────────────────────────────────────────────────────────

test("autoRetryAfter counts down, fires, and gives up after maxAutoRetries", async () => {
  vi.useFakeTimers()
  const onRetry = vi.fn()

  render(
    <SmartPageError
      error={new Error("boom")}
      status={500}
      onRetry={onRetry}
      autoRetryAfter={2}
      maxAutoRetries={2}
    />
  )

  expect(text()).toContain("Retrying in 2s")

  await act(async () => {
    vi.advanceTimersByTime(1000)
  })
  expect(text()).toContain("Retrying in 1s")

  await act(async () => {
    vi.advanceTimersByTime(1000)
  })
  expect(onRetry).toHaveBeenCalledTimes(1)

  // Second and final automatic attempt.
  await act(async () => {
    vi.advanceTimersByTime(2000)
  })
  expect(onRetry).toHaveBeenCalledTimes(2)

  // Budget spent: the countdown retires rather than hammering a dead server.
  await act(async () => {
    vi.advanceTimersByTime(10_000)
  })
  expect(onRetry).toHaveBeenCalledTimes(2)
  expect(text()).not.toContain("Retrying in")
})

test("cancelling the countdown stops it permanently", async () => {
  vi.useFakeTimers()
  const onRetry = vi.fn()

  render(
    <SmartPageError
      error={new Error("boom")}
      status={500}
      onRetry={onRetry}
      autoRetryAfter={3}
    />
  )

  act(() => buttonWith("Cancel")!.click())
  expect(text()).not.toContain("Retrying in")

  await act(async () => {
    vi.advanceTimersByTime(10_000)
  })
  expect(onRetry).not.toHaveBeenCalled()
})

// ── Connectivity ──────────────────────────────────────────────────────────────

test("an offline browser reports a network failure whatever the error said", () => {
  setOnline(false)
  render(
    <SmartPageError error={new Error("Cannot read properties of undefined")} />
  )

  expect(alert().dataset.kind).toBe("network")
  expect(text()).toContain("Can't reach the server")
  expect(text()).toContain("back online")
})

test("retries by itself the moment the connection comes back", async () => {
  setOnline(false)
  const onRetry = vi.fn()
  render(
    <SmartPageError error={new Error("Failed to fetch")} onRetry={onRetry} />
  )

  expect(onRetry).not.toHaveBeenCalled()

  setOnline(true)
  await act(async () => {
    window.dispatchEvent(new Event("online"))
  })

  expect(onRetry).toHaveBeenCalledTimes(1)
})

test("retryOnReconnect={false} leaves it to the user", async () => {
  setOnline(false)
  const onRetry = vi.fn()
  render(
    <SmartPageError
      error={new Error("Failed to fetch")}
      onRetry={onRetry}
      retryOnReconnect={false}
    />
  )

  setOnline(true)
  await act(async () => {
    window.dispatchEvent(new Event("online"))
  })

  expect(onRetry).not.toHaveBeenCalled()
})

// ── Diagnostics ───────────────────────────────────────────────────────────────

test("copies the diagnostics blob, including app-supplied extras", async () => {
  const writeText = vi.fn<(value: string) => Promise<void>>(() =>
    Promise.resolve()
  )
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  })

  render(
    <SmartPageError
      error={new Error("boom")}
      status={500}
      traceId="b7f1c2e4"
      diagnostics={{ tenant: "acme" }}
    />
  )

  await act(async () => {
    buttonWith("Copy details")!.click()
  })

  const copied = writeText.mock.calls[0]![0]
  expect(copied).toContain("b7f1c2e4")
  expect(copied).toContain("tenant:")
  expect(copied).toContain("acme")
  expect(text()).toContain("Copied")
})

test("showDetails={false} suppresses the disclosure entirely", () => {
  render(
    <SmartPageError
      error={new Error("boom")}
      status={500}
      showDetails={false}
    />
  )
  expect(alert().querySelector("details")).toBeNull()
})

// ── Variants & labels ─────────────────────────────────────────────────────────

test("page fills its parent, overlay covers it, inline is a banner", () => {
  render(<SmartPageError />)
  expect(alert().className).toContain("flex-1")

  render(<SmartPageError variant="overlay" />)
  expect(alert().className).toContain("absolute")
  expect(alert().className).toContain("inset-0")

  render(<SmartPageError variant="inline" />)
  expect(alert().className).toContain("sui-err--inline")
  expect(alert().className).not.toContain("absolute")
})

test("all copy routes through the label provider", () => {
  render(
    <SmartUIProvider
      labels={{
        error: {
          retry: "다시 시도",
          kinds: {
            notFound: {
              title: "찾을 수 없음",
              description: "없는 페이지입니다.",
            },
          },
        },
      }}
    >
      <SmartPageError status={404} onRetry={vi.fn()} showRetry />
    </SmartUIProvider>
  )

  expect(text()).toContain("찾을 수 없음")
  expect(text()).toContain("없는 페이지입니다.")
  expect(text()).toContain("다시 시도")
})
