import { cn } from "@workspace/ui/lib/utils"
import { SmartSwitch } from "@workspace/ui/smart-components/smart-switch"
import type { FieldBaseProps } from "./base"

export type SmartSwitchFieldProps = Omit<FieldBaseProps<boolean>, "placeholder">

export const SmartSwitchField = ({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  className,
}: SmartSwitchFieldProps) => {
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
      <SmartSwitch
        checked={data}
        disabled={disabled || readOnly}
        label={labelNode}
        description={description}
        onCheckedChange={(v) => setData(v)}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
