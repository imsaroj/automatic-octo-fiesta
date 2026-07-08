# 0001 — Base UI over Radix for shadcn primitives

- **Status:** Accepted

## Context

shadcn/ui traditionally generates primitives on top of Radix UI. This repo uses
the shadcn **v4 / Base UI** variant: the primitives in
`packages/ui/src/components/` are backed by `@base-ui/react`, not Radix. Triggers
use the `render` prop pattern (`<DropdownMenuTrigger render={<Button />}>`) rather
than Radix's `asChild`.

## Decision

Standardize on Base UI as the primitive foundation for all vendored shadcn
components.

## Consequences

- **Pro:** Base UI is the direction shadcn v4 is moving; the `render` prop is more
  explicit than `asChild` and avoids `Slot` cloning surprises.
- **Pro:** One consistent idiom across every primitive and every `Smart*` wrapper.
- **Con:** Some ecosystem snippets assume Radix — they must be translated
  (`asChild` → `render`, different sub-component names).
- **Con:** Base UI is younger; a few jsdom test shims are needed
  (`ResizeObserver`, `scrollIntoView`, and — file-locally — `getAnimations`) and
  some portal/animation timing differs from Radix.
- Controlled-value nuance: Base UI decides controlled-ness on first render, so
  "controlled empty" must be `null`, not `undefined` (see `SmartSelect`).
