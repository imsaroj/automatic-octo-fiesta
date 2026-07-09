import { SmartRadioGroup } from "@imsaroj/smart-ui/smart-components/smart-radio-group"
import type { FieldBaseProps } from "./base"

export interface SmartYesNoFieldProps extends Omit<
  FieldBaseProps<boolean>,
  "placeholder" | "readOnly"
> {
  yesLabel?: string
  noLabel?: string
  orientation?: "horizontal" | "vertical"
}

/**
 * Boolean field rendered as a Yes / No radio pair. Stores a `boolean`;
 * `null`/`undefined` renders as no selection.
 */
export const SmartYesNoField = ({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
  yesLabel = "Yes",
  noLabel = "No",
  orientation = "horizontal",
}: SmartYesNoFieldProps) => {
  const value = data ? "yes" : !data ? "no" : ""

  return (
    <SmartRadioGroup
      value={value}
      onValueChange={(v) => setData(v === "yes")}
      items={[
        { value: "yes", label: yesLabel },
        { value: "no", label: noLabel },
      ]}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
      fieldClassName={className}
    />
  )
}
