"use client"

import { useEffect } from "react"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type LexicalEditor,
} from "lexical"
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils"

import { $createImageNode, INSERT_IMAGE_COMMAND } from "../../nodes/image-node"
import {
  $createPageBreakNode,
  INSERT_PAGE_BREAK_COMMAND,
} from "../../nodes/page-break-node"

/**
 * Registers the block-level insert commands the {@link InsertMenu} dispatches.
 * Uses `$insertNodeToNearestRoot` (not `$insertNodes`) so block-level decorators
 * land at the root — same as the Lexical playground. Co-located with the insert
 * menu that triggers them.
 */
export function useRegisterInsertCommands(editor: LexicalEditor) {
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
}
