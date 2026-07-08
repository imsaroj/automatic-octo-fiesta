# @workspace/ui

## 0.1.0

### Minor Changes

- First tracked release (0.1.0). Establishes the public surface of the source-only
  component library:
  - **Domain engines** — form engine (TanStack Form + Zod), data grid (`SmartGrid`
    / `SmartServerGrid` on AG Grid, Spring `Page<T>` contract), search engine,
    tree, transfer list, calendar (views + recurrence + booking), and the Lexical
    rich-text editor (with the `sanitizeEditorHtml` / `SafeEditorHtml` contract).
  - **Smart wrappers** — flat-props wrappers over shadcn/Base UI primitives, the
    action-button preset system, and the `SmartPage` slot layout system.
  - **Security & a11y baselines** — export formula-injection guard, editor HTML
    sanitization, and axe-clean components (unit + E2E).
