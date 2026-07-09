import type { ReactNode } from "react"
import { Columns3, RefreshCw } from "lucide-react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Button } from "@imsaroj/smart-ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@imsaroj/smart-ui/components/dropdown-menu"

/** A toggleable column shown in the visibility menu. */
export interface GridToolbarColumn {
  id: string
  label: string
  visible: boolean
}

export interface GridToolbarProps {
  /** Title rendered on the left. */
  title?: ReactNode
  /**
   * Extra left-group content after the title — e.g. a quick-search input
   * (client grid) or a selected-count label (server grid).
   */
  leadingContent?: ReactNode
  /** Extra content rendered at the start of the right-hand action group. */
  toolbarActions?: ReactNode
  /** When provided, renders a manual refresh button. */
  onRefresh?: () => void
  /** When provided, renders the column-visibility menu. */
  columns?: GridToolbarColumn[]
  /** Toggle handler for the column-visibility menu. */
  onToggleColumn?: (id: string, visible: boolean) => void
  /** When provided, renders an export button. */
  onExport?: () => void
  /** Icon for the export button (e.g. CSV vs. Excel). */
  exportIcon?: ReactNode
  /** Export button label. Default `"Export"`. */
  exportLabel?: string
  /** Extra class names merged onto the toolbar root. */
  className?: string
}

/**
 * Shared toolbar for `SmartGrid` and `SmartServerGrid`. Internal to the
 * data-grid layer (not exported from the package barrel), matching the
 * `*-internals` convention — the two grids compose it with their own left-group
 * content, refresh behaviour and export format.
 */
export const GridToolbar = ({
  title,
  leadingContent,
  toolbarActions,
  onRefresh,
  columns,
  onToggleColumn,
  onExport,
  exportIcon,
  exportLabel = "Export",
  className,
}: GridToolbarProps) => (
  <div
    className={cn(
      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      className
    )}
  >
    <div className="flex items-center gap-3">
      {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
      {leadingContent}
    </div>

    <div className="flex items-center gap-2">
      {toolbarActions}
      {onRefresh ? (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      ) : null}
      {columns ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Columns3 className="h-4 w-4" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.visible}
                  onCheckedChange={(checked) =>
                    onToggleColumn?.(column.id, checked)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {onExport ? (
        <Button variant="outline" size="sm" onClick={onExport}>
          {exportIcon}
          {exportLabel}
        </Button>
      ) : null}
    </div>
  </div>
)
