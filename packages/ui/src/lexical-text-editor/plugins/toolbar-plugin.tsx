"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  type NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_SELECTION_FOCUS_TAG,
  type TextFormatType,
  UNDO_COMMAND,
} from "lexical"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from "@lexical/list"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import {
  $createCodeNode,
  $isCodeNode,
  getCodeLanguageOptions,
} from "@lexical/code"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection"
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  TableCellHeaderStates,
} from "@lexical/table"
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $insertNodeToNearestRoot,
  mergeRegister,
} from "@lexical/utils"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Check,
  ChevronDown,
  Code,
  Eraser,
  Highlighter,
  Image,
  Indent,
  Italic,
  Link2,
  Link2Off,
  Minus,
  Outdent,
  PaintBucket,
  Plus,
  Redo2,
  SeparatorHorizontal,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import { $createImageNode, INSERT_IMAGE_COMMAND } from "../nodes/image-node"
import {
  $createPageBreakNode,
  INSERT_PAGE_BREAK_COMMAND,
} from "../nodes/page-break-node"

// ─── Types & constants ────────────────────────────────────────────────────────

type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code"

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  bullet: "Bullet List",
  number: "Numbered List",
  check: "Checklist",
  quote: "Quote",
  code: "Code Block",
}

const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 96
const DEFAULT_FONT_SIZE = 14

const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
]

const TEXT_COLORS: Array<{ label: string; value: string }> = [
  { label: "Default", value: "" },
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
]

const HIGHLIGHT_COLORS: Array<{ label: string; value: string }> = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Gray", value: "#e5e7eb" },
]

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

const ALL_TEXT_FORMATS: TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "superscript",
  "subscript",
  "highlight",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  return anchor === focus ? anchor : selection.isBackward() ? focus : anchor
}

// Smart font-size stepping — bigger sizes step by bigger amounts.
// Matches the Lexical playground's calculateNextFontSize.
function calculateNextFontSize(current: number, delta: 1 | -1): number {
  if (delta === -1) {
    if (current > MAX_FONT_SIZE) return MAX_FONT_SIZE
    if (current >= 48) return current - 12
    if (current >= 24) return current - 4
    if (current >= 14) return current - 2
    if (current >= 9) return current - 1
    return MIN_FONT_SIZE
  }
  if (current < MIN_FONT_SIZE) return MIN_FONT_SIZE
  if (current < 12) return current + 1
  if (current < 20) return current + 2
  if (current < 36) return current + 4
  if (current <= 60) return current + 12
  return MAX_FONT_SIZE
}

// ─── PortalDropdown ───────────────────────────────────────────────────────────
// Renders the panel into document.body — same pattern as the Lexical playground
// DropDown. Because the panel lives outside the editor DOM, clicking items
// does not steal the editor's DOM focus.

const DROPDOWN_PADDING = 4

interface PortalDropdownProps {
  label: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  children: React.ReactNode
  panelClassName?: string
  disabled?: boolean
  title?: string
  chevron?: boolean
}

function PortalDropdown({
  label,
  isOpen,
  onToggle,
  onClose,
  children,
  panelClassName,
  disabled,
  title,
  chevron = true,
}: PortalDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !panelRef.current) return
    const { top, left, height } = triggerRef.current.getBoundingClientRect()
    panelRef.current.style.top = `${top + height + DROPDOWN_PADDING}px`
    panelRef.current.style.left = `${Math.min(left, window.innerWidth - panelRef.current.offsetWidth - 8)}px`
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const close = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [isOpen, onClose])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={onToggle}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded border border-border bg-background",
          "px-1.5 text-xs font-medium transition-colors outline-none",
          "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          isOpen && "bg-muted"
        )}
      >
        {label}
        {chevron && (
          <ChevronDown className="size-2.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            className={cn(
              "fixed z-[9999] min-w-[9rem] rounded-md border border-border",
              "bg-popover py-1 shadow-lg",
              panelClassName
            )}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

