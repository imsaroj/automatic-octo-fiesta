import * as React from "react"
import DOMPurify from "dompurify"

/**
 * HTML sanitization for {@link SmartTextEditor}'s `"html"` format.
 *
 * The editor round-trips **raw HTML** — it parses an initial HTML value with
 * `$generateNodesFromDOM` and emits HTML via `$generateHtmlFromNodes`. Any app
 * that persists that HTML and later renders it back is exposed to **stored
 * XSS** unless the HTML is sanitized. This module is the library's answer to
 * that contract:
 *
 * - {@link sanitizeEditorHtml} — a DOMPurify pass with an allow-list scoped to
 *   exactly what the editor's node set can produce (headings, lists, links,
 *   images, code blocks, tables, `<hr>`/page-break markup, inline formatting).
 *   It is applied to **inbound** HTML inside `SmartTextEditor` automatically.
 * - {@link SafeEditorHtml} — a component for rendering stored editor HTML back
 *   out. This is the **only** sanctioned `dangerouslySetInnerHTML` site.
 *
 * Links are hardened: every `<a>` is forced to `rel="noopener noreferrer
 * nofollow"` and `target="_blank"`, and `javascript:`/`data:` (non-image) URLs
 * are dropped by DOMPurify's URI policy.
 */

/** Tags the editor's node set can emit. Everything else is stripped. */
const ALLOWED_TAGS = [
  // block text
  "p",
  "br",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // lists (incl. Lexical check lists, which are <li> with classes)
  "ul",
  "ol",
  "li",
  // links
  "a",
  // inline formatting
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "span",
  "mark",
  // code
  "code",
  "pre",
  // media / rules
  "img",
  "hr",
  // tables
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "colgroup",
  "col",
]

/**
 * Attributes the editor emits. `style`/`class` carry Lexical's formatting
 * (text color, alignment, code-highlight token classes, image `max-width`, the
 * page-break rule). DOMPurify still sanitizes `style` values (drops `url()`
 * javascript / expressions) and the URI policy still guards `href`/`src`.
 */
const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "dir",
  "class",
  "style",
  "colspan",
  "rowspan",
  "width",
  "height",
  "start",
  "type",
  "value",
  "data-lexical-page-break",
]

let hookRegistered = false

/** Force link hardening once — DOMPurify hooks are process-global. */
const ensureLinkHardeningHook = (): void => {
  if (hookRegistered) return
  hookRegistered = true
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A" && node instanceof Element) {
      // Only harden real links; DOMPurify has already dropped unsafe hrefs.
      node.setAttribute("rel", "noopener noreferrer nofollow")
      node.setAttribute("target", "_blank")
    }
  })
}

/**
 * Sanitize an HTML string produced by (or destined for) {@link SmartTextEditor}
 * in `"html"` mode. Strips scripts, event handlers, and unsafe URLs while
 * preserving legitimate editor output unchanged.
 */
export const sanitizeEditorHtml = (html: string): string => {
  ensureLinkHardeningHook()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // `<img>` permits `data:` URIs by DOMPurify's default policy (the editor's
    // ImageNode can embed them); `javascript:` stays blocked everywhere.
    ALLOW_DATA_ATTR: false,
  })
}

/** Props for {@link SafeEditorHtml}. */
export interface SafeEditorHtmlProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "dangerouslySetInnerHTML"
> {
  /** The stored editor HTML to sanitize and render. */
  html: string
}

/**
 * Render stored {@link SmartTextEditor} HTML safely. Sanitizes with
 * {@link sanitizeEditorHtml} and is the **only** place in the library that uses
 * `dangerouslySetInnerHTML`. Extra props spread onto the wrapping `<div>`.
 *
 * @example
 * ```tsx
 * <SafeEditorHtml html={storedHtml} className="prose" />
 * ```
 */
export const SafeEditorHtml = ({
  html,
  ...divProps
}: SafeEditorHtmlProps): React.JSX.Element => {
  const clean = React.useMemo(() => sanitizeEditorHtml(html), [html])
  return React.createElement("div", {
    ...divProps,
    dangerouslySetInnerHTML: { __html: clean },
  })
}
