# Smart Component

### _A story about all the code you're never going to write again._

---

## Chapter 1 — The form that ate an afternoon

You know this story, because you've lived it.

The ticket says: **"Add a contact form. Name, email, subject, message. Validate it."**
Easy, right? Twenty minutes, tops.

So you open a new file and start typing the "proper" way — TanStack Form, shadcn/ui,
Zod, all the good tools:

```tsx
// The "before" — raw TanStack Form + shadcn/ui, one field at a time
const form = useForm({
  defaultValues: { name: "", email: "", subject: "", message: "" },
  validators: { onChange: contactSchema },
  onSubmit: async ({ value }) => { /* ... */ },
})

return (
  <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
    <form.Field name="name">
      {(field) => (
        <div className="grid gap-2">
          <Label htmlFor={field.name}>
            Your name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            aria-invalid={field.state.meta.errors.length > 0}
          />
          {field.state.meta.errors.length > 0 && (
            <p className="text-sm text-destructive">
              {field.state.meta.errors[0]?.message}
            </p>
          )}
        </div>
      )}
    </form.Field>

    <form.Field name="email">
      {(field) => (
        /* ...the same 15 lines again... */
      )}
    </form.Field>

    <form.Field name="subject">
      {(field) => (
        /* ...the same 15 lines, except now it's a Select,
           so it's actually 25 lines... */
      )}
    </form.Field>

    <form.Field name="message">
      {(field) => (
        /* ...you get the idea... */
      )}
    </form.Field>

    <Button type="submit">Send message</Button>
  </form>
)
```

Four fields. **~120 lines.** Every field re-declares the same Label, the same error
paragraph, the same `aria-invalid`, the same `handleBlur`/`handleChange` dance. You wrote
the required asterisk by hand — and it's already lying, because the schema says `email`
is optional and the JSX says it isn't.

And tomorrow the ticket says _"add a date picker and a rich-text field"_, and you get to
do it all again.

## Chapter 2 — The same form, in this repo

Here's that exact ticket with `@workspace/ui/form-engine`. This is not pseudocode — it's
lifted from the [live demo page](apps/web/src/pages/form-engine/basic-form-page.tsx):

```tsx
import { z } from "zod"
import { SmartForm, type FieldDefinition } from "@workspace/ui/form-engine"

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

<SmartForm
  schema={contactSchema}
  fields={fields}
  submitLabel="Send message"
  onSubmit={(value) => toast.success(`Thanks, ${value.name}!`)}
/>
```

**~25 lines.** Same TanStack Form underneath, same Zod validation, same shadcn/ui inputs.
But now:

- The **Zod schema is the single source of truth** — validation _and_ the required
  asterisk are derived from it. The schema can never disagree with the UI, because the UI
  is generated from the schema.
- Labels, inline errors, `aria-invalid`, blur handling, layout columns — all handled once,
  in one place, instead of copy-pasted per field.
- Need a currency input, a date range, a multiselect, or a full **rich-text editor** as a
  field? Change one word: `type: "text-editor"`. That's the whole diff.

The afternoon is yours again.

## Chapter 3 — Death by a thousand `<CardHeader>`s

Forms were the dramatic case. But the paper cuts add up too.

shadcn/ui is wonderful — and it's a _compound-component_ library. A card is five
components. A dialog is seven. You assemble them like furniture, every single time:

```tsx
// Before — 13 lines of scaffolding for one card
<Card>
  <CardHeader>
    <CardTitle>Orders</CardTitle>
    <CardDescription>Latest orders</CardDescription>
    <CardAction>
      <Button>Add</Button>
    </CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>
    <Pagination />
  </CardFooter>
</Card>
```

```tsx
// After — the same card, as one component and one prop
<SmartCard
  header={{
    title: "Orders",
    subtitle: "Latest orders",
    actions: <Button>Add</Button>,
  }}
  footer={<Pagination />}
>
  …
</SmartCard>
```

Now multiply that by every `Dialog`, `Sheet`, `Drawer`, `Select`, `Combobox`,
`DatePicker`, `Stepper`, and toast in your app. That's the **`Smart*` wrapper layer**:
one flat, config-driven component per shadcn compound, with the boilerplate folded in.

And when the flat API genuinely can't express your layout? Every wrapper file
**re-exports the native primitives**, so you drop back down to compound mode for that one
card — no lock-in, no fork.

Even buttons got the treatment: 27 action presets (`<AddButton />`, `<DeleteButton />`,
`<SaveButton loading />`…) share one config map for icon, label, variant, and loading
text — so your toolbars stop debating which icon "Delete" uses this week.

## Chapter 4 — The big machines

Some things are too big to be a wrapper, so they became **engines** — each one a single
component with a declarative config, backed by a serious library and a pile of unit
tests:

