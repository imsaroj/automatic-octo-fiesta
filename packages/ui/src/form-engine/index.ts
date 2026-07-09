/**
 * `@imsaroj/smart-ui/form-engine` — declarative form engine built on Smart Components.
 *
 * Core usage:
 *   import { SmartForm, type FieldDefinition } from "@imsaroj/smart-ui/form-engine"
 *
 * For standalone field components:
 *   import { SmartInputField, SmartSelectField, ... } from "@imsaroj/smart-ui/form-engine"
 *
 * New Smart* wrappers added for the engine:
 *   import { SmartMultiSelect }    from "@imsaroj/smart-ui/smart-components/smart-multi-select"
 *   import { SmartSegmented }      from "@imsaroj/smart-ui/smart-components/smart-segmented"
 *   import { SmartPasswordInput }  from "@imsaroj/smart-ui/smart-components/smart-password-input"
 *   import { SmartStepper }        from "@imsaroj/smart-ui/smart-components/smart-stepper"
 */

// Core engine
export * from "./smart-form"
export * from "./field-types"
export * from "./field-registry"
export * from "./base"
