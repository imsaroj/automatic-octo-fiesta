import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartConfirmDialog } from "./smart-confirm-dialog"

/**
 * SmartConfirmDialog's contract: trigger-driven (uncontrolled) or controlled
 * open state, confirm runs the callback then closes, cancel closes without it,
 * and `variant="destructive"` styles the confirm button.
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

const content = () =>
  document.querySelector('[data-slot="alert-dialog-content"]')
const actionButton = () =>
  document.querySelector<HTMLButtonElement>('[data-slot="alert-dialog-action"]')
const cancelButton = () =>
  document.querySelector<HTMLButtonElement>('[data-slot="alert-dialog-cancel"]')

const openViaTrigger = () => {
  act(() =>
    (container.querySelector('[data-testid="trigger"]') as HTMLElement).click()
  )
}

test("opens from the trigger with default title and button labels", () => {
  mount(
    <SmartConfirmDialog
      trigger={<button data-testid="trigger">Delete</button>}
      onConfirm={() => {}}
    />
  )

  expect(content()).toBeNull()
  openViaTrigger()

  expect(content()).not.toBeNull()
  expect(
    document.querySelector('[data-slot="alert-dialog-title"]')?.textContent
  ).toBe("Are you sure?")
  expect(actionButton()?.textContent).toBe("Confirm")
  expect(cancelButton()?.textContent).toBe("Cancel")
})

test("confirming calls onConfirm exactly once and closes the dialog", () => {
  const onConfirm = vi.fn()
  mount(
    <SmartConfirmDialog
      trigger={<button data-testid="trigger">Delete</button>}
      title="Delete account?"
      description="This cannot be undone."
      confirmLabel="Delete account"
      onConfirm={onConfirm}
    />
  )
  openViaTrigger()
  expect(
    document.querySelector('[data-slot="alert-dialog-description"]')
      ?.textContent
  ).toBe("This cannot be undone.")

  act(() => actionButton()!.click())

  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(content()).toBeNull()
})

test("cancel closes without calling onConfirm", () => {
  const onConfirm = vi.fn()
  mount(
    <SmartConfirmDialog
      trigger={<button data-testid="trigger">Delete</button>}
      onConfirm={onConfirm}
    />
  )
  openViaTrigger()

  act(() => cancelButton()!.click())

  expect(onConfirm).not.toHaveBeenCalled()
  expect(content()).toBeNull()
})

test("variant=destructive styles the confirm button", () => {
  mount(
    <SmartConfirmDialog
      open
      onOpenChange={() => {}}
      onConfirm={() => {}}
      variant="destructive"
    />
  )
  expect(actionButton()!.className).toContain("destructive")
})

test("controlled mode reports open-state changes through onOpenChange", () => {
  const onOpenChange = vi.fn()
  const onConfirm = vi.fn()
  mount(
    <SmartConfirmDialog
      open
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  )
  expect(content()).not.toBeNull()

  act(() => actionButton()!.click())
  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
