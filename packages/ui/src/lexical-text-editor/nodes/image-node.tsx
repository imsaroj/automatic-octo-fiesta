"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  mergeRegister,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { cn } from "@workspace/ui/lib/utils"

// ─── Command ────────────────────────────────────────────────────────────────

/** Lexical command that inserts an {@link ImageNode} at the current selection. */
export const INSERT_IMAGE_COMMAND = createCommand<{
  src: string
  alt: string
  maxWidth?: number
}>("INSERT_IMAGE_COMMAND")

// ─── Types ───────────────────────────────────────────────────────────────────

export type SerializedImageNode = Spread<
  { src: string; alt: string; maxWidth?: number },
  SerializedLexicalNode
>

// ─── React component rendered by decorate() ──────────────────────────────────

const ImageComponent = ({
  src,
  alt,
  maxWidth,
  nodeKey,
}: {
  src: string
  alt: string
  maxWidth?: number
  nodeKey: NodeKey
}) => {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (imageRef.current === event.target) {
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

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      draggable={false}
      className={cn(
        "my-2 block max-w-full rounded object-contain",
        isSelected && "outline outline-2 outline-offset-1 outline-primary"
      )}
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
    />
  )
}

// ─── Node ────────────────────────────────────────────────────────────────────

/**
 * Block-level Lexical decorator node for an image. In the editor it renders a
 * selectable `<img>` via {@link ImageComponent}; on serialization it round-trips
 * through JSON and exports a plain `<img>` for HTML output.
 */
export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string
  __alt: string
  __maxWidth?: number

  static getType(): string {
    return "image"
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__maxWidth, node.__key)
  }

  static importJSON(s: SerializedImageNode): ImageNode {
    return $createImageNode({ src: s.src, alt: s.alt, maxWidth: s.maxWidth })
  }

  constructor(src: string, alt: string, maxWidth?: number, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__alt = alt
    this.__maxWidth = maxWidth
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      maxWidth: this.__maxWidth,
    }
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span")
    span.style.display = "block"
    return span
  }

  updateDOM(): false {
    return false
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img")
    img.src = this.__src
    img.alt = this.__alt
    if (this.__maxWidth) img.style.maxWidth = `${this.__maxWidth}px`
    return { element: img }
  }

  isInline(): boolean {
    return false
  }

  decorate(): React.JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        alt={this.__alt}
        maxWidth={this.__maxWidth}
        nodeKey={this.__key}
      />
    )
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const $createImageNode = ({
  src,
  alt,
  maxWidth,
  key,
}: {
  src: string
  alt: string
  maxWidth?: number
  key?: NodeKey
}): ImageNode => new ImageNode(src, alt, maxWidth, key)

export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode
