import { afterEach, expect, test } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { useGridColumnVisibility } from "./grid-column-visibility"
import type { DataGridColumn } from "./grid-internals"

/**
 * Shared column-visibility state: the map init respects `hide`, `menuColumns`
 * are shaped for the toolbar (id/label/visible), and `setColumnVisible` flips
 * one entry. State is driven and read through the DOM so assertions never touch
 * a value captured during render.
 */

interface Row {
  id: string
  name: string
  email: string
}

const columns: DataGridColumn<Row>[] = [
  { field: "name", headerName: "Name" },
  { field: "email", headerName: "Email", hide: true },
]

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// Each column renders a toggle button so the test drives `setColumnVisible`
// through a click and reads the committed `menuColumns` off the DOM.
const Probe = () => {
  const { menuColumns, setColumnVisible } = useGridColumnVisibility(columns)
  return (
    <ul>
      {menuColumns.map((c) => (
        <li key={c.id} data-id={c.id} data-visible={String(c.visible)}>
          <button
            data-toggle={c.id}
            onClick={() => setColumnVisible(c.id, !c.visible)}
          >
            {c.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

const mount = () => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<Probe />))
}

const li = (id: string) =>
  container.querySelector<HTMLLIElement>(`li[data-id="${id}"]`)
const toggle = (id: string) =>
  act(() =>
    container
      .querySelector<HTMLButtonElement>(`button[data-toggle="${id}"]`)
      ?.click()
  )

test("initial visibility respects each column's `hide` flag", () => {
  mount()
  expect(li("name")?.dataset.visible).toBe("true")
  expect(li("email")?.dataset.visible).toBe("false")
})

test("menuColumns carry id + label + visible for the toolbar menu", () => {
  mount()
  const rows = Array.from(container.querySelectorAll("li")).map((el) => ({
    id: el.dataset.id,
    label: el.textContent,
    visible: el.dataset.visible,
  }))
  expect(rows).toEqual([
    { id: "name", label: "Name", visible: "true" },
    { id: "email", label: "Email", visible: "false" },
  ])
})

test("setColumnVisible flips exactly one entry", () => {
  mount()
  toggle("email")
  expect(li("email")?.dataset.visible).toBe("true")
  expect(li("name")?.dataset.visible).toBe("true")

  toggle("name")
  expect(li("name")?.dataset.visible).toBe("false")
  expect(li("email")?.dataset.visible).toBe("true")
})
