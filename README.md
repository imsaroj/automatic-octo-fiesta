# Smart Component

**Copy less UI. Ship more product.**

> [!IMPORTANT]
> **Project status: learning project, not actively maintained.**
> I built this to learn and experiment — there is no roadmap, and I don't plan to maintain it long-term. Feel free to
> read it as a reference, or fork/copy anything useful into your own project. Use in production at your own risk.

`@iamsaroj/smart-ui` is a source-first React 19 UI system that turns the product patterns teams rebuild over and over —
forms, data grids, search bars, trees, calendars, rich text — into documented, tested, config-driven building blocks.

Most UI libraries hand you primitives and leave the glue to you. This one ships the higher-level pieces on top of them,
so a form is a schema, a grid is a fetcher, and a page is a set of named slots.

[Why](#why) &middot; [Features](#features) &middot; [Getting started](#getting-started) &middot; [Usage](#usage)
&middot; [Project structure](#project-structure) &middot; [Documentation](#documentation)

---

## Why

| Without Smart Component                                | With Smart Component                   |
| ------------------------------------------------------ | -------------------------------------- |
| Recreate form scaffolding field by field               | Drive `SmartForm` from a Zod schema    |
| Build every dialog, card, and sheet from scratch       | Compose flat `Smart*` wrappers         |
| Rewrite grid wiring, selection, and pagination         | Drop in `@iamsaroj/smart-ui/data-grid` |
| Rebuild search/filter bars for every list page         | Declare `@iamsaroj/smart-ui/search`    |
| Re-implement trees, calendars, transfer lists, editors | Reach for the domain engine            |

The goal is a public API that stays predictable, less glue code, and a codebase that still reads well after the first
week.

## Features

- **Smart wrappers** — flat, config-driven versions of shadcn/ui compound components (`SmartCard`, `SmartDialog`,
  `SmartSheet`, `SmartSelect`, `SmartCombobox`, `SmartStepper`, `SmartToaster`, and more). Each file re-exports the
  underlying primitives, so you can drop back to the compound form whenever the flat API can't express a layout.
- **Action buttons** — 27 ready CRUD/toolbar presets (`AddButton`, `SaveButton`, `DeleteButton`, …) driven by one config
  map, with icon-only mode, tooltips, and optional permission gating.
- **Form engine** — declarative forms on TanStack Form + Zod v4. One schema is the single source of truth for validation
  _and_ required-ness; a `FieldDefinition[]` picks the controls.
- **Data grid** — `SmartGrid` (client-side, quick search + CSV export) and `SmartServerGrid` (infinite/server-side)
  backed by AG Grid, with a reusable Spring `Page<T>` fetch pipeline and cross-page selection.
- **Search engine** — a filter bar that composes the form engine, adding manual and debounced auto-search, empty-value
  pruning, and an active-filter count.
- **Tree, transfer list, and calendar engines** — generic, Set-backed components for hierarchical navigation, dual-list
  shuttles, and month/week/day/agenda scheduling with booking and recurrence.
- **Lexical rich text editor** — a full editor wrapped as a single `SmartTextEditor`, with HTML or JSON value formats.
- **Page layout system** — page chrome expressed as named slots (`SmartPage`) instead of nested `div`s.

All reusable logic is unit-tested with Vitest, checked with strict TypeScript, and demonstrated live in the playground
app.

## Getting started

> [!NOTE]
> This is a **pnpm + Turborepo monorepo**. It has two workspaces: `apps/web` (the Vite + React 19 playground) and
> `packages/ui` (the `@iamsaroj/smart-ui` library, exported directly as source with no build step).

### Prerequisites

- [Node.js](https://nodejs.org) `>= 20`
- [pnpm](https://pnpm.io) `10.33.4`

### Install and run

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts every workspace through Turbo. Open the playground app to browse the public API in real UI, backed by
an [MSW](https://mswjs.io) mock API.

### Common commands

```bash
pnpm build          # Build all packages
pnpm lint           # Lint all workspaces
pnpm typecheck      # Type-check all workspaces
pnpm test           # Vitest (packages/ui)
pnpm test:e2e       # Playwright end-to-end tests
pnpm format         # Prettier
pnpm docs:check     # Verify docs stay aligned with the public surface
pnpm exports:check  # Validate the package exports map
pnpm api:check      # Type-check the public API surface
pnpm publint        # Lint the published package
```

> [!IMPORTANT]
> Commits follow [Conventional Commits](https://www.conventionalcommits.org) and are enforced by commitlint via a Husky
> hook. Husky also runs `lint-staged` on pre-commit and checks on pre-push — don't bypass them with `--no-verify` unless
> asked.

## Usage

Import through the explicit subpath exports declared in [`packages/ui/package.json`](packages/ui/package.json) — never
reach into internal files.

### Schema-driven form

```tsx
import { z } from "zod"
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email().optional().or(z.literal("")),
  subject: z.string().min(1, "Choose a subject"),
  message: z.string().min(10, "Minimum 10 characters"),
})

const fields: FieldDefinition<z.infer<typeof contactSchema>>[] = [
    { name: "name", type: "text", label: "Your name", placeholder: "Ada Lovelace" },
    { name: "email", type: "email", label: "Email" },
    { name: "subject", type: "select", label: "Subject", options: SUBJECT_OPTIONS },
    { name: "message", type: "textarea", label: "Message", rows: 4 },
  ]

  < SmartForm
schema = { contactSchema }
fields = { fields }
submitLabel = "Send message"
onSubmit = {(value)
=>
toast.success(`Thanks, ${value.name}!`)
}
/>
```

### Flat compound wrapper

```tsx
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
;<SmartCard
  header={{
    title: "Orders",
    subtitle: "Latest orders",
    actions: <AddButton />,
  }}
  footer={<Pagination />}
>
  {/* content */}
</SmartCard>
```

### Available entrypoints

```
@iamsaroj/smart-ui/components/*             shadcn/ui primitives (Base UI under the hood)
@iamsaroj/smart-ui/hooks/*                  shared hooks
@iamsaroj/smart-ui/lib/*                    cn(), formatters, xlsx writer
@iamsaroj/smart-ui/smart-components/*       Smart* wrappers
@iamsaroj/smart-ui/smart-components/page    page-layout slots
@iamsaroj/smart-ui/smart-components/buttons action-button presets
@iamsaroj/smart-ui/form             declarative forms
@iamsaroj/smart-ui/search           search/filter bar
@iamsaroj/smart-ui/data-grid               AG Grid wrappers
@iamsaroj/smart-ui/tree             SmartTree
@iamsaroj/smart-ui/transfer-list    SmartTransferList
@iamsaroj/smart-ui/calendar         SmartCalendar
@iamsaroj/smart-ui/text-editor     SmartTextEditor
```

## Project structure

```text
smart-component/
├── apps/web/        Vite + React 19 playground and live demos (MSW mock API)
├── packages/ui/     @iamsaroj/smart-ui — source-only library, exported via subpaths
├── docs/            Consumer guides, ADRs, and docs checks
├── e2e/             Playwright end-to-end tests
├── scripts/         Repo-level verification scripts
└── tooling/         Type-check and validation helpers
```

- **`apps/web`** — the fastest way to understand the intended API. Every public component and engine has a demo page,
  backed by mock data and a TanStack Query CRUD reference recipe.
- **`packages/ui`** — a source-only package with no build step. Everything is exposed through the exports map; internal
  files are not individually importable.

## Documentation

The docs index lives in [`docs/README.md`](docs/README.md), with a guide per engine:

- [Form engine](docs/form.md)
- [Data grid](docs/data-grid.md)
- [Search engine](docs/search.md)
- [Tree engine](docs/tree.md)
- [Transfer list engine](docs/transfer-list.md)
- [Calendar engine](docs/calendar.md)
- [Lexical text editor](docs/text-editor.md)
- [Smart component wrappers](docs/smart-components.md)
- [Component map](docs/component-map.md) &middot; [Security notes](docs/security.md)

Architecture decisions are recorded in [`ARCHITECTURE.md`](ARCHITECTURE.md). If you extend the public surface, keep the
docs and the exports map aligned — `pnpm docs:check` enforces it.
