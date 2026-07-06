import { Search, X } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

export interface SmartSearchInputProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
}

export const SmartSearchInput = ({
  value,
  onValueChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel,
}: SmartSearchInputProps) => (
  <InputGroup className={cn(className)}>
    <InputGroupAddon>
      <Search className="text-muted-foreground" />
    </InputGroupAddon>
    <InputGroupInput
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
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
