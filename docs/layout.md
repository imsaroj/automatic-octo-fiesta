# Layout engine — `@iamsaroj/smart-ui/layout`

## What it is

The grid system behind `SmartForm`, `SmartSearchForm`, and any layout you build
yourself. Three decisions define it:

- **Runtime values, not compiled classes.** Column counts and spans travel as CSS
  custom properties, so 12, 16, or 37 columns all work. Tailwind only emits
  classes it can see in source, which is why `grid-cols-*` / `col-span-*` can
  never express a count chosen at runtime.
- **Container queries, not media queries.** A layout reacts to the width it was
  _given_, so the same form is correct in a page body, a 420px drawer, a split
  pane, and a dialog. There is deliberately no viewport mode.
- **Spans clamp to the column count.** `span: 6` on a `{ base: 1, md: 12 }` grid
  is half a row on a wide container and a full row on a narrow one — one
  declaration, no per-field breakpoints, and no cell can overflow its grid.

Requires `@iamsaroj/smart-ui/globals.css` (it pulls in `layout.css`).

## Import

```ts
import {
  SmartGridLayout,
  SmartGridItem,
  LAYOUT_PRESETS,
} from "@iamsaroj/smart-ui/layout"
```

## 80% example

```tsx
<SmartGridLayout columns={{ base: 1, md: 12 }} gap="lg">
  <SmartGridItem span="full">…</SmartGridItem>
  <SmartGridItem span="1/2">…</SmartGridItem>
  <SmartGridItem span="1/2">…</SmartGridItem>
  <SmartGridItem span={4}>…</SmartGridItem>
  <SmartGridItem span={8}>…</SmartGridItem>
</SmartGridLayout>
```

## Columns

`columns` accepts four notations, each of them responsive:

| Value                           | Meaning                                  |
| ------------------------------- | ---------------------------------------- |
| `12`                            | 12 equal tracks                          |
| `[1, 3]`                        | two proportional tracks — 25% / 75%      |
| `["18rem", "1fr"]`              | a fixed rail plus a flexible column      |
| `{ auto: "fit", min: "16rem" }` | as many ≥16rem tracks as fit, re-flowing |
| `"repeat(3, 1fr) 2fr"`          | raw `grid-template-columns` escape hatch |

Wrap any of them in a breakpoint map to change it by container width:

```tsx
columns={{ base: 1, sm: 2, md: 12 }}
```

## Spans

| Value            | Meaning                                                     |
| ---------------- | ----------------------------------------------------------- |
| `6`              | 6 tracks, clamped to the column count so it never overflows |
| `"full"`         | edge to edge, whatever the column count                     |
| `"1/2"`, `"2/3"` | a fraction of the grid — no column-count math to do         |
| `"25%"`          | the same idea as a percentage                               |
| `"auto"`         | one track (the default)                                     |

Fractions and percentages need a knowable track count; against a raw template or
`{ auto }` tracks they fall back to `"auto"`.

Alongside `span`, every cell takes `colStart`, `rowSpan`, `order`, and `newRow`
(shorthand for `colStart: 1`). A pin that would start or end past the last track
snaps back onto the grid rather than making CSS invent implicit columns.

## Breakpoints

Container widths, mobile-first — declaring `md` also covers `lg`/`xl`/`2xl`:

| Name      | `base` | `xs`  | `sm`  | `md`  | `lg`  | `xl`  | `2xl` |
| --------- | ------ | ----- | ----- | ----- | ----- | ----- | ----- |
| Min-width | —      | 20rem | 30rem | 48rem | 64rem | 80rem | 96rem |

Exported as `BREAKPOINT_ORDER` / `BREAKPOINT_MIN_WIDTH`, and mirrored by hand in
`src/styles/layout.css` — change both together.

## Gap

`gap` (plus `columnGap` / `rowGap`) takes a token (`none` `xs` `sm` `md` `lg`
`xl` `2xl`), a number on the 0.25rem scale (`4` → `1rem`), or any CSS length.
All responsive.

## Presets

`LAYOUT_PRESETS` covers the common shapes: `stacked`, `pair`, `triple`, `quad`,
`twelve`, `sixteen`, `fluid`, `sidebar`, `filters`. Pass one by name and override
any part of it:

```tsx
<SmartForm preset="twelve" gap="lg" … />
```

## In the form engine

Fields take the same placement vocabulary, and `columns` / `gap` / `dense` /
`align` sit directly on `SmartForm`:

```tsx
const fields: FormNode<Values>[] = [
  { name: "street", type: "text", span: "full" },
  { name: "city", type: "text", span: "1/2" },
  { name: "zip", type: "text", span: "1/2" },
]

<SmartForm schema={schema} fields={fields} columns={{ base: 1, md: 12 }} />
```

See [form.md](./form.md) for sections and the other layout node kinds.

## Escape hatches

- `useGridLayout(options)` returns the container + grid props so a host that owns
  its root element can spread them itself (this is how `SmartForm` puts the
  container on its `<form>`); pair it with `GridLayoutProvider` and `useGridCell`.
- `resolveGridLayout` / `resolveCellStyle` are pure functions — config in, CSS
  custom properties out — if you need the values without the components.
- A raw `grid-template-columns` string covers anything the notations above miss.

## Gotchas

- A grid cannot query its own width, so every layout renders **two** elements: a
  `.sui-layout` container and the `.sui-grid` inside it. Nesting is fine — each
  level becomes the query container for its own children.
- `dense` packs later cells into earlier holes, so visual order stops matching
  DOM order. Leave it off wherever tab order matters, i.e. forms.
- Fraction spans against `{ auto: "fit" }` tracks resolve to one track — there is
  no count to take a fraction of. Use `span: "full"` for full-width rows there.
