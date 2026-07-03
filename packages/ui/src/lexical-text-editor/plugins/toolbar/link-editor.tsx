"use client"

import { useEffect, useRef, useState } from "react"
import { type LexicalEditor } from "lexical"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { Check, Link2, Link2Off, X } from "lucide-react"
import { ToolbarButton } from "./primitives"

/**
 * The link control: toggles between an "insert/remove link" button and an inline
 * URL input. Owns its own input-open + draft-URL state (ephemeral UI, unrelated
 * to the shared selection state) — `isLink` comes from the toolbar state.
 */
export function LinkEditor({
  editor,
  isLink,
}: {
  editor: LexicalEditor
  isLink: boolean
}) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showLinkInput) linkInputRef.current?.focus()
  }, [showLinkInput])

  function submitLink() {
    const url = linkUrl.trim()
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    setShowLinkInput(false)
    setLinkUrl("")
  }

  if (showLinkInput) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={linkInputRef}
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://…"
          className="h-6 w-44 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submitLink()
            }
            if (e.key === "Escape") {
              setShowLinkInput(false)
              setLinkUrl("")
            }
          }}
        />
        <ToolbarButton title="Apply link" onClick={submitLink}>
          <Check />
        </ToolbarButton>
        <ToolbarButton
          title="Cancel"
          onClick={() => {
            setShowLinkInput(false)
            setLinkUrl("")
          }}
        >
          <X />
        </ToolbarButton>
      </div>
    )
  }

  return (
    <ToolbarButton
      active={isLink}
      title={isLink ? "Remove link" : "Insert link"}
      onClick={() => {
        if (isLink) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        else {
          setLinkUrl("")
          setShowLinkInput(true)
        }
      }}
    >
      {isLink ? <Link2Off /> : <Link2 />}
    </ToolbarButton>
  )
}
