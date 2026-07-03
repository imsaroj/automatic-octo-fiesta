"use client"

import {
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  type LexicalEditor,
} from "lexical"
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react"
import { ToolbarButton } from "./primitives"

/** The four element-alignment buttons (left / center / right / justify). */
export function AlignControls({
  editor,
  elementFormat,
}: {
  editor: LexicalEditor
  elementFormat: ElementFormatType
}) {
  return (
    <>
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
    </>
  )
}
