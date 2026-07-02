"use client"

import * as React from "react"
import { useEffect } from "react"
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DecoratorNode,
  type LexicalNode,
  mergeRegister,
  type NodeKey,
  type SerializedLexicalNode,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"

// ─── Command ─────────────────────────────────────────────────────────────────

export const INSERT_PAGE_BREAK_COMMAND = createCommand<void>(
  "INSERT_PAGE_BREAK_COMMAND"
)

// ─── React component rendered by decorate() ──────────────────────────────────
// Returns null — visual comes from the <hr> in createDOM() + theme CSS.
// Handles selection state so keyboard/click selection works correctly.

function PageBreakComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const el = editor.getElementByKey(nodeKey)
          if (event.target === el) {
            if (!event.shiftKey) clearSelection()
            setSelected(!isSelected)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [clearSelection, editor, isSelected, nodeKey, setSelected])

  useEffect(() => {
    const el = editor.getElementByKey(nodeKey) as HTMLElement | null
    if (el !== null) {
      el.style.outline = isSelected ? "2px solid hsl(var(--ring))" : ""
      el.style.outlineOffset = isSelected ? "2px" : ""
    }
  }, [editor, isSelected, nodeKey])

  return null
}

// ─── Node ─────────────────────────────────────────────────────────────────────

export type SerializedPageBreakNode = SerializedLexicalNode

export class PageBreakNode extends DecoratorNode<React.JSX.Element> {
  static getType(): string {
    return "page-break"
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key)
  }

  static importJSON(_s: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode()
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  exportJSON(): SerializedPageBreakNode {
    return { type: "page-break", version: 1 }
  }

  createDOM(): HTMLElement {
    const el = document.createElement("hr")
    el.style.pageBreakAfter = "always"
    el.style.borderTop = "2px dashed hsl(var(--border))"
    el.style.cursor = "pointer"
    el.style.margin = "8px 0"
    el.style.userSelect = "none"
    el.setAttribute("data-lexical-page-break", "true")
    return el
  }

  getTextContent(): string {
    return "\n"
  }

  isInline(): false {
    return false
  }

  updateDOM(): boolean {
    return false
  }

  decorate(): React.JSX.Element {
    return <PageBreakComponent nodeKey={this.__key} />
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function $createPageBreakNode(key?: NodeKey): PageBreakNode {
  return new PageBreakNode(key)
}

export function $isPageBreakNode(
  node: LexicalNode | null | undefined
): node is PageBreakNode {
  return node instanceof PageBreakNode
}