function DropdownItem({
  label,
  icon,
  active,
  onClick,
  description,
  className,
  style,
}: {
  label: string
  icon?: React.ReactNode
  active?: boolean
  onClick: () => void
  description?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      style={style}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs",
        "transition-colors hover:bg-muted",
        active && "bg-muted font-medium",
        className
      )}
    >
      {icon && (
        <span className="size-3.5 shrink-0 text-muted-foreground">{icon}</span>
      )}
      <span className="flex-1">{label}</span>
      {description && (
        <span className="text-[10px] text-muted-foreground">{description}</span>
      )}
    </button>
  )
}

// ─── Toolbar primitives ───────────────────────────────────────────────────────

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={className}
    >
      {children}
    </Button>
  )
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-0.5 h-4 self-center" />
}

// ─── Color palette dropdown ───────────────────────────────────────────────────

function ColorPaletteDropdown({
  editor,
  colors,
  styleProperty,
  icon,
  title,
  isOpen,
  onToggle,
  onClose,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  colors: Array<{ label: string; value: string }>
  styleProperty: string
  icon: React.ReactNode
  title: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const apply = (value: string) => {
    editor.update(() => {
      const sel = $getSelection()
      if (sel !== null) {
        $patchStyleText(sel, { [styleProperty]: value || null })
      }
    })
    onClose()
  }

  return (
    <PortalDropdown
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
      title={title}
      chevron={false}
      panelClassName="w-40 p-2"
      label={icon}
    >
      <div className="grid grid-cols-6 gap-1">
        {colors.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.label}
            aria-label={c.label}
            onClick={() => apply(c.value)}
            className={cn(
              "size-5 rounded border border-border transition-transform hover:scale-110",
              !c.value &&
                "bg-background bg-[linear-gradient(to_top_left,transparent_46%,var(--destructive)_48%,var(--destructive)_52%,transparent_54%)]"
            )}
            style={c.value ? { backgroundColor: c.value } : undefined}
          />
        ))}
      </div>
    </PortalDropdown>
  )
}

// ─── Font family control ──────────────────────────────────────────────────────

function FontFamilyControl({
  editor,
  value,
  isOpen,
  onToggle,
  onClose,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  value: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const current =
    FONT_FAMILIES.find((f) => f.value === value) ?? FONT_FAMILIES[0]

  const apply = (family: string) => {
    editor.update(() => {
      const sel = $getSelection()
      if (sel !== null) {
        $patchStyleText(sel, { "font-family": family || null })
      }
    })
    onClose()
  }

  return (
    <PortalDropdown
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
      title="Font family"
      panelClassName="w-44"
      label={
        <span className="flex items-center gap-1">
          <Type className="size-3" />
          <span className="max-w-[5rem] truncate">{current.label}</span>
        </span>
      }
    >
      {FONT_FAMILIES.map((f) => (
        <DropdownItem
          key={f.label}
          label={f.label}
          active={f.value === value || (!f.value && !value)}
          onClick={() => apply(f.value)}
          style={f.value ? { fontFamily: f.value } : undefined}
        />
      ))}
    </PortalDropdown>
  )
}

// ─── Font size control (stepper + dropdown) ───────────────────────────────────

const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72,
  96,
]

function FontSizeControl({
  editor,
  value,
  isOpen,
  onToggle,
  onClose,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  value: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const px = parseInt(value) || DEFAULT_FONT_SIZE

  const apply = (newPx: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newPx))
    editor.update(() => {
      const sel = $getSelection()
      if (sel !== null) $patchStyleText(sel, { "font-size": `${clamped}px` })
    })
  }

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        title="Decrease font size"
        disabled={px <= MIN_FONT_SIZE}
        onClick={() => apply(calculateNextFontSize(px, -1))}
      >
        <Minus />
      </ToolbarButton>

      <PortalDropdown
        isOpen={isOpen}
        onToggle={onToggle}
        onClose={onClose}
        title="Font size"
        chevron={false}
        panelClassName="w-20 max-h-64 overflow-y-auto"
        label={<span className="w-5 text-center tabular-nums">{px}</span>}
      >
        {FONT_SIZES.map((sz) => (
          <DropdownItem
            key={sz}
            label={String(sz)}
            active={px === sz}
            onClick={() => {
              apply(sz)
              onClose()
            }}
          />
        ))}
      </PortalDropdown>

      <ToolbarButton
        title="Increase font size"
        disabled={px >= MAX_FONT_SIZE}
        onClick={() => apply(calculateNextFontSize(px, 1))}
      >
        <Plus />
      </ToolbarButton>
    </div>
  )
}

