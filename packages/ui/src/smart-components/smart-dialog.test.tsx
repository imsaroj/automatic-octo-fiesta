import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartDialog } from "./smart-dialog"

/**
 * SmartDialog flattens the Dialog compound: `trigger` drives open/close,
 * `header`/`footer` land in the right slots, and `showCloseButton` controls the
 * × button. Content renders in a portal, so assertions query `document`.
 */

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function mount(ui: React.ReactElement) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const content = () => document.querySelector('[data-slot="dialog-content"]')
const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`)

test("stays closed until the trigger is clicked, then renders all zones", () => {
  mount(
    <SmartDialog
      trigger={<button data-testid="trigger">Edit profile</button>}
      header={{ title: "Edit profile", subtitle: "Make changes here." }}
      footer={<button data-testid="save">Save</button>}
    >
      <p data-testid="body">Form goes here</p>
    </SmartDialog>
  )

  expect(content()).toBeNull()

  const trigger = container.querySelector(
    '[data-testid="trigger"]'
  ) as HTMLElement
  act(() => trigger.click())

  expect(content()).not.toBeNull()
  expect(slot("dialog-title")?.textContent).toBe("Edit profile")
  expect(slot("dialog-description")?.textContent).toBe("Make changes here.")
  expect(document.querySelector('[data-testid="body"]')).not.toBeNull()
  expect(
    slot("dialog-footer")?.querySelector('[data-testid="save"]')
  ).not.toBeNull()
})

test("the built-in close button closes an uncontrolled dialog", () => {
  mount(
    <SmartDialog
      trigger={<button data-testid="trigger">Open</button>}
      header={{ title: "Hello" }}
    />
  )

  act(() =>
    (container.querySelector('[data-testid="trigger"]') as HTMLElement).click()
  )
  expect(content()).not.toBeNull()

  const close = document.querySelector(
    '[data-slot="dialog-close"]'
  ) as HTMLElement
  expect(close).not.toBeNull()
  act(() => close.click())
  expect(content()).toBeNull()
})

test("showCloseButton={false} removes the × button", () => {
  mount(
    <SmartDialog open onOpenChange={() => {}} showCloseButton={false}>
      <p>Body</p>
    </SmartDialog>
  )
  expect(content()).not.toBeNull()
  expect(slot("dialog-close")).toBeNull()
})

test("controlled mode: `open` renders without a trigger, close reports via onOpenChange", () => {
  const onOpenChange = vi.fn()
  mount(
    <SmartDialog open onOpenChange={onOpenChange} header={{ title: "Hi" }}>
      <p>Body</p>
    </SmartDialog>
  )
  expect(content()).not.toBeNull()

  act(() =>
    (
      document.querySelector('[data-slot="dialog-close"]') as HTMLElement
    ).click()
  )
  expect(onOpenChange).toHaveBeenCalled()
  expect(onOpenChange.mock.calls[0][0]).toBe(false)
  // Parent has not flipped `open`, so a controlled dialog stays mounted.
  expect(content()).not.toBeNull()
})

test("a subtitle-less header renders no description slot", () => {
  mount(
    <SmartDialog
      open
      onOpenChange={() => {}}
      header={{ title: "Only title" }}
    />
  )
  expect(slot("dialog-title")?.textContent).toBe("Only title")
  expect(slot("dialog-description")).toBeNull()
})
