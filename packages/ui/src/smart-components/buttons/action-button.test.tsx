import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { ActionButton } from "./action-button"
import { ActionPermissionProvider, Can } from "./action-permission"
import {
  AddButton,
  DeleteButton,
  EditButton,
  NextButton,
  SaveButton,
  SubmitButton,
} from "./action-buttons"

/**
 * The buttons layer is one config map + one resolver, so lock in the resolution
 * order: config supplies icon/label/variant/type/loadingText, per-instance
 * props win, and the permission gate hides or disables.
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

const button = () => container.querySelector("button") as HTMLButtonElement

test("preset renders the config defaults: label, icon, type=button", () => {
  mount(<AddButton />)

  expect(button().textContent).toBe("Add")
  expect(button().querySelector("svg")).not.toBeNull()
  expect(button().getAttribute("type")).toBe("button")
})

test("children replace the default label", () => {
  mount(<AddButton>New user</AddButton>)
  expect(button().textContent).toBe("New user")
})

test("SubmitButton defaults to type=submit", () => {
  mount(<SubmitButton />)
  expect(button().getAttribute("type")).toBe("submit")
})

test("iconOnly drops the label but keeps it as aria-label", () => {
  mount(<EditButton iconOnly />)

  expect(button().textContent).toBe("")
  expect(button().querySelector("svg")).not.toBeNull()
  expect(button().getAttribute("aria-label")).toBe("Edit")
})

test("loading swaps in the config loadingText", () => {
  mount(<SaveButton loading />)

  expect(button().disabled).toBe(true)
  expect(button().textContent).toContain("Saving…")
  expect(button().textContent).not.toContain("Save")
})

test("iconSide 'end' puts the icon after the label", () => {
  mount(<NextButton />)
  expect(button().lastElementChild?.tagName.toLowerCase()).toBe("svg")
})

test("permission=false hides by default, disables with deniedBehavior='disable'", () => {
  mount(<DeleteButton permission={false} />)
  expect(container.querySelector("button")).toBeNull()

  act(() => root.unmount())
  container.remove()

  mount(<DeleteButton permission={false} deniedBehavior="disable" />)
  expect(button().disabled).toBe(true)
})

test("ActionPermissionProvider gates by action; explicit permission wins", () => {
  mount(
    <ActionPermissionProvider can={(action) => action !== "delete"}>
      <AddButton />
      <DeleteButton />
      <ActionButton action="delete" permission>
        Force delete
      </ActionButton>
    </ActionPermissionProvider>
  )

  const buttons = container.querySelectorAll("button")
  expect(buttons).toHaveLength(2)
  expect(buttons[0]?.textContent).toBe("Add")
  expect(buttons[1]?.textContent).toBe("Force delete")
})

test("Can gate renders children when allowed, fallback when denied, passing context", () => {
  const seen: unknown[] = []
  mount(
    <ActionPermissionProvider
      can={(action, context) => {
        seen.push(context)
        return action !== "delete"
      }}
    >
      <Can action="edit" context={{ id: 7 }}>
        <span>editable</span>
      </Can>
      <Can action="delete" fallback={<span>locked</span>}>
        <span>deletable</span>
      </Can>
    </ActionPermissionProvider>
  )

  expect(container.textContent).toContain("editable")
  expect(container.textContent).toContain("locked")
  expect(container.textContent).not.toContain("deletable")
  // The resource context reaches the checker.
  expect(seen).toContainEqual({ id: 7 })
})

test("Can gate allows everything when no provider is mounted", () => {
  mount(
    <Can action="delete">
      <span>ungated</span>
    </Can>
  )
  expect(container.textContent).toContain("ungated")
})
