/**
 * Aggregate barrel for the flat `Smart*` facades — so a page can write one
 * import instead of six-to-eight deep paths:
 *
 * ```ts
 * import { SmartCard, SmartDialog, SmartButton } from "@iamsaroj/smart-ui/smart-components"
 * ```
 *
 * Safe to add now that `package.json` marks the package side-effect-free apart
 * from its CSS, so bundlers tree-shake everything a page doesn't import. The deep
 * paths (`@iamsaroj/smart-ui/smart-components/smart-card`, …) stay valid; prefer
 * whichever reads better. The `buttons` and `page` sub-barrels remain their own
 * entrypoints and are re-exported here too.
 */

// ─── Global config / provider ────────────────────────────────────────────────
export * from "./provider"

// ─── Overlays, inputs & feedback ─────────────────────────────────────────────
export * from "./loading-overlay"
export * from "./search-input"
export * from "./spinner"
export * from "./smart-toaster"

// ─── Data display ────────────────────────────────────────────────────────────
export * from "./smart-avatar"
export * from "./smart-badge"
export * from "./smart-card"
export * from "./smart-stat-card"
export * from "./smart-separator"
export * from "./smart-alert"
export * from "./smart-accordion"
export * from "./smart-breadcrumb"

// ─── Buttons & actions ───────────────────────────────────────────────────────
export * from "./smart-button"
export * from "./buttons"

// ─── Form controls ───────────────────────────────────────────────────────────
export * from "./smart-field"
export * from "./smart-label"
export * from "./smart-input"
export * from "./smart-input-group"
export * from "./smart-password-input"
export * from "./smart-textarea"
export * from "./smart-checkbox"
export * from "./smart-checkbox-group"
export * from "./smart-radio-group"
export * from "./smart-switch"
export * from "./smart-segmented"
export * from "./smart-select"
export * from "./smart-native-select"
export * from "./smart-multi-select"
export * from "./smart-combobox"

// ─── Date & time pickers ─────────────────────────────────────────────────────
export * from "./smart-calendar"
export * from "./smart-date-picker"
export * from "./smart-date-range-picker"
export * from "./smart-month-picker"
export * from "./smart-year-picker"
export * from "./smart-time-picker"
export * from "./smart-time-range-picker"

// ─── Overlays & surfaces ─────────────────────────────────────────────────────
export * from "./smart-dialog"
export * from "./smart-confirm-dialog"
export * from "./smart-sheet"
export * from "./smart-drawer"
export * from "./smart-context-menu"

// ─── Navigation & structure ──────────────────────────────────────────────────
export * from "./smart-nav-sidebar"
export * from "./smart-stepper"
export * from "./page"
