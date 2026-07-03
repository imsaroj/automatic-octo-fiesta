"use client"

import * as React from "react"
import {
  $getSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  type TextFormatType,
} from "lexical"
import { $patchStyleText } from "@lexical/selection"
import { cn } from "@workspace/ui/lib/utils"
import {
  Baseline,
  Bold,
  Code,
  Highlighter,
  Italic,
  Minus,
  PaintBucket,
  Plus,
  Strikethrough,
  Subscript,
  Superscript,
  Type,
  Underline,
} from "lucide-react"
import {
  DropdownItem,
  PortalDropdown,
  ToolbarButton,
  ToolbarSeparator,
} from "./primitives"
import {
  DEFAULT_FONT_SIZE,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  TEXT_COLORS,
  type ToolbarMenuControls,
} from "./constants"
import type { ToolbarState } from "./use-toolbar-state"

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

function ColorPaletteDropdown({
  editor,
  colors,
  styleProperty,
  icon,
  title,
  menuName,
  menu,
}: {
  editor: LexicalEditor
  colors: Array<{ label: string; value: string }>
  styleProperty: string
  icon: React.ReactNode
  title: string
  menuName: string
  menu: ToolbarMenuControls
}) {
  const apply = (value: string) => {
    editor.update(() => {
      const sel = $getSelection()
      if (sel !== null) {
        $patchStyleText(sel, { [styleProperty]: value || null })
      }
    })
    menu.closeMenu()
  }

  return (
    <PortalDropdown
      isOpen={menu.openMenu === menuName}
      onToggle={() => menu.toggleMenu(menuName)}
      onClose={menu.closeMenu}
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

function FontFamilyControl({
  editor,
  value,
  menu,
}: {
  editor: LexicalEditor
  value: string
  menu: ToolbarMenuControls
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
    menu.closeMenu()
  }

  return (
    <PortalDropdown
      isOpen={menu.openMenu === "fontFamily"}
      onToggle={() => menu.toggleMenu("fontFamily")}
      onClose={menu.closeMenu}
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

function FontSizeControl({
  editor,
  value,
  menu,
}: {
  editor: LexicalEditor
  value: string
  menu: ToolbarMenuControls
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
        isOpen={menu.openMenu === "fontSize"}
        onToggle={() => menu.toggleMenu("fontSize")}
        onClose={menu.closeMenu}
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
              menu.closeMenu()
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

const FORMAT_BUTTONS: Array<{
  format: TextFormatType
  title: string
  icon: React.ReactNode
  stateKey: keyof ToolbarState
}> = [
  {
    format: "bold",
    title: "Bold (Ctrl+B)",
    icon: <Bold />,
    stateKey: "isBold",
  },
  {
    format: "italic",
    title: "Italic (Ctrl+I)",
    icon: <Italic />,
    stateKey: "isItalic",
  },
  {
    format: "underline",
    title: "Underline (Ctrl+U)",
    icon: <Underline />,
    stateKey: "isUnderline",
  },
  {
    format: "strikethrough",
    title: "Strikethrough",
    icon: <Strikethrough />,
    stateKey: "isStrikethrough",
  },
  {
    format: "superscript",
    title: "Superscript",
    icon: <Superscript />,
    stateKey: "isSuperscript",
  },
  {
    format: "subscript",
    title: "Subscript",
    icon: <Subscript />,
    stateKey: "isSubscript",
  },
  {
    format: "highlight",
    title: "Highlight",
    icon: <Highlighter />,
    stateKey: "isHighlight",
  },
  { format: "code", title: "Inline code", icon: <Code />, stateKey: "isCode" },
]

/**
 * The inline text-styling section: font family + size, the text-format toggle
 * buttons (bold/italic/…/inline-code), and text/highlight color palettes.
 * Rendered in place of the code-language control for non-code blocks.
 */
export function InlineMarks({
  editor,
  state,
  menu,
}: {
  editor: LexicalEditor
  state: ToolbarState
  menu: ToolbarMenuControls
}) {
  return (
    <>
      <FontFamilyControl editor={editor} value={state.fontFamily} menu={menu} />
      <FontSizeControl editor={editor} value={state.fontSize} menu={menu} />

      <ToolbarSeparator />

      {FORMAT_BUTTONS.map(({ format, title, icon, stateKey }) => (
        <ToolbarButton
          key={format}
          active={state[stateKey] as boolean}
          title={title}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
        >
          {icon}
        </ToolbarButton>
      ))}

      <ColorPaletteDropdown
        editor={editor}
        colors={TEXT_COLORS}
        styleProperty="color"
        icon={<Baseline className="size-3" />}
        title="Text color"
        menuName="textColor"
        menu={menu}
      />
      <ColorPaletteDropdown
        editor={editor}
        colors={HIGHLIGHT_COLORS}
        styleProperty="background-color"
        icon={<PaintBucket className="size-3" />}
        title="Highlight color"
        menuName="bgColor"
        menu={menu}
      />
    </>
  )
}
