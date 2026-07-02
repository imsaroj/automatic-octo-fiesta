/**
 * `@workspace/ui/form-engine` — declarative form engine built on Smart Components.
 *
 * Core usage:
 *   import { SmartForm, type FieldDefinition } from "@workspace/ui/form-engine"
 *
 * For standalone field components:
 *   import { SmartInputField, SmartSelectField, ... } from "@workspace/ui/form-engine"
 *
 * New Smart* wrappers added for the engine:
 *   import { SmartMultiSelect }    from "@workspace/ui/smart-components/smart-multi-select"
 *   import { SmartSegmented }      from "@workspace/ui/smart-components/smart-segmented"
 *   import { SmartPasswordInput }  from "@workspace/ui/smart-components/smart-password-input"
 *   import { SmartStepper }        from "@workspace/ui/smart-components/smart-stepper"
 */

// Core engine
export * from "./smart-form"
export * from "./base"

// Standalone field components
export * from "./smart-input-field"
export * from "./smart-textarea-field"
export * from "./smart-password-field"
export * from "./smart-tel-field"
export * from "./smart-slug-field"
export * from "./smart-number-field"
export * from "./smart-select-field"
export * from "./smart-combobox-field"
export * from "./smart-multi-select-field"
export * from "./smart-checkbox-field"
export * from "./smart-checkbox-group-field"
export * from "./smart-switch-field"
export * from "./smart-radio-group-field"
export * from "./smart-yesno-field"
export * from "./smart-segmented-field"
export * from "./smart-date-field"
export * from "./smart-time-field"
export * from "./smart-datetime-field"
export * from "./smart-month-field"
export * from "./smart-year-field"
export * from "./smart-date-range-field"
export * from "./smart-time-range-field"
export * from "./smart-text-editor-field"
