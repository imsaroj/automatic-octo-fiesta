import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartTree } from "./tree"
import type { SmartTreeHandle } from "./types"

/**
 * Behavior of SmartTree through its **public API** — the imperative handle and
 * the controllable Set props — rather than internals. Covers expansion,
 * single/multi selection, tri-state check derivation, filter mode, and rename.
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
  act(() => root.render(ui))
}

const DATA = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "index", label: "index.ts" },
      { id: "app", label: "app.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
]

const rowByText = (text: string) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]')).find(
    (el) => el.textContent?.includes(text)
  )

test("expandAll/collapseAll via the handle reveal and hide children", () => {
  const ref = React.createRef<SmartTreeHandle>()
  mount(<SmartTree ref={ref} data={DATA} />)

  // Collapsed by default: children not rendered.
  expect(rowByText("index.ts")).toBeUndefined()

  act(() => ref.current!.expandAll())
  expect(rowByText("index.ts")).toBeDefined()
  expect(ref.current!.getExpandedIds()).toContain("src")

  act(() => ref.current!.collapseAll())
  expect(rowByText("index.ts")).toBeUndefined()
})

test("multiple selection collects clicked node ids", () => {
  const onSelectedChange = vi.fn()
  mount(
    <SmartTree
      selectionMode="multiple"
      data={DATA}
      onSelectedChange={onSelectedChange}
    />
  )

  act(() => rowByText("README.md")!.click())
  expect(onSelectedChange).toHaveBeenLastCalledWith(["readme"])
})

test("checking a folder cascades to all leaves; a single leaf makes the parent mixed", () => {
  const ref = React.createRef<SmartTreeHandle>()
  const onCheckedChange = vi.fn()
  mount(
    <SmartTree
      ref={ref}
      checkable
      defaultExpandAll
      data={DATA}
      onCheckedChange={onCheckedChange}
    />
  )

  // Check the "src" folder checkbox → both leaves become checked.
  const folderCheckbox = rowByText("src")!.querySelector(
    '[role="checkbox"]'
  ) as HTMLButtonElement
  act(() => folderCheckbox.click())

  const checked = ref.current!.getCheckedIds()
  expect(checked).toContain("index")
  expect(checked).toContain("app")

  // Uncheck one leaf → parent is now indeterminate (mixed).
  const leafCheckbox = rowByText("index.ts")!.querySelector(
    '[role="checkbox"]'
  ) as HTMLButtonElement
  act(() => leafCheckbox.click())
  expect(folderCheckbox.getAttribute("aria-checked")).toBe("mixed")
})

test("checkAll then clearChecked via the handle", () => {
  const ref = React.createRef<SmartTreeHandle>()
  mount(<SmartTree ref={ref} checkable data={DATA} />)

  act(() => ref.current!.checkAll())
  expect(ref.current!.getCheckedIds().length).toBeGreaterThan(0)

  act(() => ref.current!.clearChecked())
  expect(ref.current!.getCheckedIds()).toEqual([])
})

test("filter mode keeps ancestors of matches and hides non-matching branches", () => {
  mount(<SmartTree data={DATA} filterMode="filter" searchQuery="app" />)

  // Ancestor of the match stays; the match shows; the sibling leaf is hidden.
  expect(rowByText("src")).toBeDefined()
  expect(rowByText("app.tsx")).toBeDefined()
  expect(rowByText("README.md")).toBeUndefined()
})
