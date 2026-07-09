---
name: verify
description: Launch and drive the Vite playground to verify @imsaroj/smart-ui changes at the browser surface (AG Grid, Base UI portals, MSW-backed data).
---

# Verify changes in the running playground

The library (`packages/ui`) has no runnable surface of its own — every change
is observed through the demo app `apps/web`.

## Launch

```bash
pnpm --filter web dev --port 5183 --strictPort   # run in background
curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/   # 200 = up
```

Port 5183 matches `playwright.config.ts` (`reuseExistingServer` outside CI).
The app MUST run via `vite dev` — the MSW mock API (`src/mocks/`) only starts
in dev builds; server-grid pages need it.

## Drive

Playwright is installed at the repo root. From a script outside the repo,
require it by absolute path:

```js
const { chromium } = require("D:/smart-component/node_modules/@playwright/test")
```

Routes are listed in `apps/web/src/App.tsx` (`/grids/*`, `/smart/*`,
`/examples/*`, …). Useful selectors:

- AG Grid rows: `.ag-row`, pinned containers:
  `.ag-pinned-left-cols-container` / `.ag-pinned-right-cols-container`,
  cells: `[col-id="name"]`. A row index exists in BOTH the pinned and center
  containers — scope selectors to the container you mean.
- Base UI tooltips: `[data-slot="tooltip-content"]` (NOT `[role="tooltip"]`).
- Confirm dialogs: `[role="alertdialog"]` (portaled to body).
- Toasts (sonner): `[data-sonner-toast]`.

## Gotchas

- Disabled buttons have `pointer-events: none` — Playwright `hover()` times
  out on them; that's the design, not a bug. Hover an enabled instance.
- CSV export: use `page.waitForEvent("download")` around the Export click and
  `download.saveAs(...)` to inspect the file.
- AG Grid stateful ColDef attributes (pinned, width, sort): `undefined` in an
  updated columnDefs means "keep current state" — assert the DOM, not the def.
