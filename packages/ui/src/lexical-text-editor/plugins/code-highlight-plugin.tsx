"use client"

import { useEffect } from "react"
import { registerCodeHighlighting } from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

/**
 * Enables Prism-based syntax highlighting inside code blocks.
 * Token colors come from the `codeHighlight` section of the editor theme.
 */
export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => registerCodeHighlighting(editor), [editor])
  return null
}
