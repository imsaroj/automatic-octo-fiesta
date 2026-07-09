# Rich text editor — `@iamsaroj/smart-ui/lexical-text-editor`

## What it is

`SmartTextEditor` — a **Lexical**-based rich-text editor with a flat prop API.
Registers a node set (headings, lists, links, images, code, tables, `<hr>`,
custom page-break), a toolbar, auto-link, and code-highlight plugins.

## Import

```ts
import {
  SmartTextEditor,
  SafeEditorHtml,
  sanitizeEditorHtml,
} from "@iamsaroj/smart-ui/lexical-text-editor"
```

## 80% example

```tsx
const [html, setHtml] = React.useState("")

<SmartTextEditor
  label="Notes"
  value={html}
  onChange={setHtml}
  format="html" // or "json" for lossless round-trip
/>
```

## Value formats

| `format` | `value` / `onChange`       | Notes                                   |
| -------- | -------------------------- | --------------------------------------- |
| `"html"` | HTML string (default)      | Human-readable; sanitized on parse.     |
| `"json"` | Lexical JSON serialization | Lossless round-trip; never touches DOM. |

## Sanitize contract (`format="html"`) — important

The editor round-trips **raw HTML**, a stored-XSS vector once an app persists and
re-renders it.

- **Inbound is automatic**: HTML the editor parses is run through
  `sanitizeEditorHtml` first, so hostile markup can't inject script.
- **Outbound is your responsibility**: sanitize wherever you render stored
  editor HTML. Use the exported helpers:

```tsx
// The only sanctioned dangerouslySetInnerHTML site in the library:
;<SafeEditorHtml html={storedHtml} className="prose" />

// …or sanitize a string directly:
const clean = sanitizeEditorHtml(storedHtml)
```

`sanitizeEditorHtml` uses a DOMPurify allow-list scoped to the editor's node set,
hardens links (`rel="noopener noreferrer nofollow"` + `target="_blank"`), and drops
`javascript:` URLs. See [security.md](./security.md).

## Key props

| Prop                    | Type               | Notes                         |
| ----------------------- | ------------------ | ----------------------------- |
| `value`/`onChange`      | `string`           | Serialized in `format`.       |
| `format`                | `"html" \| "json"` | Default `"html"`.             |
| `readOnly`              | `boolean`          | Hides the toolbar.            |
| `toolbar`               | `boolean`          | Show/hide formatting toolbar. |
| `minHeight`/`maxHeight` | CSS string         | Editable-area sizing.         |

## Gotchas

- Lexical node modules colocate the decorator React component with the node class —
  see the memory note on Lexical gotchas (LexicalErrorBoundary named export,
  `decorate()` React-component rule, `$insertNodeToNearestRoot`).

## Demo

`/smart/text-editor`.