// ─── Code language control ────────────────────────────────────────────────────

function CodeLanguageControl({
  editor,
  language,
  elementKey,
  isOpen,
  onToggle,
  onClose,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  language: string
  elementKey: NodeKey | null
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const friendly =
    CODE_LANGUAGE_OPTIONS.find(([v]) => v === language)?.[1] ?? "Plain Text"

  const apply = (lang: string) => {
    if (elementKey === null) return
    editor.update(() => {
      const node = $getNodeByKey(elementKey)
      if ($isCodeNode(node)) node.setLanguage(lang)
    })
    onClose()
  }

  return (
    <PortalDropdown
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
      title="Code language"
      panelClassName="w-44 max-h-72 overflow-y-auto"
      label={<span className="max-w-[6rem] truncate">{friendly}</span>}
    >
      {CODE_LANGUAGE_OPTIONS.map(([lang, name]) => (
        <DropdownItem
          key={lang}
          label={name}
          active={lang === language}
          onClick={() => apply(lang)}
        />
      ))}
    </PortalDropdown>
  )
}

// ─── Insert menu ──────────────────────────────────────────────────────────────

type InsertMode = null | "image" | "table"

function InsertMenu({
  editor,
  isOpen,
  onToggle,
  onClose,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<InsertMode>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [tableRows, setTableRows] = useState("3")
  const [tableCols, setTableCols] = useState("3")

  useEffect(() => {
    if (!isOpen) {
      setMode(null)
      setImageUrl("")
      setImageAlt("")
    }
  }, [isOpen])

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
      onToggle={onToggle}
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

// ─── ToolbarPlugin ─────────────────────────────────────────────────────────────

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>("paragraph")
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null
  )
  const [codeLanguage, setCodeLanguage] = useState("")
  const [fontSize, setFontSize] = useState("")
  const [fontFamily, setFontFamily] = useState("")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left")
  const [isLink, setIsLink] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const toggleMenu = (name: string) =>
    setOpenMenu((prev) => (prev === name ? null : name))
  const closeMenu = useCallback(() => setOpenMenu(null), [])

  // ── Register INSERT commands ──────────────────────────────────────────────
  // Co-located with the Insert menu. Uses $insertNodeToNearestRoot (not
  // $insertNodes) so block-level decorators land at the root — same as the
  // Lexical playground.

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        ({ src, alt, maxWidth }) => {
          const node = $createImageNode({ src, alt, maxWidth })
          $insertNodeToNearestRoot(node)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        INSERT_PAGE_BREAK_COMMAND,
        () => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return false
          const node = $createPageBreakNode()
          $insertNodeToNearestRoot(node)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    )
  }, [editor])

  // ── Toolbar state sync ────────────────────────────────────────────────────

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setIsBold(selection.hasFormat("bold"))
    setIsItalic(selection.hasFormat("italic"))
    setIsUnderline(selection.hasFormat("underline"))
    setIsStrikethrough(selection.hasFormat("strikethrough"))
    setIsCode(selection.hasFormat("code"))
    setIsSuperscript(selection.hasFormat("superscript"))
    setIsSubscript(selection.hasFormat("subscript"))
    setIsHighlight(selection.hasFormat("highlight"))
    setFontSize($getSelectionStyleValueForProperty(selection, "font-size", ""))
    setFontFamily(
      $getSelectionStyleValueForProperty(selection, "font-family", "")
    )

    const node = getSelectedNode(selection)
    if (node) {
      const parent = node.getParent()
      setIsLink($isLinkNode(parent) || $isLinkNode(node))
    }

    const anchorNode = selection.anchor.getNode()
    let element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const p = e.getParent()
            return p !== null && $isRootOrShadowRoot(p)
          })
    if (element === null) element = anchorNode.getTopLevelElementOrThrow()

    setSelectedElementKey(element.getKey())

    if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
      const listType = parentList
        ? parentList.getListType()
        : element.getListType()
      setBlockType(
        listType === "bullet"
          ? "bullet"
          : listType === "check"
            ? "check"
            : "number"
      )
    } else if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as BlockType)
    } else {
      setBlockType(element.getType() as BlockType)
      if ($isCodeNode(element)) {
        setCodeLanguage(element.getLanguage() || "")
      }
    }

    const anchorParent = selection.anchor.getNode().getParent()
    setElementFormat(anchorParent?.getFormatType?.() ?? "left")
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (p) => {
          setCanUndo(p)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (p) => {
          setCanRedo(p)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => $updateToolbar())
      })
    )
  }, [editor, $updateToolbar])

  useEffect(() => {
    if (showLinkInput) linkInputRef.current?.focus()
  }, [showLinkInput])

  // ── Block type ────────────────────────────────────────────────────────────
  // SKIP_SELECTION_FOCUS_TAG stops Lexical restoring DOM focus mid-change —
  // matches the playground's formatHeading / formatParagraph pattern.

  function applyBlockType(type: BlockType) {
    closeMenu()
    if (type === "bullet") {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      })
      return
    }
    if (type === "number") {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      })
      return
    }
    if (type === "check") {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      })
      return
    }
    editor.update(() => {
      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
      const selection = $getSelection()
      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode())
      } else if (
        type === "h1" ||
        type === "h2" ||
        type === "h3" ||
        type === "h4" ||
        type === "h5" ||
        type === "h6"
      ) {
        $setBlocksType(selection, () =>
          $createHeadingNode(type as HeadingTagType)
        )
      } else if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode())
      } else if (type === "code") {
        $setBlocksType(selection, () => $createCodeNode())
      }
    })
  }

  // ── Clear formatting ──────────────────────────────────────────────────────

  function clearFormatting() {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      ALL_TEXT_FORMATS.forEach((fmt) => {
        if (selection.hasFormat(fmt)) selection.formatText(fmt)
      })
      $patchStyleText(selection, {
        "font-size": null,
        "font-family": null,
        color: null,
        "background-color": null,
      })
    })
  }

  // ── Link ──────────────────────────────────────────────────────────────────

  function submitLink() {
    const url = linkUrl.trim()
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    setShowLinkInput(false)
    setLinkUrl("")
  }

  const isCodeBlock = blockType === "code"

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* History */}
      <ToolbarButton
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        title="Redo (Ctrl+Y)"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo2 />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Block type */}
      <PortalDropdown
        isOpen={openMenu === "blockType"}
        onToggle={() => toggleMenu("blockType")}
        onClose={closeMenu}
        title="Block type"
        label={
          <span className="max-w-[6.5rem] truncate">
            {BLOCK_TYPE_LABELS[blockType] ?? "Normal"}
          </span>
        }
      >
        {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => (
          <DropdownItem
            key={type}
            label={BLOCK_TYPE_LABELS[type]}
            active={blockType === type}
            onClick={() => applyBlockType(type)}
          />
        ))}
      </PortalDropdown>

      {/* Code block → language picker replaces text-style controls */}
      {isCodeBlock ? (
        <>
          <ToolbarSeparator />
          <CodeLanguageControl
            editor={editor}
            language={codeLanguage}
            elementKey={selectedElementKey}
            isOpen={openMenu === "codeLanguage"}
            onToggle={() => toggleMenu("codeLanguage")}
            onClose={closeMenu}
          />
        </>
      ) : (
        <>
          <ToolbarSeparator />

          {/* Font family + size */}
          <FontFamilyControl
            editor={editor}
            value={fontFamily}
            isOpen={openMenu === "fontFamily"}
            onToggle={() => toggleMenu("fontFamily")}
            onClose={closeMenu}
          />
          <FontSizeControl
            editor={editor}
            value={fontSize}
            isOpen={openMenu === "fontSize"}
            onToggle={() => toggleMenu("fontSize")}
            onClose={closeMenu}
          />

          <ToolbarSeparator />

          {/* Text format */}
          <ToolbarButton
            active={isBold}
            title="Bold (Ctrl+B)"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          >
            <Bold />
          </ToolbarButton>
          <ToolbarButton
            active={isItalic}
            title="Italic (Ctrl+I)"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
          >
            <Italic />
          </ToolbarButton>
          <ToolbarButton
            active={isUnderline}
            title="Underline (Ctrl+U)"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }
          >
            <Underline />
          </ToolbarButton>
          <ToolbarButton
            active={isStrikethrough}
            title="Strikethrough"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
          >
            <Strikethrough />
          </ToolbarButton>
          <ToolbarButton
            active={isSuperscript}
            title="Superscript"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
            }
          >
            <Superscript />
          </ToolbarButton>
          <ToolbarButton
            active={isSubscript}
            title="Subscript"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
            }
          >
            <Subscript />
          </ToolbarButton>
          <ToolbarButton
            active={isHighlight}
            title="Highlight"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "highlight")
            }
          >
            <Highlighter />
          </ToolbarButton>
          <ToolbarButton
            active={isCode}
            title="Inline code"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
          >
            <Code />
          </ToolbarButton>

          {/* Colors */}
          <ColorPaletteDropdown
            editor={editor}
            colors={TEXT_COLORS}
            styleProperty="color"
            icon={<Baseline className="size-3" />}
            title="Text color"
            isOpen={openMenu === "textColor"}
            onToggle={() => toggleMenu("textColor")}
            onClose={closeMenu}
          />
          <ColorPaletteDropdown
            editor={editor}
            colors={HIGHLIGHT_COLORS}
            styleProperty="background-color"
            icon={<PaintBucket className="size-3" />}
            title="Highlight color"
            isOpen={openMenu === "bgColor"}
            onToggle={() => toggleMenu("bgColor")}
            onClose={closeMenu}
          />
        </>
      )}

      <ToolbarSeparator />

      {/* Utilities */}
      <ToolbarButton title="Clear formatting" onClick={clearFormatting}>
        <Eraser />
      </ToolbarButton>
      <ToolbarButton
        title="Outdent"
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
      >
        <Outdent />
      </ToolbarButton>
      <ToolbarButton
        title="Indent"
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
      >
        <Indent />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Insert */}
      <InsertMenu
        editor={editor}
        isOpen={openMenu === "insert"}
        onToggle={() => toggleMenu("insert")}
        onClose={closeMenu}
      />

      <ToolbarSeparator />

      {/* Alignment */}
      <ToolbarButton
        active={!elementFormat || elementFormat === "left"}
        title="Align left"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
      >
        <AlignLeft />
      </ToolbarButton>
      <ToolbarButton
        active={elementFormat === "center"}
        title="Align center"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
      >
        <AlignCenter />
      </ToolbarButton>
      <ToolbarButton
        active={elementFormat === "right"}
        title="Align right"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
      >
        <AlignRight />
      </ToolbarButton>
      <ToolbarButton
        active={elementFormat === "justify"}
        title="Justify"
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
        }
      >
        <AlignJustify />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Link */}
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="h-6 w-44 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submitLink()
              }
              if (e.key === "Escape") {
                setShowLinkInput(false)
                setLinkUrl("")
              }
            }}
          />
          <ToolbarButton title="Apply link" onClick={submitLink}>
            <Check />
          </ToolbarButton>
          <ToolbarButton
            title="Cancel"
            onClick={() => {
              setShowLinkInput(false)
              setLinkUrl("")
            }}
          >
            <X />
          </ToolbarButton>
        </div>
      ) : (
        <ToolbarButton
          active={isLink}
          title={isLink ? "Remove link" : "Insert link"}
          onClick={() => {
            if (isLink) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
            else {
              setLinkUrl("")
              setShowLinkInput(true)
            }
          }}
        >
          {isLink ? <Link2Off /> : <Link2 />}
        </ToolbarButton>
      )}
    </div>
  )
}
