import { describe, expect, it } from "vitest"
import type { TransferItem } from "@/transfer-list-engine/types"
import {
  addToTarget,
  filterItems,
  getItemText,
  matchesQuery,
  movableIds,
  partitionItems,
  removeFromTarget,
} from "@/transfer-list-engine/transfer-utils"

const items: TransferItem[] = [
  { id: "a", label: "Apple" },
  { id: "b", label: "Banana" },
  { id: "c", label: "Cherry", disabled: true },
  { id: "d", label: "Date" },
]

describe("getItemText", () => {
  it("prefers explicit searchText", () => {
    expect(
      getItemText({ id: "x", label: <span>node</span>, searchText: "hi" })
    ).toBe("hi")
  })
  it("falls back to a string label", () => {
    expect(getItemText({ id: "x", label: "Label" })).toBe("Label")
  })
  it("falls back to the id for non-string labels", () => {
    expect(getItemText({ id: "x", label: <span>node</span> })).toBe("x")
  })
})

describe("matchesQuery / filterItems", () => {
  it("matches case-insensitively and ignores surrounding space", () => {
    expect(matchesQuery(items[0]!, "  app ")).toBe(true)
    expect(matchesQuery(items[0]!, "xyz")).toBe(false)
  })
  it("returns the same array reference for an empty query", () => {
    expect(filterItems(items, "   ")).toBe(items)
  })
  it("filters to matching items", () => {
    expect(filterItems(items, "a").map((i) => i.id)).toEqual(["a", "b", "d"])
  })
})

describe("partitionItems", () => {
  it("splits by target membership, source stays in canonical order", () => {
    const { source, target } = partitionItems(items, ["d", "a"])
    expect(source.map((i) => i.id)).toEqual(["b", "c"])
    expect(target.map((i) => i.id)).toEqual(["d", "a"])
  })
  it("preserveTargetOrder=false sorts the target canonically", () => {
    const { target } = partitionItems(items, ["d", "a"], false)
    expect(target.map((i) => i.id)).toEqual(["a", "d"])
  })
  it("drops target ids that no longer exist", () => {
    const { target } = partitionItems(items, ["a", "ghost"])
    expect(target.map((i) => i.id)).toEqual(["a"])
  })
})

describe("addToTarget / removeFromTarget", () => {
  it("appends preserving order and de-duplicates", () => {
    expect(addToTarget(["a"], ["b", "a", "c"])).toEqual(["a", "b", "c"])
  })
  it("removes without disturbing the rest", () => {
    expect(removeFromTarget(["a", "b", "c"], ["b"])).toEqual(["a", "c"])
  })
})

describe("movableIds", () => {
  it("excludes disabled items", () => {
    expect(movableIds(items)).toEqual(["a", "b", "d"])
  })
})
