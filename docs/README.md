# `@iamsaroj/smart-ui` documentation

Consumer guides for each public entrypoint, the architecture decision records,
and a component → demo route map. For the architecture overview see
[`CLAUDE.md`](../CLAUDE.md); for the audit trail see [`report.md`](../report.md).

## Domain guides

Each guide follows the same skeleton: **What it is → Import → 80% example → Key
props → Escape hatches → Gotchas → Demo route.**

| Guide                                                | Entrypoint                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| [form-engine.md](./form-engine.md)                   | `@iamsaroj/smart-ui/form-engine`                                    |
| [data-grid.md](./data-grid.md)                       | `@iamsaroj/smart-ui/data-grid`                                      |
| [search-engine.md](./search-engine.md)               | `@iamsaroj/smart-ui/search-engine`                                  |
| [tree-engine.md](./tree-engine.md)                   | `@iamsaroj/smart-ui/tree-engine`                                    |
| [transfer-list-engine.md](./transfer-list-engine.md) | `@iamsaroj/smart-ui/transfer-list-engine`                           |
| [calendar-engine.md](./calendar-engine.md)           | `@iamsaroj/smart-ui/calendar-engine`                                |
| [lexical-text-editor.md](./lexical-text-editor.md)   | `@iamsaroj/smart-ui/lexical-text-editor`                            |
| [smart-components.md](./smart-components.md)         | `@iamsaroj/smart-ui/smart-components/*` (incl. `/page`, `/buttons`) |

## Other references

- [security.md](./security.md) — sanitize contract, export formula guard, CSP.
- [component-map.md](./component-map.md) — every exported component/engine → demo route → doc.
- [adr/](./adr/) — architecture decision records.

## Keeping docs honest

- **Consistency check** (`scripts/check-docs.mjs`, run in CI): every public
  subpath in `packages/ui/package.json` `exports` must map to a guide listed in
  the table above. A new engine entrypoint ships **failing** CI until it is
  documented here.
- **Snippet type safety:** the non-trivial code samples live typed in
  [`snippets.test-d.ts`](./snippets.test-d.ts) and are compiled with `tsc --noEmit`
  (via `docs/tsconfig.json`) by the same check — a doc example that stops
  type-checking fails CI. (Chosen as the lighter mechanism over a full doc
  extractor.)
