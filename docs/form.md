# Form engine — `@iamsaroj/smart-ui/form`

## What it is

Declarative forms built on **TanStack Form + Zod v4**. You give `SmartForm` a Zod
`schema` and a `FieldDefinition[]`; it renders the right `Smart*Field` control per
entry, validates against the schema, derives required-ness from the schema, and
manages state — no per-field wiring.

## Import

```ts
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"
import { z } from "zod"
```

## 80% example

```tsx
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string(),
  active: z.boolean(),
})
type Values = z.infer<typeof schema>

const fields: FieldDefinition<Values>[] = [
  { name: "name", type: "text", label: "Name", placeholder: "Ada Lovelace" },
  { name: "email", type: "email", label: "Email" },
  { name: "role", type: "select", label: "Role", options: ROLE_OPTIONS },
  { name: "active", type: "checkbox", label: "Active" },
]

<SmartForm
  schema={schema}
  fields={fields}
  columns={2}
  submitLabel="Save"
  onSubmit={(values) => console.log(values)}
/>
```

## Key props

| Prop             | Type                   | Notes                                                 |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| `schema`         | `z.ZodType`            | **Single source of truth** for validation + required. |
| `fields`         | `FieldDefinition<T>[]` | UI-only; `type` selects the control (discriminated).  |
| `data`/`setData` | `T` / `(v: T) => void` | Optional — the form owns state and mirrors edits out. |
| `columns`        | `1 \| 2 \| 3 \| 4`     | Responsive grid.                                      |
| `submitLabel`    | `string`               | Submit button text.                                   |
| `onSubmit`       | `(values: T) => void`  | Fires only when the schema passes.                    |

`FieldType` is a large discriminated union (`text`/`email`/`currency`/`select`/
`multiselect`/`date`/`daterange`/`checkbox`/`switch`/`radio`/`slider`/`rating`/
`textarea`/`text-editor`/…). Each field keeps only the extras valid for its type.

## Typed & async options

Option-based fields (`select` / `combobox` / `multiselect` / `radio` /
`segmented` / `checkbox-group`) accept **typed** option values and **async**
resolvers:

```tsx
// Typed values — the schema stays honest, no String()/Number() at the boundary:
const schema = z.object({ roleId: z.number({ error: "Choose a role" }) })

// Async options — a resolver receives an AbortSignal; the control shows a
// loading placeholder until it settles, then filters the loaded set:
const fields: FieldDefinition<z.infer<typeof schema>>[] = [
  {
    name: "roleId",
    type: "select",
    label: "Role",
    options: ({ signal }) =>
      fetchRoles(signal).then(
        (rs) => rs.map((r) => ({ value: r.id, label: r.name })) // value: number
      ),
  },
]
```

The form store keeps the **real** value (`roleId` is a `number`); the option's
value is serialized to a string key only for the DOM control. `options` is either
a `FieldOption<V>[]` (`V extends string | number | boolean`) or an async
`(ctx: { search?; signal }) => Promise<FieldOption<V>[]>`. The library never
imports a fetch client — the resolver is yours. (Live server-side search wiring is
a forward-compatible extension; today the resolver runs once and the control
filters client-side.)

## Create / edit modes

One schema and one field list serve both create and edit — no `pick`/`extend`
schema hack, no `key={id}` remount:

```tsx
const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(8), // create-only
})

const fields: FieldDefinition<z.infer<typeof schema>>[] = [
  { name: "username", type: "text", label: "Username" },
  { name: "password", type: "password", label: "Password", modes: ["create"] },
]

const ref = useRef<SmartFormHandle<Form>>(null)

<SmartForm
  ref={ref}
  schema={schema}
  fields={fields}
  mode={editing ? "edit" : "create"}
  initialData={editing ?? undefined}
/>

// Load a different record without remounting:
ref.current?.reset(nextRow)
```

- **`modes`** on a field limits it to the listed modes. In any other mode it's
  dropped from **render and validation** (and from the submitted value), so the
  base schema can keep `password` required and edit mode simply won't enforce it.
- **`initialData`** seeds an uncontrolled form once (unlike `data`, it isn't
  mirrored). **`ref.reset(values?)`** re-initializes to `values` (or the seed),
  clearing errors/touched — the explicit alternative to `key={id}`.
- Mode scoping needs a plain `ZodObject` schema (uses `.omit`). A schema wrapped
  in `.refine`/`.superRefine` can't be scoped — make mode-only fields
  `.optional()` there, and note cross-field refinements see the excluded fields'
  raw store values.

## Escape hatches

- **Required asterisk** is derived from the schema (`isFieldRequired`) — don't set
  it manually; make the field optional in Zod (`.optional()`) to drop it.
- **Hidden fields**: a field's `hidden(values)` predicate excludes it from both
  render and validation.
- **Custom field types**: extend the `FieldType` union + the field registry
  (`fields` registry map) and pass your own via the `registry` prop.
- Every `Smart*Field` (`SmartInputField`, …) is exported for standalone use with
  the `data`/`setData` contract (`FieldBaseProps<T>`).

## Gotchas

- Inputs use `data`/`setData`, **not** `value`/`onChange` — this is the library
  convention (`FieldBaseProps<T>`).
- Empty optional strings are normalized to `undefined` before validation so blank
  optional fields don't error.
- The mirror-out / reconcile-in sync effects use a `selfUpdateRef` guard to avoid
  an echo loop — read those comments before touching state logic.

## Demo

`/form/basic`, `/form/all-fields`, `/form/dynamic`.
