# Form engine — `@imsaroj/smart-ui/form-engine`

## What it is

Declarative forms built on **TanStack Form + Zod v4**. You give `SmartForm` a Zod
`schema` and a `FieldDefinition[]`; it renders the right `Smart*Field` control per
entry, validates against the schema, derives required-ness from the schema, and
manages state — no per-field wiring.

## Import

```ts
import { SmartForm, type FieldDefinition } from "@imsaroj/smart-ui/form-engine"
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

`/form-engine/basic`, `/form-engine/all-fields`, `/form-engine/dynamic`.
