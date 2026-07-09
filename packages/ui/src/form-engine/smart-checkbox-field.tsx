import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { SmartCheckbox } from "@iamsaroj/smart-ui/smart-components/smart-checkbox"
import type { FieldBaseProps } from "./base"

export type SmartCheckboxFieldProps = Omit<
  FieldBaseProps<boolean>,
  "placeholder" | "readOnly"
>

/** Single boolean checkbox with an inline label, description, and error message. */
export const SmartCheckboxField = ({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
}: SmartCheckboxFieldProps) => {
  const labelNode =
    label != null ? (
      <>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </>
    ) : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <SmartCheckbox
        checked={data}
        disabled={disabled}
        label={labelNode}
        description={description}
        onCheckedChange={(checked) => setData(checked)}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
