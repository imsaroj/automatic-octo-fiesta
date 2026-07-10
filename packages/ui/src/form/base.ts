import type { ReactNode } from "react"

/**
 * Shared props for every controlled field in the form layer.
 * All fields are driven by the `data` / `setData` pair.
 */
export interface FieldBaseProps<T> {
  data: T
  setData: (value: T) => void
  label?: ReactNode
  placeholder?: string
  description?: ReactNode
  error?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  className?: string
  id?: string
}
