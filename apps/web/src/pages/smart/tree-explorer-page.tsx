import { useCallback, useMemo, useRef, useState } from "react"
import {
  ChevronRightIcon,
  CheckSquareIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
  MousePointerClickIcon,
  Trash2Icon,
} from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@imsaroj/smart-ui/smart-components/smart-card"
import { SmartButton } from "@imsaroj/smart-ui/smart-components/smart-button"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import {
  SmartTree,
  type TreeNode,
  type SmartTreeHandle,
  buildNodeMap,
  buildParentMap,
  getAllFolderIds,
  getAncestorIds,
  getDescendantIds,
  insertNode,
  isFolderNode,
  removeNode,
  updateNode,
} from "@imsaroj/smart-ui/tree-engine"

// ── Seed data ────────────────────────────────────────────────────────────────

const initialTree: TreeNode[] = [
  {
    id: "workspace",
    label: "workspace",
    children: [
      {
        id: "workspace/src",
        label: "src",
        children: [
          { id: "workspace/src/index.ts", label: "index.ts" },
          { id: "workspace/src/app.tsx", label: "app.tsx" },
        ],
      },
      {
        id: "workspace/docs",
        label: "docs",
        children: [{ id: "workspace/docs/readme.md", label: "readme.md" }],
      },
      { id: "workspace/package.json", label: "package.json" },
    ],
  },
]

// ── Per-node action decoration ───────────────────────────────────────────────

/** What kind of node an "add" action creates. */
type NodeKind = "folder" | "file"

const actionBtn =
  "flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-background"

/**
 * Clone the tree, injecting hover-revealed add / remove actions onto every
 * node. Folders get "new folder" + "new file" buttons; every node gets a
 * trash button.
 */
function decorateNodes(
  nodes: TreeNode[],
  onAdd: (parentId: string, kind: NodeKind) => void,
  onRemove: (id: string) => void
): TreeNode[] {
  return nodes.map((node) => {
    const folder = isFolderNode(node)
    return {
      ...node,
      actions: (
        <div className="flex items-center gap-0.5">
          {folder && (
            <>
              <button
                type="button"
                title="New folder"
                aria-label={`Add a folder inside ${String(node.label)}`}
                onClick={() => onAdd(node.id, "folder")}
                className={cn(actionBtn, "hover:text-foreground")}
              >
                <FolderPlusIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="New file"
                aria-label={`Add a file inside ${String(node.label)}`}
                onClick={() => onAdd(node.id, "file")}
                className={cn(actionBtn, "hover:text-foreground")}
              >
                <FilePlusIcon className="size-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            title="Remove"
            aria-label={`Remove ${String(node.label)}`}
            onClick={() => onRemove(node.id)}
            className={cn(actionBtn, "hover:text-destructive")}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      ),
      children: node.children
        ? decorateNodes(node.children, onAdd, onRemove)
        : node.children,
    }
  })
}

// ── Live inspector panel ─────────────────────────────────────────────────────

const Chip = ({
  children,
  tone = "muted",
}: {
  children: React.ReactNode
  tone?: "muted" | "solid"
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.625rem] font-medium",
      tone === "solid"
        ? "border-transparent bg-secondary text-secondary-foreground"
        : "text-muted-foreground"
    )}
  >
    {children}
  </span>
)

const InspectorRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5">
    <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-medium">
      {children}
    </span>
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const TreeExplorerPage = () => {
  const [data, setData] = useState<TreeNode[]>(initialTree)
  const [selectedId, setSelectedId] = useState<string | null>("workspace")
  const [checked, setChecked] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>(() =>
    getAllFolderIds(initialTree)
  )

  const treeRef = useRef<SmartTreeHandle>(null)
  const nextId = useRef(1)

  const nodeMap = useMemo(() => buildNodeMap(data), [data])
  const parentMap = useMemo(() => buildParentMap(data), [data])

  // ── Mutations ──
  const addNode = useCallback((parentId: string | null, kind: NodeKind) => {
    const id = `node-${nextId.current++}`
    // Folders carry a (possibly empty) children array; files are leaves.
    const child: TreeNode =
      kind === "folder"
        ? { id, label: "New Folder", children: [] }
        : { id, label: "new-file.ts" }
    setData((prev) => insertNode(prev, parentId, child))
    if (parentId) {
      setExpanded((prev) =>
        prev.includes(parentId) ? prev : [...prev, parentId]
      )
    }
    setSelectedId(id)
    // Reveal the row, then drop straight into inline rename.
    requestAnimationFrame(() => treeRef.current?.startRename(id))
  }, [])

  const removeItem = useCallback(
    (id: string) => {
      const target = nodeMap.get(id)
      const removed = new Set<string>([
        id,
        ...(target ? getDescendantIds(target) : []),
      ])
      setData((prev) => removeNode(prev, id))
      setChecked((prev) => prev.filter((c) => !removed.has(c)))
      setSelectedId((prev) => (prev && removed.has(prev) ? null : prev))
    },
    [nodeMap]
  )

  const renameItem = useCallback((id: string, label: string) => {
    setData((prev) => updateNode(prev, id, { label }))
  }, [])

  const displayData = useMemo(
    // addNode only dereferences refs inside a requestAnimationFrame callback,
    // never during this render, and decorateNodes never calls it eagerly.
    // eslint-disable-next-line react-hooks/refs
    () => decorateNodes(data, addNode, removeItem),
    [data, addNode, removeItem]
  )

  // ── Derived inspector state ──
  const selectedNode = selectedId ? nodeMap.get(selectedId) : undefined
  const selectedFolder = selectedNode ? isFolderNode(selectedNode) : false

  const pathLabels = useMemo(() => {
    if (!selectedId || !selectedNode) return []
    const ancestors = getAncestorIds(selectedId, parentMap).reverse()
    return [...ancestors, selectedId].map((id) =>
      String(nodeMap.get(id)?.label ?? id)
    )
  }, [selectedId, selectedNode, parentMap, nodeMap])

  const checkedItems = useMemo(
    () =>
      checked
        .map((id) => ({ id, label: String(nodeMap.get(id)?.label ?? id) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [checked, nodeMap]
  )

  return (
    <SmartPage
      layout="detail"
      title="Tree Explorer"
      description="An editable SmartTree wired to a live inspector. Add folders or files, remove nodes, rename inline, and watch the panel track the active selection and checked items in real time."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        <SmartPageSection
          title="Interactive explorer"
          description="Click a row to inspect it. Hover a folder to add a subfolder or file inside it; hover any node to remove it. New nodes drop straight into rename mode — press Enter to commit."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* ── Tree ─────────────────────────────────────────────── */}
            <SmartCard
              header={{
                title: "File tree",
                subtitle: "Editable — add, rename, remove, check.",
              }}
              size="sm"
            >
              <div className="flex flex-wrap items-center gap-2 border-b p-2">
                <SmartButton size="sm" onClick={() => addNode(null, "folder")}>
                  <FolderPlusIcon className="size-4" />
                  Add folder
                </SmartButton>
                <SmartButton
                  size="sm"
                  variant="secondary"
                  onClick={() => addNode(null, "file")}
                >
                  <FilePlusIcon className="size-4" />
                  Add file
                </SmartButton>
                <SmartButton
                  size="sm"
                  variant="outline"
                  onClick={() => treeRef.current?.expandAll()}
                >
                  Expand all
                </SmartButton>
                <SmartButton
                  size="sm"
                  variant="outline"
                  onClick={() => treeRef.current?.collapseAll()}
                >
                  Collapse all
                </SmartButton>
                {checked.length > 0 && (
                  <SmartButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setChecked([])}
                  >
                    Clear {checked.length} checked
                  </SmartButton>
                )}
              </div>

              <div className="min-h-64 p-2">
                <SmartTree
                  ref={treeRef}
                  data={displayData}
                  checkable
                  showLines
                  renamable
                  selectionMode="single"
                  expandedIds={expanded}
                  onExpandedChange={setExpanded}
                  selectedIds={selectedId ? [selectedId] : []}
                  onSelectedChange={(ids) => setSelectedId(ids[0] ?? null)}
                  checkedIds={checked}
                  onCheckedChange={setChecked}
                  onRename={(node, next) => renameItem(node.id, next)}
                  emptyState="No nodes yet — use “Add folder” or “Add file”."
                  aria-label="Editable file tree"
                />
              </div>
            </SmartCard>

            {/* ── Live inspector ───────────────────────────────────── */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <SmartCard
                header={{
                  title: "Inspector",
                  subtitle: "Live view of the active node.",
                }}
                size="sm"
              >
                <div className="space-y-4 p-3">
                  {/* Counts */}
                  <div className="flex flex-wrap gap-2">
                    <Chip>
                      <MousePointerClickIcon className="size-2.5" />
                      {selectedNode ? "1 selected" : "none selected"}
                    </Chip>
                    <Chip>
                      <CheckSquareIcon className="size-2.5" />
                      {checked.length} checked
                    </Chip>
                  </div>

                  {/* Active node */}
                  {selectedNode ? (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {String(selectedNode.label)}
                        </span>
                        <Chip tone="solid">
                          {selectedFolder ? (
                            <FolderIcon className="size-2.5" />
                          ) : (
                            <FileIcon className="size-2.5" />
                          )}
                          {selectedFolder ? "Folder" : "File"}
                        </Chip>
                      </div>
                      {pathLabels.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {pathLabels.map((label, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <ChevronRightIcon className="size-3 opacity-60" />
                              )}
                              <span
                                className={cn(
                                  i === pathLabels.length - 1 &&
                                    "font-medium text-foreground"
                                )}
                              >
                                {label}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="divide-y">
                        <InspectorRow label="ID">
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {selectedNode.id}
                          </code>
                        </InspectorRow>
                        {selectedFolder && (
                          <>
                            <InspectorRow label="Direct children">
                              {selectedNode.children?.length ?? 0}
                            </InspectorRow>
                            <InspectorRow label="Descendants">
                              {getDescendantIds(selectedNode).length}
                            </InspectorRow>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Click a node to inspect it.
                    </p>
                  )}

                  {/* Checked list */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Checked items
                    </p>
                    {checkedItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nothing checked.
                      </p>
                    ) : (
                      <ul className="max-h-48 space-y-1 overflow-auto">
                        {checkedItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1 text-sm"
                          >
                            <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </SmartCard>
            </div>
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default TreeExplorerPage
