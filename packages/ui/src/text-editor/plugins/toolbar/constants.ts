import type { TextFormatType } from "lexical"
import { getCodeLanguageOptions } from "@lexical/code"

/**
 * Shared data and types for the toolbar sections. Pure module — no components —
 * so every section imports from here without pulling in React render code.
 */

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code"

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  bullet: "Bullet List",
  number: "Numbered List",
  check: "Checklist",
  quote: "Quote",
  code: "Code Block",
}

export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 96
export const DEFAULT_FONT_SIZE = 14

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72,
  96,
]

export const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
]

export const TEXT_COLORS: Array<{ label: string; value: string }> = [
  { label: "Default", value: "" },
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
]

export const HIGHLIGHT_COLORS: Array<{ label: string; value: string }> = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Gray", value: "#e5e7eb" },
]

export const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

export const ALL_TEXT_FORMATS: TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "superscript",
  "subscript",
  "highlight",
]

/**
 * Which dropdown menu is open, and the callbacks to toggle/close it. The
 * `ToolbarPlugin` owns this single-open-at-a-time state and threads it into
 * every section that renders a `PortalDropdown`.
 */
export interface ToolbarMenuControls {
  openMenu: string | null
  toggleMenu: (name: string) => void
  closeMenu: () => void
}
