import { useState } from "react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartTextEditor } from "@workspace/ui/lexical-text-editor"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"

const INITIAL_HTML = `<h2>Welcome to SmartTextEditor</h2><p>This is a <strong>rich text editor</strong> built on <em>Lexical</em>. You can:</p><ul><li>Format text with <strong>bold</strong>, <em>italic</em>, <u>underline</u></li><li>Create headings, lists, blockquotes</li><li>Insert <a href="https://lexical.dev">links</a> and inline code</li><li>Use <code>markdown shortcuts</code> like **bold** or # Heading</li></ul>`

const TextEditorPage = () => {
  const [html, setHtml] = useState(INITIAL_HTML)
  const [json, setJson] = useState("")

  return (
    <SmartPage
      title="Text Editor"
      description="SmartTextEditor — Lexical-powered rich text editor with label, description, and error support."
    >
      <SmartPageContent>
        <SmartPageSection>
          <div className="flex max-w-3xl flex-col gap-6">
            {/* Basic uncontrolled */}
            <SmartCard header={{ title: "Basic (uncontrolled)" }}>
              <SmartTextEditor
                label="Post body"
                description="Supports markdown shortcuts: **bold**, *italic*, # heading, - list"
                placeholder="Start writing…"
                defaultValue={INITIAL_HTML}
                minHeight="160px"
              />
            </SmartCard>

            {/* Controlled with HTML output */}
            <SmartCard
              header={{
                title: "Controlled — HTML format",
                subtitle: "value / onChange in HTML mode",
              }}
            >
              <SmartTextEditor
                label="Description"
                required
                value={html}
                onChange={setHtml}
                format="html"
                minHeight="120px"
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground select-none">
                  Raw HTML output
                </summary>
                <pre className="mt-2 rounded bg-muted p-3 text-xs break-all whitespace-pre-wrap">
                  {html}
                </pre>
              </details>
            </SmartCard>

            {/* Controlled with JSON output */}
            <SmartCard
              header={{
                title: "Controlled — JSON format",
                subtitle: "value / onChange in Lexical JSON mode",
              }}
            >
              <SmartTextEditor
                label="Notes"
                optional
                description="Content serialized as Lexical JSON — best for lossless round-trips."
                value={json || undefined}
                onChange={setJson}
                format="json"
                minHeight="120px"
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground select-none">
                  Raw JSON output
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                  {json ? JSON.stringify(JSON.parse(json), null, 2) : "—"}
                </pre>
              </details>
            </SmartCard>

            {/* Error state */}
            <SmartCard header={{ title: "With validation error" }}>
              <SmartTextEditor
                label="Review"
                required
                error="Review body is required and must be at least 50 characters."
                placeholder="Write your review…"
                minHeight="100px"
              />
            </SmartCard>

            {/* Read-only */}
            <SmartCard header={{ title: "Read-only mode" }}>
              <SmartTextEditor
                label="Published content"
                readOnly
                defaultValue={INITIAL_HTML}
              />
            </SmartCard>
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default TextEditorPage
