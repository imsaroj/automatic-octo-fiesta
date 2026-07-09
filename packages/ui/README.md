# @iamsaroj/smart-ui

Config-driven React 19 component library: `Smart*` shadcn/ui wrappers, a declarative form engine
(TanStack Form + Zod v4), a search/filter bar, AG Grid data grids (client + server row models),
tree / transfer-list / calendar engines, and a Lexical rich-text editor.

Source, demos, and full docs: <https://github.com/imsaroj/automatic-octo-fiesta>

## Install

```bash
pnpm add @iamsaroj/smart-ui react react-dom
```

Requires **React 19** (peer dependency) and **Tailwind CSS v4** in the consuming app.

## Setup

Import the stylesheet once at your app entry, and tell Tailwind to scan the package for classes:

```css
/* your app's global CSS */
@import "tailwindcss";
@import "@iamsaroj/smart-ui/globals.css";
@source "../node_modules/@iamsaroj/smart-ui";
```

(Adjust the `@source` path so it points at the installed package from your CSS file's location.)

## Usage

Import via the export subpaths — internal files are not individually importable:

```tsx
import { Button } from "@iamsaroj/smart-ui/components/button"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartForm } from "@iamsaroj/smart-ui/form-engine"
import { SmartGrid, SmartServerGrid } from "@iamsaroj/smart-ui/data-grid"
import { SmartTree } from "@iamsaroj/smart-ui/tree-engine"
import { SmartCalendar } from "@iamsaroj/smart-ui/calendar-engine"
import { SmartTextEditor } from "@iamsaroj/smart-ui/lexical-text-editor"
```

See the [docs folder](https://github.com/imsaroj/automatic-octo-fiesta/tree/main/docs) for a guide
per entrypoint and the `apps/web` playground for working recipes.

## License

MIT
