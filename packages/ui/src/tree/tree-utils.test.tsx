import { describe, expect, it } from "vitest"
import type { TreeNode } from "@/tree/types"
import {
  buildNodeMap,
  buildParentMap,
  computeCheckState,
  computeMatches,
  defaultMatch,
  flattenVisible,
  getAllFolderIds,
  getAllIds,
  getAncestorIds,
  getDescendantIds,
  getLeafIds,
  insertNode,
  isDescendantOf,
  isFolderNode,
  moveNode,
  removeNode,
  toggleChecked,
  updateNode,
  walkTree,
} from "@/tree/tree-utils"

// A small fixture reused across the suite:
//
//   root                     (folder)
//   ├─ src                   (folder)
//   │  ├─ a.ts               (leaf, id "a")
//   │  └─ b.ts               (leaf, id "b")
//   ├─ docs                  (folder)
//   │  └─ readme.md          (leaf, id "readme")
//   └─ package.json          (leaf, id "pkg")
//
// The functions under test are all pure/immutable, so a shared const doubles as
// a mutation guard: if anything mutates it, later tests break.
const tree: TreeNode[] = [
  {
    id: "root",
    label: "root",
    children: [
      {
        id: "src",
        label: "src",
        children: [
          { id: "a", label: "a.ts" },
          { id: "b", label: "b.ts" },
        ],
      },
      {
        id: "docs",
        label: "docs",
        children: [{ id: "readme", label: "readme.md" }],
      },
      { id: "pkg", label: "package.json" },
    ],
  },
]

describe("isFolderNode", () => {
  it("treats a node with a children array (even empty) as a folder", () => {
    expect(isFolderNode({ id: "x", label: "x", children: [] })).toBe(true)
    expect(
      isFolderNode({ id: "x", label: "x", children: [{ id: "y", label: "y" }] })
    ).toBe(true)
  })

  it("honors the explicit isFolder flag for lazy/empty folders", () => {
    expect(isFolderNode({ id: "x", label: "x", isFolder: true })).toBe(true)
  })

  it("treats a childless node as a leaf", () => {
    expect(isFolderNode({ id: "x", label: "x" })).toBe(false)
  })
})

describe("walkTree", () => {
  it("visits every node depth-first, parent before children", () => {
    const order: string[] = []
    walkTree(tree, (n) => order.push(n.id))
    expect(order).toEqual(["root", "src", "a", "b", "docs", "readme", "pkg"])
  })

  it("reports the correct parentId and level for each node", () => {
    const seen: Record<string, { parentId: string | null; level: number }> = {}
    walkTree(tree, (n, parentId, level) => {
      seen[n.id] = { parentId, level }
    })
    expect(seen.root).toEqual({ parentId: null, level: 0 })
    expect(seen.src).toEqual({ parentId: "root", level: 1 })
    expect(seen.a).toEqual({ parentId: "src", level: 2 })
    expect(seen.readme).toEqual({ parentId: "docs", level: 2 })
    expect(seen.pkg).toEqual({ parentId: "root", level: 1 })
  })
})

describe("id collectors", () => {
  it("getAllIds returns every id in DFS order", () => {
    expect(getAllIds(tree)).toEqual([
      "root",
      "src",
      "a",
      "b",
      "docs",
      "readme",
      "pkg",
    ])
  })

  it("getAllFolderIds returns only expandable nodes", () => {
    expect(getAllFolderIds(tree)).toEqual(["root", "src", "docs"])
  })

  it("getLeafIds returns only non-folder nodes", () => {
    expect(getLeafIds(tree)).toEqual(["a", "b", "readme", "pkg"])
  })
})

describe("maps and ancestry", () => {
  it("buildNodeMap indexes every node by id", () => {
    const map = buildNodeMap(tree)
    expect(map.size).toBe(7)
    expect(map.get("a")?.label).toBe("a.ts")
    expect(map.get("missing")).toBeUndefined()
  })

  it("buildParentMap maps each node to its parent (roots to null)", () => {
    const map = buildParentMap(tree)
    expect(map.get("root")).toBeNull()
    expect(map.get("a")).toBe("src")
    expect(map.get("readme")).toBe("docs")
    expect(map.get("pkg")).toBe("root")
  })

  it("getAncestorIds walks nearest-parent-first up to the root", () => {
    const map = buildParentMap(tree)
    expect(getAncestorIds("a", map)).toEqual(["src", "root"])
    expect(getAncestorIds("root", map)).toEqual([])
  })

  it("getDescendantIds returns the subtree minus the node itself", () => {
    const src = buildNodeMap(tree).get("src")!
    expect(getDescendantIds(src)).toEqual(["a", "b"])
    expect(getDescendantIds(buildNodeMap(tree).get("root")!)).toEqual([
      "src",
      "a",
      "b",
      "docs",
      "readme",
      "pkg",
    ])
    expect(getDescendantIds({ id: "leaf", label: "leaf" })).toEqual([])
  })

  it("isDescendantOf detects ancestor relationships and rejects the rest", () => {
    const map = buildParentMap(tree)
    expect(isDescendantOf("a", "root", map)).toBe(true)
    expect(isDescendantOf("a", "src", map)).toBe(true)
    expect(isDescendantOf("a", "docs", map)).toBe(false)
    expect(isDescendantOf("root", "a", map)).toBe(false)
  })
})

