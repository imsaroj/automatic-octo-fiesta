"use client"

import * as React from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS } from "@lexical/markdown"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  type EditorState,
  type LexicalEditor,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import { editorTheme } from "./editor-theme"
import { editorNodes } from "./editor-nodes"
import { sanitizeEditorHtml } from "./sanitize"
import { ToolbarPlugin } from "./plugins/toolbar-plugin"
import { CodeHighlightPlugin } from "./plugins/code-highlight-plugin"
import { AutoLinkPlugin } from "./plugins/auto-link-plugin"
import { Label } from "@imsaroj/smart-ui/components/label"
import { cn } from "@imsaroj/smart-ui/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

export type SmartTextEditorFormat = "html" | "json"

export interface SmartTextEditorProps {
  /** Field label rendered above the editor. */
  label?: React.ReactNode
  /** Hint rendered below the editor. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  /** Appends a red asterisk to the label. */
  required?: boolean
  /** Appends a muted "(optional)" to the label. */
  optional?: boolean
  /** Class applied to the outer field wrapper div. */
  fieldClassName?: string

  /**
   * Controlled value. When provided the editor content is replaced whenever
   * this value changes from outside. Pair with `onChange` for a fully
   * controlled field.
   */
  value?: string
  /** Initial content when the editor is uncontrolled. */
  defaultValue?: string
  /** Called whenever content changes, with serialized content in `format`. */
  onChange?: (value: string) => void
  /**
   * Serialization format for `value` / `onChange`.
   * - `"html"` (default) — standard HTML string
   * - `"json"` — Lexical JSON serialization (lossless round-trip)
   */
  format?: SmartTextEditorFormat

  /** Placeholder text when the editor is empty. */
  placeholder?: string
  /** When true the editor is not editable and the toolbar is hidden. */
  readOnly?: boolean
  /** Focus the editor on mount. */
  autoFocus?: boolean
  /** Show or hide the formatting toolbar. Defaults to `true`. */
  toolbar?: boolean

  /** Class applied to the editor wrapper (border, shadow, etc.). */
  className?: string
  /** Class applied directly to the `contenteditable` element. */
  editorClassName?: string
  /** Minimum height of the editable area (CSS value, e.g. `"120px"`). */
  minHeight?: string
  /** Maximum height of the editable area before it scrolls (CSS value). */
  maxHeight?: string
}

// ─── Value-sync plugin ───────────────────────────────────────────────────────

const ValueSyncPlugin = ({
  value,
  format,
}: {
  value: string | undefined
  format: SmartTextEditorFormat
}) => {
  const [editor] = useLexicalComposerContext()
  const prevRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (value === prevRef.current) return
    prevRef.current = value

    if (!value) {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.append($createParagraphNode())
        },
        { tag: "value-sync" }
      )
      return
    }

    if (format === "json") {
      try {
        const nextState = editor.parseEditorState(value)
        editor.setEditorState(nextState)
      } catch {
        // ignore malformed JSON
      }
    } else {
      editor.update(
        () => {
          // Sanitize inbound HTML before it becomes editor nodes (stored-XSS guard).
          const dom = new DOMParser().parseFromString(
            sanitizeEditorHtml(value),
            "text/html"
          )
          const nodes = $generateNodesFromDOM(editor, dom)
          const root = $getRoot()
          root.clear()
          if (nodes.length > 0) {
            root.select()
            $insertNodes(nodes)
          } else {
            root.append($createParagraphNode())
          }
        },
        { tag: "value-sync" }
      )
    }
  }, [editor, value, format])

  return null
}

// ─── SmartTextEditor ─────────────────────────────────────────────────────────

