"use client"

import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  type LexicalEditor,
  type NodeKey,
  SKIP_SELECTION_FOCUS_TAG,
} from "lexical"
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { $setBlocksType } from "@lexical/selection"
import { DropdownItem, PortalDropdown } from "./primitives"
import {
  BLOCK_TYPE_LABELS,
  CODE_LANGUAGE_OPTIONS,
  type BlockType,
  type ToolbarMenuControls,
} from "./constants"

/**
 * The block-type dropdown (paragraph / headings / lists / quote / code). Applies
 * the chosen block type with `SKIP_SELECTION_FOCUS_TAG` so Lexical doesn't
 * restore DOM focus mid-change — matching the playground's format helpers.
 */
export const BlockFormatMenu = ({
  editor,
  blockType,
  menu,
}: {
  editor: LexicalEditor
  blockType: BlockType
  menu: ToolbarMenuControls
}) => {
  const applyBlockType = (type: BlockType) => {
    menu.closeMenu()
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

  return (
    <PortalDropdown
      isOpen={menu.openMenu === "blockType"}
      onToggle={() => menu.toggleMenu("blockType")}
      onClose={menu.closeMenu}
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
  )
}

/** Language picker shown in place of the text-style controls for code blocks. */
export const CodeLanguageControl = ({
  editor,
  language,
  elementKey,
  menu,
}: {
  editor: LexicalEditor
  language: string
  elementKey: NodeKey | null
  menu: ToolbarMenuControls
}) => {
  const friendly =
    CODE_LANGUAGE_OPTIONS.find(([v]) => v === language)?.[1] ?? "Plain Text"

  const apply = (lang: string) => {
    if (elementKey === null) return
    editor.update(() => {
      const node = $getNodeByKey(elementKey)
      if ($isCodeNode(node)) node.setLanguage(lang)
    })
    menu.closeMenu()
  }

  return (
    <PortalDropdown
      isOpen={menu.openMenu === "codeLanguage"}
      onToggle={() => menu.toggleMenu("codeLanguage")}
      onClose={menu.closeMenu}
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