describe("defaultMatch", () => {
  it("is a case-insensitive substring test on the label", () => {
    expect(defaultMatch({ id: "a", label: "a.ts" }, "A")).toBe(true)
    expect(defaultMatch({ id: "a", label: "readme.md" }, "ME")).toBe(true)
    expect(defaultMatch({ id: "a", label: "a.ts" }, "zzz")).toBe(false)
  })

  it("returns false for an empty query", () => {
    expect(defaultMatch({ id: "a", label: "a.ts" }, "   ")).toBe(false)
  })

  it("returns false when the label is not plain text", () => {
    expect(defaultMatch({ id: "a", label: <span>a.ts</span> }, "a")).toBe(false)
  })
})

describe("computeMatches", () => {
  it("marks direct matches and keeps their ancestors visible", () => {
    const { matched, visible } = computeMatches(tree, "read", defaultMatch)
    expect([...matched]).toEqual(["readme"])
    // The match plus its ancestor chain (docs, root) stay visible; unrelated
    // branches (src) do not.
    expect(visible.has("readme")).toBe(true)
    expect(visible.has("docs")).toBe(true)
    expect(visible.has("root")).toBe(true)
    expect(visible.has("src")).toBe(false)
  })

  it("returns empty sets when nothing matches", () => {
    const { matched, visible } = computeMatches(tree, "nope", defaultMatch)
    expect(matched.size).toBe(0)
    expect(visible.size).toBe(0)
  })
})

describe("flattenVisible", () => {
  it("shows only root nodes when nothing is expanded", () => {
    const flat = flattenVisible(tree, new Set())
    expect(flat.map((f) => f.node.id)).toEqual(["root"])
  })

  it("reveals a folder's direct children when it is expanded", () => {
    const flat = flattenVisible(tree, new Set(["root"]))
    expect(flat.map((f) => f.node.id)).toEqual(["root", "src", "docs", "pkg"])
  })

  it("emits the full DFS order when every folder is expanded", () => {
    const flat = flattenVisible(tree, new Set(getAllFolderIds(tree)))
    expect(flat.map((f) => f.node.id)).toEqual([
      "root",
      "src",
      "a",
      "b",
      "docs",
      "readme",
      "pkg",
    ])
  })

  it("computes isLast and ancestorHasNext for guide lines", () => {
    const flat = flattenVisible(tree, new Set(getAllFolderIds(tree)))
    const byId = new Map(flat.map((f) => [f.node.id, f]))

    // "a" and "b" share parent "src"; only "b" is the last child.
    expect(byId.get("a")?.isLast).toBe(false)
    expect(byId.get("b")?.isLast).toBe(true)
    // "pkg" is the last child of "root"; "docs" is not.
    expect(byId.get("pkg")?.isLast).toBe(true)
    expect(byId.get("docs")?.isLast).toBe(false)

    // ancestorHasNext[i] = does the ancestor at depth i have a sibling below?
    // root is the sole top-level node (no sibling below), src does have one.
    expect(byId.get("a")?.ancestorHasNext).toEqual([false, true])
    expect(byId.get("a")?.level).toBe(2)
  })

  it("in filter mode shows only visible ids and force-expands them", () => {
    const { visible } = computeMatches(tree, "read", defaultMatch)
    const flat = flattenVisible(tree, new Set(), {
      visibleIds: visible,
      forceExpandForFilter: true,
    })
    // Collapsed set, yet the matching branch is expanded down to the hit.
    expect(flat.map((f) => f.node.id)).toEqual(["root", "docs", "readme"])
  })
})

describe("computeCheckState", () => {
  it("marks partially-checked folders indeterminate", () => {
    const { checked, indeterminate } = computeCheckState(
      tree,
      new Set(["a"]),
      false
    )
    expect(checked.has("a")).toBe(true)
    expect(checked.has("b")).toBe(false)
    // Only one of src's two leaves is on → src (and root above it) are mixed.
    expect(indeterminate.has("src")).toBe(true)
    expect(indeterminate.has("root")).toBe(true)
    expect(indeterminate.has("docs")).toBe(false)
  })

  it("stores fully-checked folder ids when canCheckFolders is on", () => {
    const { checked, indeterminate } = computeCheckState(
      tree,
      new Set(["a", "b"]),
      true
    )
    expect(checked.has("src")).toBe(true) // both leaves on → folder checked
    expect(indeterminate.has("root")).toBe(true) // docs/pkg still unchecked
  })

  it("marks every folder checked when the whole tree is checked", () => {
    const { checked, indeterminate } = computeCheckState(
      tree,
      new Set(getLeafIds(tree)),
      true
    )
    for (const id of getAllIds(tree)) expect(checked.has(id)).toBe(true)
    expect(indeterminate.size).toBe(0)
  })
})

