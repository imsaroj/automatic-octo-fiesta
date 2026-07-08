import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartTransferList } from "./transfer-list"
import type { SmartTransferListHandle } from "./types"

/**
 * Behavior of SmartTransferList through its public API — the imperative handle,
 * the controllable target ids, and `onChange`'s `TransferChangeMeta`. Covers
 * move-all/move-selected both directions, disabled items, and the meta payload.
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

const ITEMS = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Bravo" },
  { id: "c", label: "Charlie" },
]

const optionByText = (text: string) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="option"]')).find(
    (el) => el.textContent?.includes(text)
  )

test("moveAllToTarget moves every enabled item and fires onChange meta", () => {
  const ref = React.createRef<SmartTransferListHandle>()
  const onChange = vi.fn()
  mount(<SmartTransferList ref={ref} items={ITEMS} onChange={onChange} />)

  act(() => ref.current!.moveAllToTarget())

  expect(ref.current!.getTargetIds().sort()).toEqual(["a", "b", "c"])
  const [targetIds, meta] = onChange.mock.calls.at(-1)!
  expect(targetIds.sort()).toEqual(["a", "b", "c"])
  expect(meta.direction).toBe("toTarget")
  expect(meta.moved.map((m: { id: string }) => m.id).sort()).toEqual([
    "a",
    "b",
    "c",
  ])
})

test("moveSelectedToTarget only moves highlighted items", () => {
  const ref = React.createRef<SmartTransferListHandle>()
  mount(<SmartTransferList ref={ref} items={ITEMS} />)

  // Highlight one source option, then move the selection.
  act(() => optionByText("Bravo")!.click())
  act(() => ref.current!.moveSelectedToTarget())

  expect(ref.current!.getTargetIds()).toEqual(["b"])
})

test("moveAllToSource empties the target", () => {
  const ref = React.createRef<SmartTransferListHandle>()
  mount(
    <SmartTransferList ref={ref} items={ITEMS} defaultTargetIds={["a", "b"]} />
  )
  expect(ref.current!.getTargetIds().sort()).toEqual(["a", "b"])

  act(() => ref.current!.moveAllToSource())
  expect(ref.current!.getTargetIds()).toEqual([])
})

test("disabled items are not moved by move-all", () => {
  const ref = React.createRef<SmartTransferListHandle>()
  mount(
    <SmartTransferList
      ref={ref}
      items={[
        { id: "a", label: "Alpha" },
        { id: "b", label: "Bravo", disabled: true },
        { id: "c", label: "Charlie" },
      ]}
    />
  )

  act(() => ref.current!.moveAllToTarget())
  expect(ref.current!.getTargetIds().sort()).toEqual(["a", "c"])
})

test("controlled targetIds: onChange reports the next ids without moving on its own", () => {
  const ref = React.createRef<SmartTransferListHandle>()
  const onChange = vi.fn()
  mount(
    <SmartTransferList
      ref={ref}
      items={ITEMS}
      targetIds={[]}
      onChange={onChange}
    />
  )

  act(() => ref.current!.moveAllToTarget())

  // Controlled: internal target stays empty until the parent applies the ids.
  expect(ref.current!.getTargetIds()).toEqual([])
  const [nextIds] = onChange.mock.calls.at(-1)!
  expect(nextIds.sort()).toEqual(["a", "b", "c"])
})
