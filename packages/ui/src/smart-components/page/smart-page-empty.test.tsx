import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPageEmpty } from "./smart-page-empty"

/** SmartPageEmpty: an accessible status region with icon/title/description/CTA. */

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

test("renders as a status region with all zones", () => {
  mount(
    <SmartPageEmpty
      icon={<svg data-testid="icon" />}
      title="No team members yet"
      description="Invite your first team member to get started."
      action={<button data-testid="cta">Invite member</button>}
    />
  )

  const region = container.querySelector('[role="status"]')!
  expect(region).not.toBeNull()
  expect(region.querySelector("h3")?.textContent).toBe("No team members yet")
  expect(region.textContent).toContain(
    "Invite your first team member to get started."
  )
  expect(region.querySelector('[data-testid="icon"]')).not.toBeNull()
  expect(region.querySelector('[data-testid="cta"]')).not.toBeNull()
})

test("title-only usage renders no icon bubble, description, or action", () => {
  mount(<SmartPageEmpty title="Nothing here" />)

  const region = container.querySelector('[role="status"]')!
  expect(region.querySelector("h3")?.textContent).toBe("Nothing here")
  expect(region.querySelector("p")).toBeNull()
  expect(region.querySelector("button")).toBeNull()
})
