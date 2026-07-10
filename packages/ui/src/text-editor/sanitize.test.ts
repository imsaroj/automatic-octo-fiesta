import { describe, expect, it } from "vitest"
import { sanitizeEditorHtml } from "./sanitize"

describe("sanitizeEditorHtml", () => {
  it("strips <script> tags", () => {
    const out = sanitizeEditorHtml(`<p>hi</p><script>alert('xss')</script>`)
    expect(out).toContain("<p>hi</p>")
    expect(out.toLowerCase()).not.toContain("<script")
    expect(out).not.toContain("alert(")
  })

  it("strips event-handler attributes like onerror", () => {
    const out = sanitizeEditorHtml(
      `<img src="x" onerror="alert(1)" alt="broken">`
    )
    expect(out.toLowerCase()).not.toContain("onerror")
    expect(out).not.toContain("alert(1)")
  })

  it("drops javascript: URLs on links", () => {
    const out = sanitizeEditorHtml(`<a href="javascript:alert(1)">click</a>`)
    expect(out.toLowerCase()).not.toContain("javascript:")
    expect(out).toContain("click")
  })

  it("hardens legitimate links with rel + target", () => {
    const out = sanitizeEditorHtml(`<a href="https://example.com">site</a>`)
    expect(out).toContain(`href="https://example.com"`)
    expect(out).toContain(`rel="noopener noreferrer nofollow"`)
    expect(out).toContain(`target="_blank"`)
  })

  it("keeps data: image URIs", () => {
    const dataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    const out = sanitizeEditorHtml(`<img src="${dataUri}" alt="dot">`)
    expect(out).toContain("data:image/png")
  })

  it("round-trips representative editor output unchanged", () => {
    // A fixture covering headings, formatting, lists, code, table, hr, image —
    // the kinds of markup the editor's node set actually emits.
    const fixture = [
      `<h1>Title</h1>`,
      `<p><strong>bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p>`,
      `<ul><li>one</li><li>two</li></ul>`,
      `<ol start="3"><li>three</li></ol>`,
      `<blockquote>quote</blockquote>`,
      `<pre><code class="language-js"><span class="token">const</span> x = 1</code></pre>`,
      `<table><tbody><tr><td colspan="2">cell</td></tr></tbody></table>`,
      `<hr data-lexical-page-break="true" style="page-break-after: always;">`,
      `<img src="https://example.com/a.png" alt="pic" style="max-width: 320px;">`,
    ].join("")

    const out = sanitizeEditorHtml(fixture)

    // Every structural tag survives.
    for (const tag of [
      "<h1>",
      "<strong>",
      "<em>",
      "<ul>",
      "<ol",
      "<blockquote>",
      "<pre>",
      "<code",
      "<table>",
      "<td",
      "<hr",
      "<img",
    ]) {
      expect(out).toContain(tag)
    }
    expect(out).toContain("data-lexical-page-break")
    expect(out).toContain(`class="language-js"`)
  })
})
