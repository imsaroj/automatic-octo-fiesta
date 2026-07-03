"use client"

import { useCallback, useState } from "react"
import {
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import { $patchStyleText } from "@lexical/selection"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { Eraser, Indent, Outdent, Redo2, Undo2 } from "lucide-react"

import { ALL_TEXT_FORMATS, type ToolbarMenuControls } from "./toolbar/constants"
import { ToolbarButton, ToolbarSeparator } from "./toolbar/primitives"
import { useToolbarState } from "./toolbar/use-toolbar-state"
import { useRegisterInsertCommands } from "./toolbar/use-insert-commands"
import {
  BlockFormatMenu,
  CodeLanguageControl,
} from "./toolbar/block-format-menu"
import { InlineMarks } from "./toolbar/inline-marks"
import { InsertMenu } from "./toolbar/insert-menu"
import { AlignControls } from "./toolbar/align-menu"
import { LinkEditor } from "./toolbar/link-editor"

/**
 * The rich-text editor toolbar. A thin composition layer: it reads the
 * selection-derived state from {@link useToolbarState}, owns the single
 * open-menu + history-command wiring, and lays out the section components
 * (`toolbar/*`). Each section owns its own commands and internal state.
 */
export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const state = useToolbarState(editor)
  useRegisterInsertCommands(editor)

  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const toggleMenu = useCallback(
    (name: string) => setOpenMenu((prev) => (prev === name ? null : name)),
    []
  )
  const closeMenu = useCallback(() => setOpenMenu(null), [])
  const menu: ToolbarMenuControls = { openMenu, toggleMenu, closeMenu }

  const clearFormatting = useCallback(() => {
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
  }, [editor])

  const isCodeBlock = state.blockType === "code"

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* History */}
      <ToolbarButton
        title="Undo (Ctrl+Z)"
        disabled={!state.canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        title="Redo (Ctrl+Y)"
        disabled={!state.canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo2 />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Block type */}
      <BlockFormatMenu
        editor={editor}
        blockType={state.blockType}
        menu={menu}
      />

      {/* Code block → language picker replaces text-style controls */}
      {isCodeBlock ? (
        <>
          <ToolbarSeparator />
          <CodeLanguageControl
            editor={editor}
            language={state.codeLanguage}
            elementKey={state.selectedElementKey}
            menu={menu}
          />
        </>
      ) : (
        <>
          <ToolbarSeparator />
          <InlineMarks editor={editor} state={state} menu={menu} />
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
      <InsertMenu editor={editor} menu={menu} />

      <ToolbarSeparator />

      {/* Alignment */}
      <AlignControls editor={editor} elementFormat={state.elementFormat} />

      <ToolbarSeparator />

      {/* Link */}
      <LinkEditor editor={editor} isLink={state.isLink} />
    </div>
  )
}
