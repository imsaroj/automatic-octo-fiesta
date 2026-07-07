import { useRef, useState } from "react"
import {
  FileCodeIcon,
  FileJsonIcon,
  FileTextIcon,
  FolderGitIcon,
  ImageIcon,
  MoreHorizontalIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"
import { SmartButton } from "@workspace/ui/smart-components/smart-button"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"
import {
  SmartTree,
  type TreeNode,
  type SmartTreeHandle,
  getAllFolderIds,
} from "@workspace/ui/tree-engine"

// ── Sample data ──────────────────────────────────────────────────────────

const fileTree: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/button.tsx", label: "button.tsx" },
          { id: "src/components/card.tsx", label: "card.tsx" },
          { id: "src/components/dialog.tsx", label: "dialog.tsx" },
        ],
      },
      {
        id: "src/lib",
        label: "lib",
        children: [
          { id: "src/lib/utils.ts", label: "utils.ts" },
          { id: "src/lib/format.ts", label: "format.ts" },
        ],
      },
      { id: "src/app.tsx", label: "app.tsx" },
      { id: "src/main.tsx", label: "main.tsx" },
    ],
  },
  {
    id: "public",
    label: "public",
    children: [
      { id: "public/logo.svg", label: "logo.svg" },
      { id: "public/favicon.ico", label: "favicon.ico" },
    ],
  },
  { id: "package.json", label: "package.json" },
  { id: "readme.md", label: "README.md" },
]

const orgTree: TreeNode[] = [
  {
    id: "eng",
    label: "Engineering",
    children: [
      {
        id: "eng/frontend",
        label: "Frontend",
        children: [
          { id: "eng/fe/ada", label: "Ada Lovelace" },
          { id: "eng/fe/grace", label: "Grace Hopper" },
          { id: "eng/fe/linus", label: "Linus Torvalds" },
        ],
      },
      {
        id: "eng/backend",
        label: "Backend",
        children: [
          { id: "eng/be/ken", label: "Ken Thompson" },
          { id: "eng/be/dennis", label: "Dennis Ritchie", disabled: true },
        ],
      },
    ],
  },
  {
    id: "design",
    label: "Design",
    children: [
      { id: "design/dieter", label: "Dieter Rams" },
      { id: "design/paula", label: "Paula Scher" },
    ],
  },
]

// Icons keyed by file extension for the custom-icon demo.
const iconFor = (node: TreeNode) => {
  const label = String(node.label)
  if (label.endsWith(".tsx") || label.endsWith(".ts"))
    return <FileCodeIcon className="size-4 text-sky-500" />
  if (label.endsWith(".json"))
    return <FileJsonIcon className="size-4 text-amber-500" />
  if (label.endsWith(".svg") || label.endsWith(".ico"))
    return <ImageIcon className="size-4 text-violet-500" />
  if (label.endsWith(".md"))
    return <FileTextIcon className="size-4 text-muted-foreground" />
  return <FolderGitIcon className="size-4 text-orange-500" />
}