describe("toggleChecked", () => {
  it("checking a folder adds all its leaves", () => {
    const src = buildNodeMap(tree).get("src")!
    const next = toggleChecked(src, true, new Set(), false)
    expect([...next].sort()).toEqual(["a", "b"])
  })

  it("unchecking a folder removes its leaves but leaves others alone", () => {
    const src = buildNodeMap(tree).get("src")!
    const next = toggleChecked(src, false, new Set(["a", "b", "readme"]), false)
    expect([...next]).toEqual(["readme"])
  })

  it("stores the folder id too when canCheckFolders is on", () => {
    const src = buildNodeMap(tree).get("src")!
    const next = toggleChecked(src, true, new Set(), true)
    expect(next.has("src")).toBe(true)
    expect(next.has("a")).toBe(true)
  })

  it("skips nodes opted out via checkable: false", () => {
    const folder: TreeNode = {
      id: "f",
      label: "f",
      children: [
        { id: "on", label: "on" },
        { id: "off", label: "off", checkable: false },
      ],
    }
    const next = toggleChecked(folder, true, new Set(), false)
    expect(next.has("on")).toBe(true)
    expect(next.has("off")).toBe(false)
  })
})

describe("insertNode", () => {
  it("appends a child to a folder", () => {
    const next = insertNode(tree, "src", { id: "c", label: "c.ts" })
    const src = buildNodeMap(next).get("src")!
    expect(src.children?.map((n) => n.id)).toEqual(["a", "b", "c"])
  })

  it("inserts at a specific index when given one", () => {
    const next = insertNode(tree, "src", { id: "c", label: "c.ts" }, 0)
    const src = buildNodeMap(next).get("src")!
    expect(src.children?.map((n) => n.id)).toEqual(["c", "a", "b"])
  })

  it("appends at the root level when parentId is null", () => {
    const next = insertNode(tree, null, { id: "extra", label: "extra" })
    expect(next.map((n) => n.id)).toEqual(["root", "extra"])
  })

  it("does not mutate the input tree", () => {
    const before = getAllIds(tree)
    insertNode(tree, "src", { id: "c", label: "c.ts" })
    expect(getAllIds(tree)).toEqual(before)
  })
})

describe("removeNode", () => {
  it("removes a leaf", () => {
    const next = removeNode(tree, "a")
    expect(
      buildNodeMap(next)
        .get("src")
        ?.children?.map((n) => n.id)
    ).toEqual(["b"])
  })

  it("removes a folder and its whole subtree", () => {
    const next = removeNode(tree, "src")
    const ids = getAllIds(next)
    expect(ids).not.toContain("src")
    expect(ids).not.toContain("a")
    expect(ids).not.toContain("b")
    expect(ids).toContain("docs")
  })

  it("is a no-op for an unknown id and does not mutate the input", () => {
    const before = getAllIds(tree)
    const next = removeNode(tree, "ghost")
    expect(getAllIds(next)).toEqual(before)
    expect(getAllIds(tree)).toEqual(before)
  })
})

describe("updateNode", () => {
  it("merges a partial patch onto the matching node", () => {
    const next = updateNode(tree, "a", { label: "renamed.ts" })
    expect(buildNodeMap(next).get("a")?.label).toBe("renamed.ts")
    // Siblings untouched.
    expect(buildNodeMap(next).get("b")?.label).toBe("b.ts")
  })

  it("supports a mapper function", () => {
    const next = updateNode(tree, "src", (n) => ({ ...n, badge: "2" }))
    expect(buildNodeMap(next).get("src")?.badge).toBe("2")
  })

  it("does not mutate the input tree", () => {
    updateNode(tree, "a", { label: "renamed.ts" })
    expect(buildNodeMap(tree).get("a")?.label).toBe("a.ts")
  })
})

describe("moveNode", () => {
  it("moves a node inside a target folder", () => {
    const next = moveNode(tree, "a", { targetId: "docs", position: "inside" })
    const map = buildNodeMap(next)
    expect(map.get("docs")?.children?.map((n) => n.id)).toEqual(["readme", "a"])
    expect(map.get("src")?.children?.map((n) => n.id)).toEqual(["b"])
  })

  it("moves a node before a target (reordering among siblings)", () => {
    const next = moveNode(tree, "pkg", { targetId: "src", position: "before" })
    expect(
      buildNodeMap(next)
        .get("root")
        ?.children?.map((n) => n.id)
    ).toEqual(["pkg", "src", "docs"])
  })

  it("moves a node after a target", () => {
    const next = moveNode(tree, "a", { targetId: "b", position: "after" })
    expect(
      buildNodeMap(next)
        .get("src")
        ?.children?.map((n) => n.id)
    ).toEqual(["b", "a"])
  })

  it("returns the original array when the dragged id is missing", () => {
    expect(
      moveNode(tree, "ghost", { targetId: "src", position: "inside" })
    ).toBe(tree)
  })

  it("does not mutate the input tree", () => {
    const before = getAllIds(tree)
    moveNode(tree, "a", { targetId: "docs", position: "inside" })
    expect(getAllIds(tree)).toEqual(before)
    expect(
      buildNodeMap(tree)
        .get("src")
        ?.children?.map((n) => n.id)
    ).toEqual(["a", "b"])
  })
})
