import { Search, X } from "lucide-react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { withLeadingSpaceGuard } from "@iamsaroj/smart-ui/lib/leading-space"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@iamsaroj/smart-ui/components/input-group"

export interface SmartSearchInputProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
  /**
   * By default the query may not *start* with whitespace: Space at the
   * beginning is ignored and pasted leading spaces are stripped; spaces after
   * the first character work normally. Set to `true` to allow a leading space.
   */
  allowLeadingSpace?: boolean
}

/**
 * Controlled search input with a leading magnifier icon and a clear button that
 * appears once the field is non-empty. A thin, presentational control — debouncing
 * and query wiring are left to the caller.
 */
export const SmartSearchInput = ({
  value,
  onValueChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel,
  allowLeadingSpace,
}: SmartSearchInputProps) => (
  <InputGroup className={cn(className)}>
    <InputGroupAddon>
      <Search className="text-muted-foreground" />
    </InputGroupAddon>
    <InputGroupInput
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      {...withLeadingSpaceGuard<HTMLInputElement>(
        { onChange: (e) => onValueChange(e.target.value) },
        allowLeadingSpace
      )}
    />
    {value ? (
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          onClick={() => onValueChange("")}
          aria-label="Clear search"
        >
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    ) : null}
  </InputGroup>
)