| Engine            | Import                                | What it replaces                                                                                                                                                                                                        |
| ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data grid**     | `@workspace/ui/data-grid`             | Hand-rolled AG Grid setup. `SmartGrid` (client-side, quick search + CSV baked in) and `SmartServerGrid` (infinite row model — you write one `fetchRows` function, it does the rest, Spring `Page<T>` decoding included) |
| **Form engine**   | `@workspace/ui/form-engine`           | Chapter 1. You were there.                                                                                                                                                                                              |
| **Search engine** | `@workspace/ui/search-engine`         | The filter bar above every list page — composes the form engine, adds debounced auto-search, empty-value pruning, and an active-filter count                                                                            |
| **Calendar**      | `@workspace/ui/calendar-engine`       | Month/week/day/agenda views, drag-to-move, edge-resize, recurring events (RRULE subset with "this / this-and-following / all" editing), and slot booking from availability windows                                      |
| **Tree**          | `@workspace/ui/tree-engine`           | File explorers: tri-state checkboxes, lazy loading, inline rename, drag-and-drop, keyboard nav                                                                                                                          |
| **Transfer list** | `@workspace/ui/transfer-list-engine`  | The dual-list "shuttle" every admin screen eventually needs                                                                                                                                                             |
| **Rich text**     | `@workspace/ui/lexical-text-editor`   | A full Lexical editor (toolbar, images, code highlight, HTML/JSON value) as one `<SmartTextEditor />`                                                                                                                   |
| **Page layout**   | `@workspace/ui/smart-components/page` | The header/toolbar/filters/content/status-bar chrome of a page, as named slots instead of a div pyramid                                                                                                                 |

A full data table — sorting, pagination, quick search, column picker, CSV export — looks
like this:

```tsx
<SmartGrid
  title="Accounts"
  rows={accounts}
  columns={columns}
  selection="single"
  onSelectionChange={(rows) => setSelected(rows[0] ?? null)}
/>
```

That's the whole component. AG Grid Community is doing the heavy lifting; you just never
have to look at it.

## Chapter 5 — The part where it stays maintainable

A shortcut that rots is worse than no shortcut. So the boring engineering is here too:

- **React 19 + strict TypeScript**, everything generic where it matters
  (`TreeNode<T>`, `CalendarEvent<T>`, `SmartServerGrid<Row>`).
- **Tailwind v4 + Base UI** (`@base-ui/react`) under shadcn v4-style components.
- **Shipped as source** — no build step, no `dist/` mystery. You can read (and step
  through) every component you use.
- **Unit-tested cores** — the tree algorithms, calendar date math, recurrence expansion,
  booking slots, transfer moves, and pagination encoding are pure functions with Vitest
  suites, and CI enforces coverage thresholds so it can't silently regress.
- **One convention everywhere:** input-like components are controlled via
  `data` / `setData` — which is exactly why the form engine can drive any of them.
- A **playground app** (`apps/web`) with a demo page for every component, backed by an
  MSW mock API — so every pattern above has a working reference you can copy from.

## Epilogue — Try it

```bash
pnpm install     # Node >= 20, pnpm 10
pnpm dev         # opens the playground — browse every component live
```

```bash
pnpm build       # build all packages
pnpm lint        # ESLint (incl. jsx-a11y)
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest (packages/ui)
pnpm format      # Prettier
```

### The map

```
smart-component/
├── apps/web/                    # Vite playground — a demo page per component
└── packages/ui/                 # @workspace/ui — the library (source-only)
    └── src/
        ├── components/          # shadcn/ui primitives (Base UI)
        ├── smart-components/    # Smart* wrappers, buttons, page layout
        ├── form-engine/         # SmartForm (TanStack Form + Zod)
        ├── search-engine/       # SmartSearchForm
        ├── data-grid/           # SmartGrid / SmartServerGrid (AG Grid)
        ├── calendar-engine/     # SmartCalendar
        ├── tree-engine/         # SmartTree
        ├── transfer-list-engine/# SmartTransferList
        └── lexical-text-editor/ # SmartTextEditor (Lexical)
```

Import only through the subpaths declared in `packages/ui/package.json` `exports`
(`@workspace/ui/form-engine`, `@workspace/ui/data-grid`, …) — the engine internals are
deliberately not importable.

Per-domain consumer guides, the architecture decision records, and a component → demo
route map live in [`docs/`](./docs/README.md) (form engine, data grid, search, tree,
transfer list, calendar, smart components, rich-text editor).

Adding a new shadcn primitive:

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web   # lands in packages/ui/src/components/
```

### House rules

- **Conventional Commits** (`feat:`, `fix:`, …) enforced by commitlint + Husky;
  `pre-commit` runs lint-staged, `pre-push` runs the checks. Don't `--no-verify`.
- App code imports `Smart*` wrappers, not raw primitives (ESLint-enforced).
- General-purpose components go in `smart-components/`; domain-specific ones live in
  their engine's folder.

> Deeper internals — every engine's design notes — live in [`CLAUDE.md`](./CLAUDE.md).

---

_You came here to build features. The scaffolding is already written._
