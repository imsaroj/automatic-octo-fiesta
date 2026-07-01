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
  SmartPageHeader,
  SmartPageTitle,
  SmartPageActions,
  SmartPageHero,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/smart-components/smart-card"

// ─── Metric card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  delta: string
  positive?: boolean
  icon: React.ReactNode
}

function MetricCard({
  label,
  value,
  delta,
  positive = true,
  icon,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`mt-1 text-xs ${positive ? "text-green-600" : "text-red-600"}`}
        >
          {delta} from last month
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Sparkline placeholder ────────────────────────────────────────────────────

function SparklinePlaceholder({ label }: { label: string }) {
  return (
    <Card className="h-52">
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-28 items-end gap-1">
        {[40, 65, 45, 80, 55, 75, 60, 90, 70, 85, 95, 78].map((h, i) => (
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

function ActivityItem({
  name,
  action,
  time,
}: {
  name: string
  action: string
  time: string
}) {
  return (
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardExamplePage() {
  return (
    // Hero detected → "dashboard" layout (page scroll, no height constraints)
    <SmartPage>
      <SmartPageHeader compact border={false}>
        <div className="flex items-center justify-between">
          <SmartPageTitle>Dashboard</SmartPageTitle>
          <SmartPageActions>
            <Button variant="outline" size="sm">
              <ArrowUpRight />
              View report
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

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
            <MetricCard
              label="Total Revenue"
              value="$48,295"
              delta="+12.5%"
              icon={<DollarSign className="size-4" />}
            />
            <MetricCard
              label="Active Users"
              value="3,842"
              delta="+8.2%"
              icon={<Users className="size-4" />}
            />
            <MetricCard
              label="Orders"
              value="1,204"
              delta="+3.1%"
              icon={<ShoppingCart className="size-4" />}
            />
            <MetricCard
              label="Growth Rate"
              value="18.4%"
              delta="+2.3 pp"
              icon={<TrendingUp className="size-4" />}
            />
          </div>
        </SmartPageSection>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <SmartPageSection
          title="Trends"
          description="Revenue and user activity over the past 12 months."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SparklinePlaceholder label="Revenue" />
            <SparklinePlaceholder label="Active users" />
          </div>
        </SmartPageSection>

        {/* ── Recent activity + top sources ────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <SmartPageSection title="Recent activity" bordered>
            {[
              {
                name: "Alice",
                action: "invited 3 new members",
                time: "2m ago",
              },
              {
                name: "Bob",
                action: "exported the Q3 report",
                time: "14m ago",
              },
              {
                name: "Carol",
                action: "updated billing plan to Pro",
                time: "1h ago",
              },
              {
                name: "Dave",
                action: "created workspace Alpha",
                time: "3h ago",
              },
              { name: "Eve", action: "resolved 12 issues", time: "5h ago" },
            ].map((a) => (
              <ActivityItem key={a.name} {...a} />
            ))}
          </SmartPageSection>

          <SmartPageSection title="Top sources" bordered>
            {[
              { label: "Direct", pct: 38 },
              { label: "Organic search", pct: 27 },
              { label: "Referral", pct: 18 },
              { label: "Social", pct: 11 },
              { label: "Email", pct: 6 },
            ].map(({ label, pct }) => (
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
