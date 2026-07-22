/**
 * The form's layout tree. `SmartForm`'s `fields` prop is no longer a flat list
 * of controls but a list of {@link FormNode}s — fields, **sections** (nested
 * grids with their own column count), inline **custom** content, and
 * **dividers**. Nesting is what lets one form mix an 12-column identity block
 * with a 2-column preferences block without splitting into two `<SmartForm>`s.
 *
 * Everything here is pure data + pure walkers, so the engine's validation
 * bookkeeping (which keys a mode excludes, what the blank record is) keeps
 * working off a flat field list no matter how deep the tree gets.
 */

import type * as React from "react"

import type {
  GridLayoutOptions,
  GridPlacement,
  Responsive,
  SpanValue,
} from "@iamsaroj/smart-ui/layout"

import type { FieldDefinition } from "./field-types"

/** What a node's `render` / `hidden` callbacks get to look at. */
export interface FormNodeContext<T extends Record<string, unknown>> {
  /** Live form values. */
  values: T
  /** The form's active `mode`, if any. */
  mode?: string
}

/** Shared by every non-field node: placement, plus the same gating fields have. */
interface FormNodeBase<
  T extends Record<string, unknown>,
> extends GridPlacement {
  /** Stable identity for React keys and collapse state. Defaults to the tree path. */
  id?: string
  /** Return `true` to drop the node (and everything under it) from render. */
  hidden?: (data: T) => boolean
  /** Modes this node appears in. Omit to show in every mode. Inherited by descendants. */
  modes?: string[]
}

/** How a section frames its contents. */
export type FormSectionVariant = "plain" | "card" | "fieldset"

/**
 * A titled group of fields laid out on its **own** grid. Defaults to spanning
 * the full width of the parent grid and inheriting its column config, so
 * wrapping fields in a section changes grouping without changing layout.
 *
 * ```ts
 * {
 *   kind: "section",
 *   title: "Billing address",
 *   columns: 12,
 *   collapsible: true,
 *   fields: [
 *     { name: "street", type: "text", span: "full" },
 *     { name: "city",   type: "text", span: 6 },
 *     { name: "zip",    type: "text", span: 6 },
 *   ],
 * }
 * ```
 */
export interface FormSection<T extends Record<string, unknown>>
  extends FormNodeBase<T>, GridLayoutOptions {
  kind: "section"
  title?: React.ReactNode
  description?: React.ReactNode
  /** `plain` (a titled block), `card` (bordered surface), or a real `<fieldset>`. */
  variant?: FormSectionVariant
  /** Add a disclosure toggle. Collapsed sections auto-open when they hold an error. */
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** Child nodes — fields, or further sections. */
  fields: FormNode<T>[]
}

/**
 * Arbitrary content placed in the grid — a callout, a computed total, a
 * "same as billing" button. Gets the live values so it can react to them.
 */
export interface FormCustomNode<
  T extends Record<string, unknown>,
> extends FormNodeBase<T> {
  kind: "custom"
  render: (ctx: FormNodeContext<T>) => React.ReactNode
}

/** A horizontal rule, optionally labelled. Spans the full row by default. */
export interface FormDividerNode<
  T extends Record<string, unknown>,
> extends FormNodeBase<T> {
  kind: "divider"
  label?: React.ReactNode
}

/** One entry in a form's layout tree. */
export type FormNode<T extends Record<string, unknown>> =
  | FieldDefinition<T>
  | FormSection<T>
  | FormCustomNode<T>
  | FormDividerNode<T>

/** Non-field nodes carry `kind`; fields carry `type`. That's the discriminant. */
export const isFieldNode = <T extends Record<string, unknown>>(
  node: FormNode<T>
): node is FieldDefinition<T> => !("kind" in node)

export const isSectionNode = <T extends Record<string, unknown>>(
  node: FormNode<T>
): node is FormSection<T> => "kind" in node && node.kind === "section"

/** Sections span the full row unless the author says otherwise. */
export const DEFAULT_SECTION_SPAN: Responsive<SpanValue> = "full"

/**
 * Every field in the tree, in document order. The engine's schema scoping,
 * blank-record construction, and error focusing all run off this — they care
 * about controls, not about how those controls are grouped.
 */
export const flattenFields = <T extends Record<string, unknown>>(
  nodes: readonly FormNode<T>[]
): FieldDefinition<T>[] => {
  const out: FieldDefinition<T>[] = []
  const walk = (list: readonly FormNode<T>[]): void => {
    for (const node of list) {
      if (isFieldNode(node)) out.push(node)
      else if (isSectionNode(node)) walk(node.fields)
    }
  }
  walk(nodes)
  return out
}

/**
 * Field names the active mode excludes — dropped from render, validation, and
 * the submitted value. A section's `modes` cascades to everything inside it, so
 * gating a whole step is one declaration rather than one per field.
 */
export const collectModeExcludedKeys = <T extends Record<string, unknown>>(
  nodes: readonly FormNode<T>[],
  mode: string | undefined
): string[] => {
  if (mode === undefined) return []
  const out: string[] = []
  const walk = (list: readonly FormNode<T>[], inherited: boolean): void => {
    for (const node of list) {
      const excluded =
        inherited || (node.modes !== undefined && !node.modes.includes(mode))
      if (isFieldNode(node)) {
        if (excluded) out.push(node.name)
      } else if (isSectionNode(node)) {
        walk(node.fields, excluded)
      }
    }
  }
  walk(nodes, false)
  return out
}

/**
 * Map each field name to the ids of the sections enclosing it, outermost first.
 * Used to reopen collapsed sections that turn out to contain a submit error —
 * an error the user cannot see is worse than no validation at all.
 */
export const buildSectionPathMap = <T extends Record<string, unknown>>(
  nodes: readonly FormNode<T>[]
): Map<string, string[]> => {
  const map = new Map<string, string[]>()
  const walk = (
    list: readonly FormNode<T>[],
    path: string[],
    prefix: string
  ): void => {
    list.forEach((node, index) => {
      if (isFieldNode(node)) {
        if (path.length > 0) map.set(node.name, path)
        return
      }
      if (!isSectionNode(node)) return
      const id = node.id ?? `${prefix}${index}`
      walk(node.fields, [...path, id], `${id}.`)
    })
  }
  walk(nodes, [], "")
  return map
}

/** The id a section is tracked by: its explicit `id`, else its position. */
export const sectionNodeId = <T extends Record<string, unknown>>(
  node: FormSection<T>,
  index: number,
  prefix: string
): string => node.id ?? `${prefix}${index}`
