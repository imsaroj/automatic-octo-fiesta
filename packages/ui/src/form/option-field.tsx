"use client"

import * as React from "react"
import { useSmartUILabels } from "@iamsaroj/smart-ui/smart-components/provider"

import type { FieldOptions, PrimitiveOptionValue } from "./field-types"
import { buildOptionCodec } from "./option-utils"
import { useFieldOptions } from "./use-field-options"
import type { CommonFieldProps } from "./field-registry"

export interface OptionFieldProps {
  /** The underlying string-based control (SmartSelectField, SmartRadioGroupField, …). */
  control: React.ComponentType<Record<string, unknown>>
  /** Raw field options: a materialized list or an async resolver. */
  options?: FieldOptions
  /** Multi-value control (multiselect / checkbox-group) vs single. */
  multiple?: boolean
  /** Current typed value from the form store (`V` or `V[]`). */
  value: unknown
  /** Push the decoded typed value back into the form store. */
  setValue: (value: unknown) => void
  /** Common field props (label, placeholder, error, required, disabled). */
  common: CommonFieldProps
  /** Control-specific extras (orientation, searchPlaceholder, maxSelected, …). */
  extra?: Record<string, unknown>
}

const asArray = (value: unknown): PrimitiveOptionValue[] =>
  Array.isArray(value) ? (value as PrimitiveOptionValue[]) : []

/**
 * The registry adapter for every option-based field. It bridges three concerns
 * the string-based controls don't handle themselves:
 *
 * 1. **Typed values** — the form store holds the real value (`number`/`boolean`/
 *    `string`); this maps it to/from the string keys the DOM control exchanges,
 *    via a codec built from the *resolved* option list.
 * 2. **Async options** — an `options` function is resolved through
 *    {@link useFieldOptions}, with a loading placeholder while it's in flight.
 * 3. **Passthrough** — label/error/required plus per-control extras reach the
 *    underlying `control` unchanged.
 *
 * The standalone `Smart*Field` controls stay string-only (backward compatible);
 * this typed/async layer lives in the form engine, exactly where honest schemas
 * matter.
 */
export const OptionField = ({
  control: Control,
  options,
  multiple = false,
  value,
  setValue,
  common,
  extra,
}: OptionFieldProps) => {
  const labels = useSmartUILabels()
  const { options: resolved, loading } = useFieldOptions(options)
  const codec = React.useMemo(() => buildOptionCodec(resolved), [resolved])

  const data = multiple
    ? asArray(value).map(codec.toKey)
    : value == null
      ? ""
      : codec.toKey(value as PrimitiveOptionValue)

  const setData = multiple
    ? (keys: string[]) => setValue(keys.map(codec.fromKey))
    : (key: string) => setValue(key === "" ? "" : codec.fromKey(key))

  return (
    <Control
      {...common}
      {...extra}
      data={data}
      setData={setData}
      options={codec.stringOptions}
      // While async options load, disable the control and hint via the
      // placeholder rather than showing an empty, pickable-looking list.
      disabled={common.disabled || loading}
      placeholder={loading ? labels.form.loadingOptions : common.placeholder}
    />
  )
}
