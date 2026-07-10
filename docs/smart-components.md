# Smart components — `@iamsaroj/smart-ui/smart-components/*`

## What it is

The **`Smart*` wrapper** layer: shadcn/ui compound components flattened into a
single config-driven component, to cut JSX boilerplate. Covers `SmartCard`,
`SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartSelect`, `SmartCombobox`,
`SmartMultiSelect`, `SmartDatePicker`, `SmartStepper`, `SmartToaster`, and utility
primitives (`SmartSearchInput`, `SmartLoadingOverlay`, `SmartSpinner`,
`SmartStatCard`).

## Import

```ts
import { SmartDialog } from "@iamsaroj/smart-ui/smart-components/smart-dialog"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
```

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

Extend by adding a config entry + one `createActionButton` line. Optional
permission gating via `ActionPermissionProvider`.

## SmartPage slots — `@iamsaroj/smart-ui/smart-components/page`

`SmartPage` is a compound **page-layout system** that arranges named slots
(header, hero, toolbar, search, filters, tabs, content, sidebar, grid area, status
bar, footer, and empty/loading/error states) through `PageContext`. This is the
**sanctioned exception** to the flat-props philosophy (see
[adr/0005](./adr/0005-flat-props-smart-wrappers-over-compound.md)).

## Placement rule

General-purpose components go in `smart-components/`; feature-scoped ones go in
their domain folder (`data-grid/`, `form/`, `text-editor/`).

## Demo

`/smart/*` (forms, pickers, overlays, feedback, buttons), `/page-example/*`.