/**
 * Lexical-based rich-text editor with a flat prop API.
 *
 * **HTML sanitization contract (`format="html"`):** inbound HTML is sanitized
 * on parse via {@link sanitizeEditorHtml}, so pasting or loading hostile markup
 * cannot inject script into the editor. Output HTML from `onChange` reflects the
 * editor's own node set, but **apps that persist and later re-render that HTML
 * must sanitize on the way out** — render it with {@link SafeEditorHtml} or run
 * it through {@link sanitizeEditorHtml} before `dangerouslySetInnerHTML`. The
 * `"json"` format is not affected (it never touches the DOM).
 */
export const SmartTextEditor = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  value,
  defaultValue,
  onChange,
  format = "html",
  placeholder = "Start typing…",
  readOnly = false,
  autoFocus = false,
  toolbar = true,
  className,
  editorClassName,
  minHeight = "120px",
  maxHeight,
}: SmartTextEditorProps) => {
  const id = useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  // initialConfig is only consumed on mount — a lazy useState initializer
  // computes it exactly once without touching refs during render.
  const [initialConfig] = useState<InitialConfigType>(() => {
    const initialContent = defaultValue ?? value
    let editorState: InitialConfigType["editorState"]
    if (initialContent != null) {
      if (format === "json") {
        editorState = initialContent
      } else {
        editorState = (editorInstance: LexicalEditor) => {
          // Sanitize inbound HTML before it becomes editor nodes (stored-XSS guard).
          const dom = new DOMParser().parseFromString(
            sanitizeEditorHtml(initialContent),
            "text/html"
          )
          const nodes = $generateNodesFromDOM(editorInstance, dom)
          const root = $getRoot()
          if (nodes.length > 0) {
            root.select()
            $insertNodes(nodes)
          }
        }
      }
    }
    return {
      namespace: id,
      theme: editorTheme,
      nodes: editorNodes,
      editable: !readOnly,
      onError: (err: Error) => console.error("[SmartTextEditor]", err),
      editorState,
    }
  })

  const handleChange = useCallback(
    (
      editorState: EditorState,
      editorInstance: LexicalEditor,
      tags: Set<string>
    ) => {
      if (!onChange) return
      // Skip updates triggered by ValueSyncPlugin to avoid feedback loops
      if (tags.has("value-sync")) return
      editorState.read(() => {
        if (format === "html") {
          onChange($generateHtmlFromNodes(editorInstance, null))
        } else {
          onChange(JSON.stringify(editorState.toJSON()))
        }
      })
    },
    [onChange, format]
  )

  const showToolbar = toolbar && !readOnly

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label htmlFor={`${id}-editor`}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {optional && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </Label>
      )}

      <LexicalComposer initialConfig={initialConfig}>
        <div
          className={cn(
            "rounded-md border border-input bg-background text-sm shadow-xs",
            "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
            error != null &&
              "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            readOnly && "opacity-70",
            className
          )}
          aria-describedby={hintId}
          aria-invalid={error != null ? true : undefined}
        >
          {showToolbar && <ToolbarPlugin />}

          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  id={`${id}-editor`}
                  aria-label={
                    typeof label === "string" ? label : "Rich text editor"
                  }
                  aria-multiline
                  spellCheck
                  className={cn(
                    "px-3 py-2 leading-relaxed outline-none",
                    editorClassName
                  )}
                  style={{
                    minHeight,
                    maxHeight,
                    overflowY: maxHeight ? "auto" : undefined,
                  }}
                />
              }
              placeholder={
                <div
                  className="pointer-events-none absolute top-2 left-3 text-muted-foreground select-none"
                  aria-hidden="true"
                >
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <HorizontalRulePlugin />
          <TablePlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <ClickableLinkPlugin />
          <CodeHighlightPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          {autoFocus && <AutoFocusPlugin />}
          <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
          {/* Controlled value sync — only active when `value` prop is provided */}
          {value !== undefined && (
            <ValueSyncPlugin value={value} format={format} />
          )}
        </div>
      </LexicalComposer>

      {hasHint && (
        <p
          id={hintId}
          className={cn(
            "text-xs",
            error != null ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
}
