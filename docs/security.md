# Security

This is a frontend component library (`@imsaroj/smart-ui`) plus a Vite demo app
(`apps/web`). There is **no backend, no auth, and no secrets** in the repo, so
the runtime attack surface is small. The concerns that _do_ apply are
client-side XSS, spreadsheet-injection in exports, dependency supply chain, and
the security headers a host must set. This document is the single reference for
all four.

## Rich-text HTML sanitization contract

`SmartTextEditor` (`@imsaroj/smart-ui/lexical-text-editor`) round-trips **raw HTML**
in its default `format="html"` mode. That is a stored-XSS vector the moment an
app persists editor output and later renders it back.

The library handles both directions:

- **Inbound (automatic):** every HTML value the editor parses is run through
  `sanitizeEditorHtml` before `$generateNodesFromDOM`, so pasted or loaded
  markup cannot inject script into the editor.
- **Outbound (your responsibility):** HTML from `onChange` must be sanitized
  again wherever you render stored content. Use the exported helpers:

```tsx
import {
  SafeEditorHtml,
  sanitizeEditorHtml,
} from "@imsaroj/smart-ui/lexical-text-editor"

// Rendering stored editor HTML — the only sanctioned dangerouslySetInnerHTML site:
;<SafeEditorHtml html={storedHtml} className="prose" />

// Or sanitize a string directly before handing it off:
const clean = sanitizeEditorHtml(storedHtml)
```

`sanitizeEditorHtml` uses DOMPurify with an allow-list scoped to exactly what
the editor's node set emits (headings, lists, links, images, code blocks,
tables, `<hr>`/page-break markup, inline formatting). Links are hardened to
`rel="noopener noreferrer nofollow"` + `target="_blank"`, and
`javascript:` URLs are dropped. The `format="json"` mode never touches the DOM
and is not affected.

## CSV / XLSX formula-injection guard

Both grid exports neutralize spreadsheet **formula injection**: a cell value
starting with `= + - @`, tab, or carriage-return is prefixed with a single
quote (`'`) so Excel / Sheets / LibreOffice treat it as literal text instead of
executing it (`=cmd|'/C calc'!A0`, `=HYPERLINK(...)`, `@SUM(...)`).

- `SmartGrid`'s CSV export applies the guard via AG Grid's
  `processCellCallback`.
- The XLSX export path (`collectGridExport`) applies the same guard —
  `lib/xlsx.ts` already writes strings as inline strings (not formulas), but a
  leading `=` still detonates if a user re-saves the `.xlsx` as CSV.

The escaping helper is `escapeCsvFormula` (`data-grid/formula-guard.ts`),
unit-tested with the classic payloads.

## Dependency supply chain

- **`pnpm audit`** runs in CI (`.github/workflows/ci.yml`, `security` job):
  high/critical advisories in production dependencies fail the build; moderate
  advisories are reported non-blocking.
- **Secret scanning** — gitleaks scans commit history in the same job.
- **Dependabot** (`.github/dependabot.yml`) opens weekly grouped
  minor/patch PRs (majors separate) for npm and GitHub Actions, so updates
  arrive as PRs that CI gates.
- **Build-script allow-listing** — pnpm's `allowBuilds` in
  `pnpm-workspace.yaml` explicitly allow-lists which install scripts may run.

## MSW mock API is dev-only

The MSW worker (`apps/web/src/mocks/`) that backs the demo's data grids is
gated behind `import.meta.env.DEV` in `enableMocking` (`mocks/enable.ts`) — it
is a no-op in production builds and never ships as an interceptor to real
users. The mock dataset is deterministic in-memory state; it holds no secrets.

## Deployment security headers

No deployment exists yet. When the built `apps/web` output is hosted, the host
should set the following response headers. The CSP is deliberately strict but
accounts for the two things that need inline resources: AG Grid / Tailwind emit
inline `style`, and the XLSX/data-grid code produces `data:` URIs.

| Header                      | Value                                          | Why                           |
| --------------------------- | ---------------------------------------------- | ----------------------------- |
| `Content-Security-Policy`   | see snippets below                             | Blocks injected script/frames |
| `X-Content-Type-Options`    | `nosniff`                                      | No MIME sniffing              |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Limit referrer leakage        |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`     | Drop unused APIs              |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS                   |

CSP notes:

- `script-src 'self'` — the app ships no inline `<script>`; keep it script-tight.
- `style-src 'self' 'unsafe-inline'` — AG Grid and Tailwind inject inline
  styles at runtime; `'unsafe-inline'` for **styles only** (not script) is the
  standard accommodation.
- `img-src 'self' data:` — data-grid/XLSX flows and the editor's embedded
  images use `data:` URIs.
- `font-src 'self' data:` — the bundled variable fonts.

### Netlify — `_headers`

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### Vercel — `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

> If a real API is added later, extend `connect-src` to its origin. If stored
> editor HTML with `data:` images is rendered, `img-src data:` is already
> covered above.
