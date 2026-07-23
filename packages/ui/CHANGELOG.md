# [5.3.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v5.2.0...v5.3.0) (2026-07-23)


### Bug Fixes

* **dialog:** switch internal imports to relative paths ([18a11dc](https://github.com/imsaroj/automatic-octo-fiesta/commit/18a11dce8ecefbaa5599c9c8d45c398969d71b67))


### Features

* **dialog:** add flexible height configuration for SmartDialog ([2d379af](https://github.com/imsaroj/automatic-octo-fiesta/commit/2d379af10fb9a07f8c3e43deee1f3e262329d05d))

# [5.2.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v5.1.0...v5.2.0) (2026-07-22)


### Features

* **page:** rebuild SmartPageError as a derived failure surface ([2eecb05](https://github.com/imsaroj/automatic-octo-fiesta/commit/2eecb05cf33a0a46203b4d0b128cff0f5ae784be))

# [5.1.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v5.0.0...v5.1.0) (2026-07-22)


### Features

* **form/date:** add full SmartDatePicker support and tests ([67c9823](https://github.com/imsaroj/automatic-octo-fiesta/commit/67c98239cf9a098fc76dd94b9603b4e03b5c5383))
* **form:** enhance field support with new props and native attribute passthrough ([058bc81](https://github.com/imsaroj/automatic-octo-fiesta/commit/058bc813b4a3b9bcc1e2550699b87d2cb30d2f1e))

# [5.0.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v4.3.0...v5.0.0) (2026-07-22)


* refactor(form)!: generate field types from a single FieldTypeExtras map ([e1e21be](https://github.com/imsaroj/automatic-octo-fiesta/commit/e1e21be4af3f4575e0e95222dd7166d4ce6d8725))


### BREAKING CHANGES

* the per-variant interfaces (`TextField`, `SelectField`, …) are
replaced by `FieldTypeExtras` + `FieldVariant<T, K>`; they had no importers
outside the module. Two props are renamed to match their components, which is
what makes them derivable: `slugPrefix` -> `prefix` (slug), `editorFormat` ->
`format` (text-editor).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

# [4.3.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v4.2.0...v4.3.0) (2026-07-22)


### Features

* **data-grid:** replace SmartLoadingOverlay with GridLoadingOverlay ([6f45b12](https://github.com/imsaroj/automatic-octo-fiesta/commit/6f45b12e9d5677da175659e5e79eb3aad9f833dd))

# [4.2.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v4.1.0...v4.2.0) (2026-07-22)


### Features

* introduce layout engine for container-query grids ([068fea9](https://github.com/imsaroj/automatic-octo-fiesta/commit/068fea9631b9d37a9654e72771d910b3d29e524e))
* redesign SmartPageLoading with custom motion and unified design ([b112b68](https://github.com/imsaroj/automatic-octo-fiesta/commit/b112b68ffb9ede447cd8440e254aa34f4f4b3f34))

# [4.1.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v4.0.0...v4.1.0) (2026-07-20)


### Features

* **smart-components:** introduce standardized config-driven footer actions for overlays ([47aa10a](https://github.com/imsaroj/automatic-octo-fiesta/commit/47aa10a8fcf9d9236bc5088ea643c84092d9c837))
* **smart-sheet:** add config-driven footer actions for Cancel and Save buttons ([29279da](https://github.com/imsaroj/automatic-octo-fiesta/commit/29279dababd835f1666b4ec34c4ca35f5972309a))

# [4.0.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v3.0.0...v4.0.0) (2026-07-20)


* refactor!: replace Spring Data Page support with PageResponse ([8323636](https://github.com/imsaroj/automatic-octo-fiesta/commit/8323636d2dd73c7edcd439f67047f6f8ad53792f))


### BREAKING CHANGES

* `pageSchema`/`SPageResponse`/`buildSpringQuery`/`toSpringSort`/
`encodeSpringFilter` are removed and replaced by `pageResponseSchema`/
`PageResponse`/`buildPageQuery`/`toSortParams`/`encodePageFilter`. Responses
must now match the `PageResponse<T>` envelope, not Spring Data's `Page<T>`.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

# [3.0.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v2.0.0...v3.0.0) (2026-07-20)


* refactor!: remove columnFilters and the AG Grid column-filter pipeline ([3071e49](https://github.com/imsaroj/automatic-octo-fiesta/commit/3071e4921520fda6732b7f45265e6b9e786cac20))


### BREAKING CHANGES

* `SmartServerGrid` no longer accepts `columnFilters` or
`floatingFilters`; the grid never renders column header filters. Drive
filtering through the `filters`/`query` props instead.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

# [2.0.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.6.0...v2.0.0) (2026-07-20)


* refactor!: remove v1 compat aliases and normalize file naming ([77f8c78](https://github.com/imsaroj/automatic-octo-fiesta/commit/77f8c78b50eae22c46181bf0ecee26cc1b0425cd))


### BREAKING CHANGES

* `SearchEngine`, the `buildQuery` fetcher option, the
smart-components `SmartCalendar` alias, and the `loading-overlay`/`search-input`/
`spinner` deep-import paths are removed.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

# [1.6.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.5.0...v1.6.0) (2026-07-20)


### Features

* **data-grid:** converge the two grids on a shared shell + column-visibility ([444bd53](https://github.com/imsaroj/automatic-octo-fiesta/commit/444bd53ac1c5b411ef7a5a387a8c548b6c5f04f9))
* **data-grid:** custom actions in the action column ([aed448c](https://github.com/imsaroj/automatic-octo-fiesta/commit/aed448c9ffaa662a2dfb8912cf60e6f8c339dc67))
* **smart-components:** aggregate barrel + naming-drift aliases (I12 c/g) ([54945bc](https://github.com/imsaroj/automatic-octo-fiesta/commit/54945bc3af5d37b7aba56d1695aec388d56a6d67))
* **smart-components:** resource-aware permission gating shared by buttons + grid ([cd7ce70](https://github.com/imsaroj/automatic-octo-fiesta/commit/cd7ce70ab55a3eafb0ea62d11111b3dfe537a55c))

# [1.5.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.4.0...v1.5.0) (2026-07-20)


### Features

* **data-grid:** generalize createPageFetcher into a transport-agnostic adapter ([84a4fbd](https://github.com/imsaroj/automatic-octo-fiesta/commit/84a4fbdf29103772401d697764a95612529fec2e))
* **form:** create/edit modes, initialData seed, and a reset/submit handle ([47583f6](https://github.com/imsaroj/automatic-octo-fiesta/commit/47583f68bf4516c2a31d8a2fef44b231a80af6f4))
* **form:** typed option values + async options for selection fields ([ff8b857](https://github.com/imsaroj/automatic-octo-fiesta/commit/ff8b857144d6c72cca6b2bc5fd4c4999c386dc4a))
* **smart-components:** add optional SmartUIProvider for labels, defaults & formats ([7df5862](https://github.com/imsaroj/automatic-octo-fiesta/commit/7df586278d47af88e287713326a6e7e268c86b23))

# [1.4.0](https://github.com/imsaroj/automatic-octo-fiesta/compare/v1.3.0...v1.4.0) (2026-07-20)


### Bug Fixes

* **page:** never drop loose SmartPage children; add explicit slot prop ([f776c99](https://github.com/imsaroj/automatic-octo-fiesta/commit/f776c995dc4994078d51ee26e4fb093c27d85b8a))
* **smart-components:** absorb the overlay open race in Smart overlays ([024cacf](https://github.com/imsaroj/automatic-octo-fiesta/commit/024cacf33407538dab98e5a8d0a82a52e878b34d))
* **ui:** make globals.css consumer-correct and declare sideEffects ([efe5807](https://github.com/imsaroj/automatic-octo-fiesta/commit/efe5807e8c7177fd367840444f107acb3fc21298))
* **web:** resolve bare font url() specifiers from the app CSS entry ([4898740](https://github.com/imsaroj/automatic-octo-fiesta/commit/48987403844755c2ce380c884cf9f02be10800a1))


### Features

* **ui:** accept plain search queries on SmartServerGrid via query prop ([54d3c6f](https://github.com/imsaroj/automatic-octo-fiesta/commit/54d3c6fcf5ce7a13af47656ffd6062e85af58548))

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