const TreePage = () => {
  const [search, setSearch] = useState("")
  const [filterSearch, setFilterSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [checked, setChecked] = useState<string[]>([])
  const [dndData, setDndData] = useState<TreeNode[]>(fileTree)
  const [renameData, setRenameData] = useState<TreeNode[]>(fileTree)

  const controlRef = useRef<SmartTreeHandle>(null)

  // Inline rename mutates a copy of the tree in place.
  const applyRename = (id: string, nextLabel: string) => {
    const rename = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, label: nextLabel }
          : n.children
            ? { ...n, children: rename(n.children) }
            : n
      )
    setRenameData((prev) => rename(prev))
  }

  return (
    <SmartPage
      layout="detail"
      title="Tree Engine"
      description="SmartTree — a declarative tree built on Base UI patterns: selection, cascading checkboxes, search, rename, drag-and-drop, and full keyboard navigation."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Basics ──────────────────────────────────────────────── */}
        <SmartPageSection
          title="Basic tree"
          description="Single-select, click a caret or row to expand. Try arrow keys, Home/End, and Enter once a row is focused."
          divider
        >
          <div className="flex flex-wrap gap-6">
            <SmartCard header={{ title: "Default" }} size="sm">
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  defaultExpandedIds={["src", "src/components"]}
                  aria-label="Project files"
                />
              </div>
            </SmartCard>

            <SmartCard
              header={{
                title: "Guide lines",
                subtitle: "showLines connects nested rows.",
              }}
              size="sm"
            >
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  defaultExpandAll
                  showLines
                  aria-label="Project files with guide lines"
                />
              </div>
            </SmartCard>

            <SmartCard
              header={{
                title: "Right-aligned caret",
                subtitle: "caretSide + expandOnLabelClick.",
              }}
              size="sm"
            >
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  caretSide="right"
                  expandOnLabelClick
                  showLines
                  defaultExpandedIds={["src"]}
                  aria-label="Project files, right caret"
                />
              </div>
            </SmartCard>
          </div>
        </SmartPageSection>

        {/* ── Icons ───────────────────────────────────────────────── */}
        <SmartPageSection
          title="Custom icons"
          description="getIcon resolves a per-node icon (here by file extension). node.icon overrides everything."
          divider
        >
          <SmartCard size="sm">
            <div className="w-80 p-2">
              <SmartTree
                data={fileTree}
                defaultExpandAll
                showLines
                getIcon={iconFor}
                aria-label="Files with typed icons"
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Selection ───────────────────────────────────────────── */}
        <SmartPageSection
          title="Multiple selection"
          description="selectionMode='multiple' — Ctrl/⌘-click to toggle, Shift-click for a range, Ctrl/⌘+A to select all."
          divider
        >
          <SmartCard size="sm">
            <div className="w-80 p-2">
              <SmartTree
                data={orgTree}
                selectionMode="multiple"
                defaultExpandAll
                showLines
                getIcon={(n) =>
                  n.children ? (
                    <UsersIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <UserIcon className="size-4 text-muted-foreground" />
                  )
                }
                selectedIds={selected}
                onSelectedChange={setSelected}
                aria-label="Org chart"
              />
            </div>
            {selected.length > 0 && (
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">
                  {selected.length}
                </span>{" "}
                node{selected.length === 1 ? "" : "s"}
              </p>
            )}
          </SmartCard>
        </SmartPageSection>

        {/* ── Checkboxes ──────────────────────────────────────────── */}
        <SmartPageSection
          title="Checkboxes (cascading tri-state)"
          description="Checking a folder checks its subtree; partial subtrees show an indeterminate state. Compare left vs right placement and folder-checking."
          divider
        >
          <div className="flex flex-wrap gap-6">
            <SmartCard header={{ title: "Left checkboxes" }} size="sm">
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  checkable
                  defaultExpandAll
                  showLines
                  checkedIds={checked}
                  onCheckedChange={setChecked}
                  aria-label="Files with left checkboxes"
                />
              </div>
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                {checked.length} leaf file{checked.length === 1 ? "" : "s"}{" "}
                checked
              </p>
            </SmartCard>

            <SmartCard
              header={{
                title: "Right checkboxes",
                subtitle: "checkboxSide='right'.",
              }}
              size="sm"
            >
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  checkable
                  checkboxSide="right"
                  defaultExpandAll
                  showLines
                  aria-label="Files with right checkboxes"
                />
              </div>
            </SmartCard>

            <SmartCard
              header={{
                title: "canCheckFolders",
                subtitle: "Folder ids are stored too.",
              }}
              size="sm"
            >
              <div className="w-72 p-2">
                <SmartTree
                  data={fileTree}
                  checkable
                  canCheckFolders
                  defaultExpandAll
                  showLines
                  aria-label="Files, folders checkable"
                />
              </div>
            </SmartCard>
          </div>
        </SmartPageSection>

        {/* ── Search ──────────────────────────────────────────────── */}
        <SmartPageSection
          title="Search — highlight vs filter"
          description="The same query, two modes. Highlight marks matches in place; filter hides non-matching branches (ancestors of a hit stay visible)."
          divider
        >
          <div className="flex flex-wrap gap-6">
            <SmartCard header={{ title: "Highlight matches" }} size="sm">
              <div className="w-72 space-y-2 p-2">
                <SmartSearchInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search files…"
                />
                <SmartTree
                  data={fileTree}
                  defaultExpandAll
                  showLines
                  searchQuery={search}
                  filterMode="highlight"
                  aria-label="Searchable files (highlight)"
                />
              </div>
            </SmartCard>

            <SmartCard header={{ title: "Filter matches" }} size="sm">
              <div className="w-72 space-y-2 p-2">
                <SmartSearchInput
                  value={filterSearch}
                  onValueChange={setFilterSearch}
                  placeholder="Filter files…"
                />
                <SmartTree
                  data={fileTree}
                  showLines
                  searchQuery={filterSearch}
                  filterMode="filter"
                  emptyState="No files match."
                  aria-label="Searchable files (filter)"
                />
              </div>
            </SmartCard>
          </div>
        </SmartPageSection>

        {/* ── Imperative control ──────────────────────────────────── */}
        <SmartPageSection
          title="Expand / collapse all (imperative handle)"
          description="Drive the tree through a ref: expandAll, collapseAll, selectAll, and clearSelection."
          divider
        >
          <SmartCard size="sm">
            <div className="flex flex-wrap gap-2 p-2">
              <SmartButton
                size="sm"
                variant="outline"
                onClick={() => controlRef.current?.expandAll()}
              >
                Expand all
              </SmartButton>
              <SmartButton
                size="sm"
                variant="outline"
                onClick={() => controlRef.current?.collapseAll()}
              >
                Collapse all
              </SmartButton>
              <SmartButton
                size="sm"
                variant="outline"
                onClick={() => controlRef.current?.selectAll()}
              >
                Select all
              </SmartButton>
              <SmartButton
                size="sm"
                variant="ghost"
                onClick={() => controlRef.current?.clearSelection()}
              >
                Clear
              </SmartButton>
            </div>
            <div className="w-80 p-2">
              <SmartTree
                ref={controlRef}
                data={fileTree}
                selectionMode="multiple"
                showLines
                getIcon={iconFor}
                defaultExpandedIds={getAllFolderIds(fileTree)}
                aria-label="Imperatively controlled tree"
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Rename ──────────────────────────────────────────────── */}
        <SmartPageSection
          title="Inline rename"
          description="Double-click a row (or focus it and press F2) to edit. Enter commits, Escape cancels."
          divider
        >
          <SmartCard size="sm">
            <div className="w-80 p-2">
              <SmartTree
                data={renameData}
                renamable
                defaultExpandAll
                getIcon={iconFor}
                onRename={(node, next) => applyRename(node.id, next)}
                aria-label="Renamable files"
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Drag & drop ─────────────────────────────────────────── */}
        <SmartPageSection
          title="Drag & drop reordering"
          description="Drag rows to reorder. Drop near a folder's middle to nest inside; near the top/bottom edge to place before/after. Rows also expose hover actions."
          divider
        >
          <SmartCard size="sm">
            <div className="w-80 p-2">
              <SmartTree
                data={dndData}
                draggable
                defaultExpandAll
                showLines
                getIcon={iconFor}
                onMove={(_node, _target, nextData) => setDndData(nextData)}
                renderLabel={undefined}
                aria-label="Reorderable files"
                emptyState="Empty."
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Rich rows ───────────────────────────────────────────── */}
        <SmartPageSection
          title="Badges & row actions"
          description="Nodes can carry a badge and hover-revealed actions via node.badge / node.actions."
          divider
        >
          <SmartCard size="sm">
            <div className="w-80 p-2">
              <SmartTree
                data={[
                  {
                    id: "inbox",
                    label: "Inbox",
                    badge: "12",
                    children: [
                      {
                        id: "inbox/work",
                        label: "Work",
                        badge: "8",
                        actions: (
                          <MoreHorizontalIcon className="size-4 text-muted-foreground" />
                        ),
                      },
                      { id: "inbox/personal", label: "Personal", badge: "4" },
                    ],
                  },
                  { id: "sent", label: "Sent" },
                  { id: "archive", label: "Archive", badge: "204" },
                ]}
                defaultExpandAll
                showLines
                aria-label="Mailboxes"
              />
            </div>
          </SmartCard>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default TreePage
