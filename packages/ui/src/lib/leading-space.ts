import type * as React from "react"

/**
 * Guard that keeps input-like controls from *starting* with whitespace: the
 * Space key is ignored while the caret sits at the very start of the value
 * (a held, auto-repeating space bar stays blocked because the caret never
 * moves), and leading whitespace that arrives another way — paste, drop,
 * autofill — is stripped before `onChange` sees it. Once a real first
 * character exists, spaces behave normally.
 */

type TextControl = HTMLInputElement | HTMLTextAreaElement

export interface LeadingSpaceGuardHandlers<T extends TextControl> {
  onKeyDown?: React.KeyboardEventHandler<T>
  onChange?: React.ChangeEventHandler<T>
}

/** Removes the leading whitespace a guarded value may not begin with. */
export const stripLeadingSpaces = (value: string) => value.replace(/^\s+/, "")

/**
 * Wraps a control's `onKeyDown`/`onChange` with the leading-space guard.
 * Pass `allowLeadingSpace: true` to opt out — the handlers are returned
 * untouched.
 *
 * Note: input types without selection support (`email`, `number`) report the
 * caret as `null`, which the guard treats as position 0 — every space is
 * blocked there, matching what those types accept anyway.
 */
export function withLeadingSpaceGuard<T extends TextControl>(
  { onKeyDown, onChange }: LeadingSpaceGuardHandlers<T>,
  allowLeadingSpace?: boolean
): LeadingSpaceGuardHandlers<T> {
  if (allowLeadingSpace) return { onKeyDown, onChange }

  return {
    onKeyDown: (e) => {
      // Block only when the space would become the first character: the caret
      // (or the start of a selection about to be replaced) is at position 0.
      if (e.key === " " && (e.currentTarget.selectionStart ?? 0) === 0) {
        e.preventDefault()
        return
      }
      onKeyDown?.(e)
    },
    onChange: (e) => {
      const value = e.currentTarget.value
      const stripped = stripLeadingSpaces(value)
      if (stripped !== value) e.currentTarget.value = stripped
      onChange?.(e)
    },
  }
}
