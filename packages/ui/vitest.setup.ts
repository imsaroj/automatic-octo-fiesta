import "@testing-library/jest-dom/vitest"

// Tests drive React with `act` directly (no Testing Library render). Base UI
// components schedule async state updates (portals, popups), which React only
// routes through act when this flag is set.
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// jsdom lacks a few layout APIs Base UI popups (Popover/Select positioning)
// and cmdk rely on. Behavior-free stubs are enough for render tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver
}
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {}
}
