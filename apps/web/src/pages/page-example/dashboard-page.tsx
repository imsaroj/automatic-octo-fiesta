/**
 * Page Example — Dashboard layout
 *
 * A `SmartPageHero` as a direct child auto-detects the `dashboard` layout:
 * the page scrolls naturally, the hero scrolls away, and widgets flow in a
 * responsive grid. KPI figures come from the shared `@/demo-data` module.
 */

import {
  Activity,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageActions,
  SmartPageHero,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartStatCard } from "@workspace/ui/smart-components/smart-stat-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/smart-components/smart-card"
import { dashboardStats, recentActivity, topSources, series } from "@/demo-data"

const STAT_ICONS: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="size-4" />,
  users: <Users className="size-4" />,
  orders: <ShoppingCart className="size-4" />,
  growth: <TrendingUp className="size-4" />,
}

function BarChartCard({ label, seed }: { label: string; seed: number }) {
  const bars = series({ length: 14, seed, min: 30, max: 95, trend: 0.4 })
  return (
    <Card className="h-52">
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-28 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/25"
            style={{ height: `${h}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export default function DashboardLayoutPage() {
  return (
    // Hero present → auto-detected "dashboard" layout
    <SmartPage>
      <SmartPageHeader compact border={false}>
        <div className="flex items-center justify-between">
          <SmartPageTitle>Dashboard layout</SmartPageTitle>
          <SmartPageActions>
            <Button variant="outline" size="sm">
              <ArrowUpRight />
              View report
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      <SmartPageHero background="gradient" height="sm">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="size-4 text-primary" />
          Overview
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The hero scrolls away with the page — reserve it for context, not
          controls you always need.
        </p>
      </SmartPageHero>

      <SmartPageContent padding="md">
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

        <SmartPageSection
          title="Trends"
          description="Revenue and activity across the last two weeks."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <BarChartCard label="Revenue" seed={7} />
            <BarChartCard label="Active users" seed={23} />
          </div>
        </SmartPageSection>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <SmartPageSection title="Recent activity" bordered>
            {recentActivity.map((a) => (
              <div key={a.name} className="flex items-center gap-3 py-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {a.name[0]}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs">
                  <span className="font-semibold">{a.name}</span> {a.action}
                </p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {a.time}
                </time>
              </div>
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
