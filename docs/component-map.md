# Component → demo route map

Every exported engine and `Smart*` component, its import path, the `apps/web`
route that demos it, and its guide. Derived from the `exports` map in
`packages/ui/package.json` and the routes in `apps/web/src/App.tsx`.

## Engines

| Component           | Import                               | Demo route                                      | Doc                                               |
| ------------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| `SmartForm`         | `@workspace/ui/form-engine`          | `/form-engine/basic`, `/form-engine/all-fields` | [form-engine](./form-engine.md)                   |
| `SmartSearchForm`   | `@workspace/ui/search-engine`        | `/grids/server`                                 | [search-engine](./search-engine.md)               |
| `SmartGrid`         | `@workspace/ui/data-grid`            | `/grids/simple`                                 | [data-grid](./data-grid.md)                       |
| `SmartServerGrid`   | `@workspace/ui/data-grid`            | `/grids/server`, `/grids/infinite`              | [data-grid](./data-grid.md)                       |
| `SmartTree`         | `@workspace/ui/tree-engine`          | `/smart/tree`, `/smart/tree-explorer`           | [tree-engine](./tree-engine.md)                   |
| `SmartTransferList` | `@workspace/ui/transfer-list-engine` | `/smart/transfer-list`                          | [transfer-list-engine](./transfer-list-engine.md) |
| `SmartCalendar`     | `@workspace/ui/calendar-engine`      | `/smart/calendar`                               | [calendar-engine](./calendar-engine.md)           |
| `SmartTextEditor`   | `@workspace/ui/lexical-text-editor`  | `/smart/text-editor`                            | [lexical-text-editor](./lexical-text-editor.md)   |

## Smart components

| Component(s)                                                                                                                                   | Import                                   | Demo route                               | Doc                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| `SmartPage` + slots                                                                                                                            | `@workspace/ui/smart-components/page`    | `/page-example/*`                        | [smart-components](./smart-components.md) |
| Action buttons (`AddButton`, `SaveButton`, …)                                                                                                  | `@workspace/ui/smart-components/buttons` | `/smart/buttons`                         | [smart-components](./smart-components.md) |
| `SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartConfirmDialog`                                                                               | `@workspace/ui/smart-components/smart-*` | `/smart/overlays`                        | [smart-components](./smart-components.md) |
| `SmartSelect`, `SmartCombobox`, `SmartMultiSelect`, `SmartNativeSelect`, `SmartSegmented`                                                      | `@workspace/ui/smart-components/smart-*` | `/smart/pickers`, `/smart/forms`         | [smart-components](./smart-components.md) |
| `SmartDatePicker`, `SmartDateRangePicker`, `SmartTimePicker`, `SmartTimeRangePicker`, `SmartMonthPicker`, `SmartYearPicker`                    | `@workspace/ui/smart-components/smart-*` | `/smart/pickers`                         | [smart-components](./smart-components.md) |
| `SmartInput`, `SmartTextarea`, `SmartPasswordInput`, `SmartCheckbox`, `SmartCheckboxGroup`, `SmartRadioGroup`, `SmartSwitch`                   | `@workspace/ui/smart-components/smart-*` | `/smart/forms`                           | [smart-components](./smart-components.md) |
| `SmartCard`, `SmartStepper`, `SmartStatCard`, `SmartBadge`, `SmartAvatar`, `SmartAlert`, `SmartAccordion`, `SmartBreadcrumb`, `SmartSeparator` | `@workspace/ui/smart-components/smart-*` | `/smart/feedback`, `/examples/dashboard` | [smart-components](./smart-components.md) |
| `SmartToaster`, `SmartSpinner`, `SmartLoadingOverlay`, `SmartSearchInput`                                                                      | `@workspace/ui/smart-components/smart-*` | `/smart/feedback`                        | [smart-components](./smart-components.md) |

## No dedicated demo route (follow-up candidates)

These are exported and documented in aggregate but lack a standalone showcase; a
future demo page would improve discoverability:

- `SmartContextMenu` (`smart-context-menu`) — no dedicated route.
- `SmartField`, `SmartLabel`, `SmartInputGroup` — low-level building blocks used
  inside other wrappers; demoed only indirectly.
- `SmartNavSidebar` (`smart-nav-sidebar`) — used by the shell, not showcased on a
  page.
