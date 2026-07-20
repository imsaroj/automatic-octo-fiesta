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

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const content = () => document.querySelector('[data-slot="dialog-content"]')
const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`)

/**
 * Controlled opens are deferred by one macrotask (see
 * internal/use-deferred-open.ts, the outside-press race fix) — flush that tick
 * so the popup actually mounts.
 */
const flushOpen = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

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

test("showCloseButton={false} removes the × button", async () => {
  mount(
    <SmartDialog open onOpenChange={() => {}} showCloseButton={false}>
      <p>Body</p>
    </SmartDialog>
  )
  await flushOpen()
  expect(content()).not.toBeNull()
  expect(slot("dialog-close")).toBeNull()
})

test("controlled mode: `open` renders without a trigger, close reports via onOpenChange", async () => {
  const onOpenChange = vi.fn()
  mount(
    <SmartDialog open onOpenChange={onOpenChange} header={{ title: "Hi" }}>
      <p>Body</p>
    </SmartDialog>
  )
  await flushOpen()
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

test("a subtitle-less header renders no description slot", async () => {
  mount(
    <SmartDialog
      open
      onOpenChange={() => {}}
      header={{ title: "Only title" }}
    />
  )
  await flushOpen()
  expect(slot("dialog-title")?.textContent).toBe("Only title")
  expect(slot("dialog-description")).toBeNull()
})

test("a dialog opened from another element's click survives that click settling", async () => {
  // Regression for the outside-press race: opening from inside another
  // interaction (a grid row button, a menu item) used to let the popup read
  // that same click as an outside press and close itself. The consumer-side
  // workaround was `setTimeout(0)` at every call site; the wrapper now owns
  // the deferral, so a plain synchronous setState(true) in a click handler
  // must yield a dialog that is open and *stays* open.
  const Host = () => {
    const [open, setOpen] = React.useState(false)
    return (
      <>
        <button data-testid="row-action" onClick={() => setOpen(true)}>
          Edit
        </button>
        <SmartDialog
          open={open}
          onOpenChange={setOpen}
          header={{ title: "Edit row" }}
        >
          <p>Body</p>
        </SmartDialog>
      </>
    )
  }
  mount(<Host />)

  const rowAction = container.querySelector(
    '[data-testid="row-action"]'
  ) as HTMLElement
  // Full pointer/mouse/click sequence, like a real interaction.
  act(() => {
    rowAction.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
    )
    rowAction.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    )
    rowAction.dispatchEvent(
      new MouseEvent("pointerup", { bubbles: true, cancelable: true })
    )
    rowAction.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true })
    )
    rowAction.click()
  })
  // Not open yet (deferred one tick) …
  expect(content()).toBeNull()
  await flushOpen()
  // … then open, and still open after further ticks (nothing dismissed it).
  expect(content()).not.toBeNull()
  await flushOpen()
  expect(content()).not.toBeNull()
})
