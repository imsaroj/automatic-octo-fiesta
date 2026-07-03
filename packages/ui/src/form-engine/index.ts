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
export * from "./field-types"
export * from "./field-registry"
export * from "./base"
