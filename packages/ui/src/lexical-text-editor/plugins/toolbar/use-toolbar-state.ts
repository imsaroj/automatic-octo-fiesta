"use client"

import { useCallback, useEffect, useState } from "react"
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type ElementFormatType,
  type LexicalEditor,
  type NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { $isHeadingNode } from "@lexical/rich-text"
import { $isListNode, ListNode } from "@lexical/list"
import { $isLinkNode } from "@lexical/link"
import { $isCodeNode } from "@lexical/code"
import { $getSelectionStyleValueForProperty } from "@lexical/selection"
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils"

import type { BlockType } from "./constants"

/** The anchor/focus node the selection resolves to, or `null` for a non-range. */
function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  return anchor === focus ? anchor : selection.isBackward() ? focus : anchor
}

/** Everything the toolbar derives from the current selection / editor state. */
export interface ToolbarState {
  canUndo: boolean
  canRedo: boolean
  blockType: BlockType
  selectedElementKey: NodeKey | null
  codeLanguage: string
  fontSize: string
  fontFamily: string
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  isCode: boolean
  isSuperscript: boolean
  isSubscript: boolean
  isHighlight: boolean
  elementFormat: ElementFormatType
  isLink: boolean
}

/**
 * Subscribes to the editor and returns the selection-derived toolbar state.
 * Reads on every selection change and editor update — the single source that
 * every toolbar section renders its active/enabled state from. Extracted from
 * `ToolbarPlugin` so the sections stay presentational.
 */
export function useToolbarState(editor: LexicalEditor): ToolbarState {
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

  return {
    canUndo,
    canRedo,
    blockType,
    selectedElementKey,
    codeLanguage,
    fontSize,
    fontFamily,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isCode,
    isSuperscript,
    isSubscript,
    isHighlight,
    elementFormat,
    isLink,
  }
}
