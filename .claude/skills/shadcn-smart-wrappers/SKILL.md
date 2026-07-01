---
name: shadcn-smart-wrappers
description: Convert native Shadcn UI compound components (SCard, SDialog, SSheet, SDrawer, SForm, STable, SPage, STabs, SAccordion, SAlertDialog, etc.) into their corresponding Smart* wrapper components (SmartCard, SmartDialog, SmartSheet, ...) to cut JSX boilerplate. Use this whenever writing, editing, reviewing, or refactoring React/TSX code that uses Shadcn primitives in this codebase — including when generating new pages or components from scratch. Apply proactively even if the user just asks for "a card with a header and footer" or "a dialog with a form" rather than explicitly asking for a "Smart" component or a conversion.
---

# Shadcn → Smart Wrapper Conversion

## Goal

Whenever a native Shadcn compound component follows a common, predictable layout, write or rewrite it using the matching `Smart*` wrapper instead. This reduces JSX boilerplate, keeps usage consistent across the codebase, and makes pages easier to scan. Only fall back to the native primitives when the wrapper genuinely can't express the layout — never out of caution alone.

## Principles

1. Prefer the `Smart*` wrapper over the native Shadcn component whenever it fits.
2. Keep generated code as concise as the wrapper allows — no redundant props, no stringified JSX.
3. Preserve all existing functionality and behavior exactly. A conversion that drops a prop, handler, or accessibility attribute is a bug, not a simplification.
4. Don't remove flexibility — wrappers expose render props / JSX props as escape hatches; use them rather than abandoning the wrapper.
5. If a layout is unusual or highly customized (see "When to keep the primitive" below), fall back to the native `S*` components rather than forcing a bad fit.
6. Never wrap merely for the sake of wrapping — only convert when it measurably reduces boilerplate or improves readability over the native version.

## How to convert: general procedure

For each compound component:

1. Identify the root primitive (`SCard`, `SDialog`, etc.) and its named sub-parts (`SCardHeader`, `SCardTitle`, `SDialogTrigger`, ...).
2. Check the mapping table for that component below.
3. Map each sub-part to its corresponding prop on the `Smart*` wrapper.
4. Omit any prop whose section doesn't exist in the original — never pass `undefined` explicitly.
5. Preserve JSX content as JSX, never as a string.
6. Before finalizing, sanity-check against "When to keep the primitive."

---

## Card

**Native:**

```tsx
<SCard>
  <SCardHeader>
    <SCardTitle>Orders</SCardTitle>
    <SCardDescription>Latest orders</SCardDescription>
    <SCardAction>
      <Button>Add</Button>
    </SCardAction>
  </SCardHeader>
  <SCardContent>...</SCardContent>
  <SCardFooter>
    <Pagination />
  </SCardFooter>
</SCard>
```

**Smart:**

```tsx
<SmartCard
  header={{
    title: "Orders",
    subtitle: "Latest orders",
    actions: <Button>Add</Button>,
  }}
  footer={<Pagination />}
>
  ...
</SmartCard>
```

| Native sub-part    | Smart prop        |
| ------------------ | ----------------- |
| `SCardTitle`       | `header.title`    |
| `SCardDescription` | `header.subtitle` |
| `SCardAction`      | `header.actions`  |
| `SCardFooter`      | `footer`          |
| `SCardContent`     | `children`        |

---

## Dialog

**Native:**

```tsx
<SDialog open={open} onOpenChange={setOpen}>
  <SDialogTrigger asChild>
    <Button>Edit profile</Button>
  </SDialogTrigger>
  <SDialogContent>
    <SDialogHeader>
      <SDialogTitle>Edit profile</SDialogTitle>
      <SDialogDescription>
        Make changes to your profile here.
      </SDialogDescription>
    </SDialogHeader>
    <div>...form fields...</div>
    <SDialogFooter>
      <Button onClick={save}>Save</Button>
    </SDialogFooter>
  </SDialogContent>
</SDialog>
```

**Smart:**

```tsx
<SmartDialog
  open={open}
  onOpenChange={setOpen}
  trigger={<Button>Edit profile</Button>}
  header={{
    title: "Edit profile",
    subtitle: "Make changes to your profile here.",
  }}
  footer={<Button onClick={save}>Save</Button>}
>
  ...form fields...
</SmartDialog>
```

| Native sub-part         | Smart prop           |
| ----------------------- | -------------------- |
| `SDialogTrigger`        | `trigger`            |
| `SDialogTitle`          | `header.title`       |
| `SDialogDescription`    | `header.subtitle`    |
| `SDialogFooter`         | `footer`             |
| `SDialogContent` body   | `children`           |
| `open` / `onOpenChange` | passed through as-is |

Note: if the trigger needs `asChild` semantics beyond a single element (e.g. conditional rendering, multiple triggers), keep the native `SDialog`/`SDialogTrigger` — `trigger` only accepts a single element.

---

## Other components

`SmartSheet`, `SmartDrawer`, `SmartForm`, `SmartTable`, `SmartPage`, `SmartTabs`, `SmartAccordion`, and `SmartAlertDialog` follow the same shape as `SmartCard`/`SmartDialog`: header/title/description sub-parts collapse into a `header` object, trigger sub-parts become a `trigger` prop, footer sub-parts become a `footer` prop, and the main body becomes `children`. Apply the same general procedure above. If a mapping table for one of these doesn't yet exist and the component appears in code you're converting, mirror the Card/Dialog pattern rather than skipping the conversion — but flag the new mapping to the user so it can be added here for consistency next time.

---

## Preserve JSX

Never stringify JSX passed into a Smart prop.

✅ Correct:

```tsx
actions: <>
  <Button>Add</Button>
  <Button>Export</Button>
</>
```

❌ Incorrect:

```tsx
actions: "<Button>Add</Button>"
```

## Optional sections

Omit props for sections that don't exist in the original — don't pass them as `undefined`.

✅ Correct:

```tsx
<SmartCard header={{ title: "Orders" }}>
```

❌ Incorrect:

```tsx
<SmartCard header={{ title: "Orders", subtitle: undefined, actions: undefined }}>
```

---

## When to keep the primitive

Keep the native `S*` components instead of converting when any of the following apply:

- The header/footer/content area has multiple custom rows, a grid, or a non-linear layout — not just title + subtitle + action.
- There's a drag handle, resizable region, or other interactive chrome inside the header or footer.
- Positioning is non-standard (e.g. absolutely positioned elements, custom z-index stacking, portal targets other than the default).
- The trigger needs more than a single static element (conditional triggers, multiple triggers, render-prop-based triggers).
- Converting would require inventing new wrapper props not listed in the mapping tables above and not yet confirmed with the user.

**Example — correctly declining to convert:**

```tsx
// Keep as-is: header has a custom two-row layout with a search input
// and a filter dropdown alongside the title — doesn't fit header.title/
// header.subtitle/header.actions cleanly.
<SCard>
  <SCardHeader className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <SCardTitle>Orders</SCardTitle>
      <Button size="icon">
        <RefreshCw />
      </Button>
    </div>
    <div className="flex gap-2">
      <Input placeholder="Search orders..." />
      <FilterDropdown />
    </div>
  </SCardHeader>
  <SCardContent>...</SCardContent>
</SCard>
```

When declining, say briefly why (e.g. "kept as native SCard — the header has a search bar and filter row that don't map to header.actions") rather than silently leaving it unconverted.
