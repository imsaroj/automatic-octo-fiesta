# [0.2.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v0.1.0...v0.2.0) (2026-07-09)


### Features

* grid action button added ([1260b5e](https://github.com/imsaroj/automatic-octo-fiesta/commit/1260b5eeb918e520e27ced9d1de5ea7215c51350))
* overlay with async button ([a09f238](https://github.com/imsaroj/automatic-octo-fiesta/commit/a09f238c49e7798a42e58fd68900f83d191484a1))
* publish @imsaroj/smart-ui to npm via semantic-release ([7944881](https://github.com/imsaroj/automatic-octo-fiesta/commit/7944881796d1b0e3a09a79bbdc9589079e3ff78d))

# @imsaroj/smart-ui

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
