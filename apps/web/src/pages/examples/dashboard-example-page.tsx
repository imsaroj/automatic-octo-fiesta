/**
 * Dashboard Example Page
 *
 * Demonstrates the "dashboard" layout:
 * - Page scrolls naturally (no height tricks)
 * - Hero sets the scene above the metric cards
 * - Cards and charts flow in a responsive grid
 * - SmartPageSection groups related widgets
 *
 * Auto-detected as "dashboard" because SmartPageHero is a direct child.
 *
 * Metric figures, the activity feed, and traffic sources come from the shared
 * `@/demo-data` module; KPI cards use the reusable `SmartStatCard` primitive.
 */

import {
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  SmartPage,
  SmartPageHero,
  SmartPageContent,
  SmartPageSection,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@imsaroj/smart-ui/smart-components/smart-button"
import { SmartStatCard } from "@imsaroj/smart-ui/smart-components/smart-stat-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@imsaroj/smart-ui/smart-components/smart-card"
import { dashboardStats, recentActivity, topSources, series } from "@/demo-data"

// ─── Icon lookup for the shared stat data ─────────────────────────────────────

const STAT_ICONS: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="size-4" />,
  users: <Users className="size-4" />,
  orders: <ShoppingCart className="size-4" />,
  growth: <TrendingUp className="size-4" />,
}

// ─── Sparkline placeholder ────────────────────────────────────────────────────

const SparklinePlaceholder = ({
  label,
  seed,
}: {
  label: string
  seed: number
}) => {
  const bars = series({ length: 12, seed, min: 40, max: 95, trend: 0.4 })
  return (
    <Card className="h-52">
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-28 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/20 transition-all"
            style={{ height: `${h}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

const ActivityItem = ({
  name,
  action,
  time,
}: {
  name: string
  action: string
  time: string
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {name[0]}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium">
        <span className="font-semibold">{name}</span> {action}
      </p>
    </div>
    <time className="shrink-0 text-xs text-muted-foreground">{time}</time>
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardExamplePage = () => {
  return (
    // Hero detected → "dashboard" layout (page scroll, no height constraints)
    <SmartPage
      title="Dashboard"
      actions={
        <Button variant="outline" size="sm">
          <ArrowUpRight />
          View report
        </Button>
      }
      headerProps={{ compact: true, border: false }}
    >
      {/* Hero scrolls away — intentional for dashboard pages */}
      <SmartPageHero background={"muted"} height="sm">
        <p className="text-sm text-muted-foreground">
          Good morning — here's how things look across your workspace today.
        </p>
      </SmartPageHero>

      <SmartPageContent padding="md">
        {/* ── Metrics row ──────────────────────────────────────────────────── */}
        <SmartPageSection padding={false}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {dashboardStats.map((stat) => (
              <SmartStatCard
                key={stat.key}
                label={stat.label}
                value={stat.value}
                delta={stat.delta}
                deltaLabel={stat.deltaLabel}
                trend={stat.trend}
                icon={STAT_ICONS[stat.key]}
              />
            ))}
          </div>
        </SmartPageSection>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <SmartPageSection
          title="Trends"
          description="Revenue and user activity over the past 12 months."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SparklinePlaceholder label="Revenue" seed={11} />
            <SparklinePlaceholder label="Active users" seed={29} />
          </div>
        </SmartPageSection>

        {/* ── Recent activity + top sources ────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <SmartPageSection title="Recent activity" bordered>
            {recentActivity.map((a) => (
              <ActivityItem key={a.name} {...a} />
            ))}
          </SmartPageSection>

          <SmartPageSection title="Top sources" bordered>
            {topSources.map(({ label, pct }) => (
              <div key={label} className="flex items-center gap-3 py-1.5">
                <span className="flex-1 text-xs">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              </div>
            ))}
          </SmartPageSection>
        </div>
      </SmartPageContent>
    </SmartPage>
  )
}

export default DashboardExamplePage
