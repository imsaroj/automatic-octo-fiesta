# Smart components — `@iamsaroj/smart-ui/smart-components/*`

## What it is

The **`Smart*` wrapper** layer: shadcn/ui compound components flattened into a
single config-driven component, to cut JSX boilerplate. Covers `SmartCard`,
`SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartSelect`, `SmartCombobox`,
`SmartMultiSelect`, `SmartDatePicker`, `SmartStepper`, `SmartToaster`, and utility
primitives (`SmartSearchInput`, `SmartLoadingOverlay`, `SmartSpinner`,
`SmartStatCard`).

## Import

Two equivalent styles — use whichever reads better:

```ts
// Aggregate barrel — one import for many facades (tree-shaken, so unused
// components add nothing to the bundle):
import { SmartDialog, SmartCard } from "@iamsaroj/smart-ui/smart-components"

// Per-component deep path — unchanged, still valid:
import { SmartDialog } from "@iamsaroj/smart-ui/smart-components/smart-dialog"
```

The `page`, `buttons` and `provider` entrypoints are re-exported from the barrel
too, so a screen can pull `SmartPage`, `AddButton` and `SmartCard` from one line.

### Naming notes

- **`SmartDatePickerCalendar`** is the inline date-picker calendar — distinct
  from the **event** calendar exported as `SmartCalendar` from
  `@iamsaroj/smart-ui/calendar`.

## The flat-props ↔ compound escape-hatch pattern

Each wrapper flattens the 80% case into props (`trigger` / `header` / `footer` /
`children`), **and re-exports the underlying native primitives** so you can drop
back to the compound form for layouts the flat API can't express:

<!-- prettier-ignore -->
{% raw %}

```tsx
// Flat (80% case):
;<SmartDialog trigger={<Button>Edit</Button>} header={{ title: "Edit user" }}>
  <UserForm />
</SmartDialog>

// Compound escape hatch (re-exported from the same file):
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@iamsaroj/smart-ui/smart-components/smart-dialog"
```

{% endraw %}

There is a `shadcn-smart-wrappers` skill that converts native compound usage into
these wrappers — prefer `Smart*` when writing TSX in this repo.

## Field/value convention

Input-like Smart components are controlled through a `data` / `setData(value)`
pair (not `value`/`onChange`) — see `FieldBaseProps<T>`. The form engine relies on
this.

## Buttons preset system — `@iamsaroj/smart-ui/smart-components/buttons`

One `ACTION_BUTTON_CONFIG` map is the single source of truth for each action's
icon, label, variant, loading text, and type; `createActionButton` stamps out 27
named presets (`AddButton`, `DeleteButton`, `SaveButton`, …). Prefer these over
hand-configured `SmartButton`s for standard CRUD/toolbar actions.

```tsx
import { AddButton, SaveButton } from "@iamsaroj/smart-ui/smart-components/buttons"

<AddButton onClick={openCreate} />
<SaveButton loading={isSaving} />
```

Extend by adding a config entry + one `createActionButton` line.

### Permission gating

One optional `ActionPermissionProvider` gates everything underneath from a single
checker — `ActionButton`s, the grid action column, and the `<Can>` gate all read
it. The checker is `(action, context?) => boolean`; the `context` is whatever the
call site scopes to (the grid passes the **row**), and it's typed `unknown` so the
library never couples to an RBAC model. No provider → nothing is gated.

```tsx
import {
  ActionPermissionProvider,
  Can,
} from "@iamsaroj/smart-ui/smart-components/buttons"

<ActionPermissionProvider can={(action, row) => menuFlags[action] ?? false}>
  {/* Hidden unless can("add") passes: */}
  <Can action="add">
    <AddButton onClick={openCreate} />
  </Can>
  {/* The grid action column consults can("edit"/"delete", row) automatically. */}
  <SmartServerGrid … actionColumn={{ actions: { edit: {…}, delete: {…} } }} />
</ActionPermissionProvider>
```

- **`<Can action context? fallback?>`** renders its children only when the check
  passes (the gate the front used to hand-roll).
- **`useActionPermission()`** returns the nearest checker (or `null`) for custom
  gating.
- A per-`ActionButton` `permission` prop still overrides the provider; on the grid
  an explicit `visible` still wins, and `actionColumn.permissionAware: false` opts
  one grid out entirely.

## SmartPage slots — `@iamsaroj/smart-ui/smart-components/page`

`SmartPage` is a compound **page-layout system** that arranges named slots
(header, hero, toolbar, search, filters, tabs, content, sidebar, grid area, status
bar, footer, and empty/loading/error states) through `PageContext`. This is the
**sanctioned exception** to the flat-props philosophy (see
[adr/0005](./adr/0005-flat-props-smart-wrappers-over-compound.md)).

## Global config — `@iamsaroj/smart-ui/smart-components/provider`

`SmartUIProvider` is one optional context for app-wide **labels** (i18n),
**defaults** (per-instance prop fallbacks), and **formats** (date/number hooks).
Mount it once near the root; with no provider, components behave exactly as
before (English strings + canonical defaults), so it is purely additive. A
component prop always wins over a provider default; nested providers compose
(a child deep-merges over its parent).

```tsx
import { SmartUIProvider } from "@iamsaroj/smart-ui/smart-components/provider"
;<SmartUIProvider
  labels={{
    confirm: { confirm: "삭제", cancel: "취소" },
    grid: { retry: "다시 시도", selected: (n) => `${n}개 선택됨` },
    search: { search: "검색", reset: "초기화" },
  }}
  defaults={{
    grid: { pageSize: 50, density: "compact" },
    form: { columns: 2 },
  }}
>
  <App />
</SmartUIProvider>
```

Labels are grouped and typed (`grid`, `search`, `confirm`, `form`); override any
subset. Read them anywhere with `useSmartUILabels()`; read defaults/formats with
`useSmartUIDefaults()` / `useSmartUIFormats()`. The label map is the public i18n
surface — the highest-traffic strings (grid, search, confirm, form) read from it
today, with the remaining built-in strings migrating onto the same keys.

## Placement rule

General-purpose components go in `smart-components/`; feature-scoped ones go in
their domain folder (`data-grid/`, `form/`, `text-editor/`).

## Demo

`/smart/*` (forms, pickers, overlays, feedback, buttons), `/page-example/*`.
