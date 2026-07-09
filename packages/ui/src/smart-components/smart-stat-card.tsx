"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
} from "@imsaroj/smart-ui/components/card"

type Trend = "up" | "down" | "neutral"

export interface SmartStatCardProps {
  /** Metric name shown above the value, e.g. "Total Revenue". */
  label: string
  /** The headline figure — pre-formatted (`"$48,295"`, `"3,842"`, `"38.2%"`). */
  value: React.ReactNode
  /**
   * Change indicator rendered under the value.
   * - a **number** is formatted with a leading sign and a `%` suffix
   *   (`12.4 → "+12.4%"`), and its sign drives {@link trend} when `trend` is
   *   omitted;
   * - a **string** is shown verbatim (`"+2.3 pp"`, `"+12.5%"`).
   */
  delta?: number | string
  /**
   * Trend direction driving the arrow + colour. Auto-derived from a numeric
   * `delta`'s sign; defaults to `"up"` for a string delta.
   */
  trend?: Trend
  /** Caption after the delta, e.g. "vs last period" or "from last month". */
  deltaLabel?: string
  /** Optional icon shown top-right (muted). */
  icon?: React.ReactNode
  className?: string
}

const TREND_STYLES: Record<Trend, string> = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
}

/**
 * Compact KPI / metric card: a label, a headline value, and an optional
 * change indicator (arrow + coloured delta + caption) with a top-right icon.
 *
 * Replaces the hand-rolled `KpiCard` / `MetricCard` blocks the demo pages each
 * defined inline — a genuinely reusable dashboard primitive.
 *
 * @example
 * ```tsx
 * <SmartStatCard
 *   label="Sessions"
 *   value="248,392"
 *   delta={12.4}
 *   deltaLabel="vs last period"
 *   icon={<BarChart3 className="size-4" />}
 * />
 * ```
 */
export const SmartStatCard = ({
  label,
  value,
  delta,
  trend,
  deltaLabel,
  icon,
  className,
}: SmartStatCardProps) => {
  const isNumber = typeof delta === "number"
  const resolvedTrend: Trend =
    trend ?? (isNumber ? (delta >= 0 ? "up" : "down") : "up")
  const deltaText = isNumber ? `${delta >= 0 ? "+" : ""}${delta}%` : delta

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {delta !== undefined && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              TREND_STYLES[resolvedTrend]
            )}
          >
            {resolvedTrend === "up" && <ArrowUpRight className="size-3.5" />}
            {resolvedTrend === "down" && (
              <ArrowDownRight className="size-3.5" />
            )}
            <span>{deltaText}</span>
            {deltaLabel && (
              <span className="text-muted-foreground">{deltaLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
