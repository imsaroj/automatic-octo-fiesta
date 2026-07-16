# [1.3.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.2.0...v1.3.0) (2026-07-16)


### Features

* **ui:** improve server data grid pagination with dynamic page size sync re-released ([d7add22](https://github.com/imsaroj/automatic-octo-fiesta/commit/d7add223b49ac4892952b51ee48c3f20d3d0b75d))

# [1.2.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.1.2...v1.2.0) (2026-07-16)


### Features

* **ui:** improve server data grid pagination with dynamic page size sync ([a4dd9b8](https://github.com/imsaroj/automatic-octo-fiesta/commit/a4dd9b8911cedad216fc90ac68d7703f1bfef7de))

## [1.1.2](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.1.1...v1.1.2) (2026-07-16)


### Bug Fixes

* **ui:** sync page size with cacheBlockSize in server data grid pagination ([2677143](https://github.com/imsaroj/automatic-octo-fiesta/commit/26771435a30a544f6ad793729e28e8283bca0073))

## [1.1.1](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.1.0...v1.1.1) (2026-07-15)


### Bug Fixes

* **ui:** publish fonts.css so consumers get all font families ([6b90dae](https://github.com/imsaroj/automatic-octo-fiesta/commit/6b90daea313b4aca532c91b375290108c0e9dcd6))

# [1.1.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.0.0...v1.1.0) (2026-07-15)


### Features

* **ui:** add Pretendard, Nanum Gothic, and SUIT font families ([6874939](https://github.com/imsaroj/automatic-octo-fiesta/commit/687493926271d1199f5211342be227523b4a4c09))

# [1.0.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v0.2.0...v1.0.0) (2026-07-10)


* refactor!: drop -engine suffix from subpaths, rename lexical-text-editor to text-editor ([413f7a1](https://github.com/imsaroj/automatic-octo-fiesta/commit/413f7a187e043b56ed8ea2e36874e831ad359ed0))


### BREAKING CHANGES

* all six import subpaths above are renamed; consumers
must update imports, e.g. @iamsaroj/smart-ui/tree-engine ->
@iamsaroj/smart-ui/tree and @iamsaroj/smart-ui/lexical-text-editor ->
@iamsaroj/smart-ui/text-editor.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

# [0.2.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v0.1.0...v0.2.0) (2026-07-09)


### Bug Fixes

* publish under [@iamsaroj](https://github.com/iamsaroj) scope — npm username is iamsaroj, not imsaroj ([b9961d4](https://github.com/imsaroj/automatic-octo-fiesta/commit/b9961d4309f6a93a371252470c5a069fd011c5a6))


### Features

* grid action button added ([1260b5e](https://github.com/imsaroj/automatic-octo-fiesta/commit/1260b5eeb918e520e27ced9d1de5ea7215c51350))
* overlay with async button ([a09f238](https://github.com/imsaroj/automatic-octo-fiesta/commit/a09f238c49e7798a42e58fd68900f83d191484a1))
* publish @imsaroj/smart-ui to npm via semantic-release ([7944881](https://github.com/imsaroj/automatic-octo-fiesta/commit/7944881796d1b0e3a09a79bbdc9589079e3ff78d))


### Reverts

* undo v0.2.0 release commit — tag deleted, npm publish never happened ([558584e](https://github.com/imsaroj/automatic-octo-fiesta/commit/558584ee030e5efe8548a0af31e222e33b484497))

# @iamsaroj/smart-ui

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
