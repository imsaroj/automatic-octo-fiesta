"use client"

import { useMemo, useState } from "react"
import {
  $addUpdateTag,
  $createParagraphNode,
  type LexicalEditor,
  SKIP_SELECTION_FOCUS_TAG,
} from "lexical"
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  TableCellHeaderStates,
} from "@lexical/table"
import { $insertNodeToNearestRoot } from "@lexical/utils"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { Image, Minus, Plus, SeparatorHorizontal, Table } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { INSERT_IMAGE_COMMAND } from "../../nodes/image-node"
import { INSERT_PAGE_BREAK_COMMAND } from "../../nodes/page-break-node"
import { DropdownItem, PortalDropdown } from "./primitives"
import type { ToolbarMenuControls } from "./constants"

type InsertMode = null | "image" | "table"

/** The "Insert" dropdown: horizontal rule, page break, table builder, image. */
export function InsertMenu({
  editor,
  menu,
}: {
  editor: LexicalEditor
  menu: ToolbarMenuControls
}) {
  const isOpen = menu.openMenu === "insert"
  const onClose = menu.closeMenu

  const [mode, setMode] = useState<InsertMode>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [tableRows, setTableRows] = useState("3")
  const [tableCols, setTableCols] = useState("3")

  // Reset the form when the menu closes. Adjusting state during render off a
  // previous-value snapshot avoids a setState-in-effect cascade.
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (!isOpen) {
      setMode(null)
      setImageUrl("")
      setImageAlt("")
    }
  }

  function insertImage() {
    if (!imageUrl.trim()) return
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: imageUrl.trim(),
      alt: imageAlt.trim() || "image",
    })
    onClose()
  }

  function insertTable() {
    const rows = Math.max(1, Math.min(20, parseInt(tableRows) || 3))
    const cols = Math.max(1, Math.min(20, parseInt(tableCols) || 3))
    editor.update(() => {
      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
      const tableNode = $createTableNode()
      for (let r = 0; r < rows; r++) {
        const rowNode = $createTableRowNode()
        for (let c = 0; c < cols; c++) {
          const cell = $createTableCellNode(
            r === 0
              ? TableCellHeaderStates.ROW
              : TableCellHeaderStates.NO_STATUS
          )
          cell.append($createParagraphNode())
          rowNode.append(cell)
        }
        tableNode.append(rowNode)
      }
      $insertNodeToNearestRoot(tableNode)
    })
    onClose()
  }

  const panelContent = useMemo(() => {
    if (mode === "image") {
      return (
        <div className="w-64 space-y-2 p-2.5">
          <p className="text-xs font-medium">Insert Image</p>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="h-6 w-full rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && insertImage()}
          />
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Alt text (optional)"
            className="h-6 w-full rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-1">
            <Button size="xs" onClick={insertImage}>
              Insert
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMode(null)}>
              ← Back
            </Button>
          </div>
        </div>
      )
    }

    if (mode === "table") {
      return (
        <div className="w-52 space-y-2 p-2.5">
          <p className="text-xs font-medium">Insert Table</p>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">Rows</span>
              <input
                type="number"
                value={tableRows}
                min="1"
                max="20"
                onChange={(e) => setTableRows(e.target.value)}
                className="h-6 w-14 rounded border border-border bg-background px-1.5 text-center text-xs outline-none"
              />
            </div>
            <span className="mt-4 text-muted-foreground">×</span>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">Columns</span>
              <input
                type="number"
                value={tableCols}
                min="1"
                max="20"
                onChange={(e) => setTableCols(e.target.value)}
                className="h-6 w-14 rounded border border-border bg-background px-1.5 text-center text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="xs" onClick={insertTable}>
              Insert
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMode(null)}>
              ← Back
            </Button>
          </div>
        </div>
      )
    }

    return (
      <>
        <DropdownItem
          label="Horizontal Rule"
          icon={<Minus />}
          onClick={() => {
            editor.update(() => {
              $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
              editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
            })
            onClose()
          }}
        />
        <DropdownItem
          label="Page Break"
          icon={<SeparatorHorizontal />}
          onClick={() => {
            editor.update(() => {
              $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
              editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined)
            })
            onClose()
          }}
        />
        <DropdownItem
          label="Table"
          icon={<Table />}
          description="→"
          onClick={() => setMode("table")}
        />
        <DropdownItem
          label="Image"
          icon={<Image />}
          description="→"
          onClick={() => setMode("image")}
        />
      </>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, imageUrl, imageAlt, tableRows, tableCols, editor])

  return (
    <PortalDropdown
      isOpen={isOpen}
      onToggle={() => menu.toggleMenu("insert")}
      onClose={onClose}
      label={
        <>
          <Plus className="size-3" />
          Insert
        </>
      }
    >
      {panelContent}
    </PortalDropdown>
  )
}
