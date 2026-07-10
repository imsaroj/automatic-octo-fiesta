# Component → demo route map

Every exported engine and `Smart*` component, its import path, the `apps/web`
route that demos it, and its guide. Derived from the `exports` map in
`packages/ui/package.json` and the routes in `apps/web/src/App.tsx`.

## Engines

| Component           | Import                             | Demo route                            | Doc                                 |
| ------------------- | ---------------------------------- | ------------------------------------- | ----------------------------------- |
| `SmartForm`         | `@iamsaroj/smart-ui/form`          | `/form/basic`, `/form/all-fields`     | [form](./form.md)                   |
| `SmartSearchForm`   | `@iamsaroj/smart-ui/search`        | `/grids/server`                       | [search](./search.md)               |
| `SmartGrid`         | `@iamsaroj/smart-ui/data-grid`     | `/grids/simple`                       | [data-grid](./data-grid.md)         |
| `SmartServerGrid`   | `@iamsaroj/smart-ui/data-grid`     | `/grids/server`, `/grids/infinite`    | [data-grid](./data-grid.md)         |
| `SmartTree`         | `@iamsaroj/smart-ui/tree`          | `/smart/tree`, `/smart/tree-explorer` | [tree](./tree.md)                   |
| `SmartTransferList` | `@iamsaroj/smart-ui/transfer-list` | `/smart/transfer-list`                | [transfer-list](./transfer-list.md) |
| `SmartCalendar`     | `@iamsaroj/smart-ui/calendar`      | `/smart/calendar`                     | [calendar](./calendar.md)           |
| `SmartTextEditor`   | `@iamsaroj/smart-ui/text-editor`   | `/smart/text-editor`                  | [text-editor](./text-editor.md)     |

## Smart components

| Component(s)                                                                                                                                   | Import                                        | Demo route                               | Doc                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| `SmartPage` + slots                                                                                                                            | `@iamsaroj/smart-ui/smart-components/page`    | `/page-example/*`                        | [smart-components](./smart-components.md) |
| Action buttons (`AddButton`, `SaveButton`, …)                                                                                                  | `@iamsaroj/smart-ui/smart-components/buttons` | `/smart/buttons`                         | [smart-components](./smart-components.md) |
| `SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartConfirmDialog`                                                                               | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/overlays`                        | [smart-components](./smart-components.md) |
| `SmartSelect`, `SmartCombobox`, `SmartMultiSelect`, `SmartNativeSelect`, `SmartSegmented`                                                      | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/pickers`, `/smart/forms`         | [smart-components](./smart-components.md) |
| `SmartDatePicker`, `SmartDateRangePicker`, `SmartTimePicker`, `SmartTimeRangePicker`, `SmartMonthPicker`, `SmartYearPicker`                    | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/pickers`                         | [smart-components](./smart-components.md) |
| `SmartInput`, `SmartTextarea`, `SmartPasswordInput`, `SmartCheckbox`, `SmartCheckboxGroup`, `SmartRadioGroup`, `SmartSwitch`                   | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/forms`                           | [smart-components](./smart-components.md) |
| `SmartCard`, `SmartStepper`, `SmartStatCard`, `SmartBadge`, `SmartAvatar`, `SmartAlert`, `SmartAccordion`, `SmartBreadcrumb`, `SmartSeparator` | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/feedback`, `/examples/dashboard` | [smart-components](./smart-components.md) |
| `SmartToaster`, `SmartSpinner`, `SmartLoadingOverlay`, `SmartSearchInput`                                                                      | `@iamsaroj/smart-ui/smart-components/smart-*` | `/smart/feedback`                        | [smart-components](./smart-components.md) |

## No dedicated demo route (follow-up candidates)

These are exported and documented in aggregate but lack a standalone showcase; a
future demo page would improve discoverability:

- `SmartContextMenu` (`smart-context-menu`) — no dedicated route.
- `SmartField`, `SmartLabel`, `SmartInputGroup` — low-level building blocks used
  inside other wrappers; demoed only indirectly.
- `SmartNavSidebar` (`smart-nav-sidebar`) — used by the shell, not showcased on a
  page.
