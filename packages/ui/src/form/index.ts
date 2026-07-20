/**
 * `@iamsaroj/smart-ui/form` — declarative form engine built on Smart Components.
 *
 * Core usage:
 *   import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"
 *
 * For standalone field components:
 *   import { SmartInputField, SmartSelectField, ... } from "@iamsaroj/smart-ui/form"
 *
 * New Smart* wrappers added for the engine:
 *   import { SmartMultiSelect }    from "@iamsaroj/smart-ui/smart-components/smart-multi-select"
 *   import { SmartSegmented }      from "@iamsaroj/smart-ui/smart-components/smart-segmented"
 *   import { SmartPasswordInput }  from "@iamsaroj/smart-ui/smart-components/smart-password-input"
 *   import { SmartStepper }        from "@iamsaroj/smart-ui/smart-components/smart-stepper"
 */

// Core engine
export * from "./smart-form"
export * from "./field-types"
export * from "./field-registry"
export * from "./base"

// Option resolution helpers — reusable when building custom option-based field
// types (async selects, typed values) via the `registry` prop.
export { useFieldOptions, type FieldOptionsState } from "./use-field-options"
export {
  buildOptionCodec,
  serializeOptionValue,
  type OptionValueCodec,
  type StringOption,
} from "./option-utils"
