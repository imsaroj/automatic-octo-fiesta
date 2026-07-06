/**
 * Analytics Example Page
 *
 * Demonstrates the "dashboard" layout with:
 * - SmartPageTabs switching between time periods / report views
 * - Multiple SmartPageSections grouping metric clusters
 * - Natural page scroll so all content is accessible
 * - No height tricks — everything flows vertically
 *
 * Uses layout="dashboard" explicitly (auto-detection would also work via hero,
 * but analytics pages often skip the hero).
 *
 * KPI cards use the shared `SmartStatCard`; figures and breakdown lists come
 * from the `@/demo-data` module.
 */

import { useState } from "react"
import {
  BarChart3,
  Download,
  Globe,
  LineChart,
  Monitor,
  Smartphone,
  Tablet,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"
import { SmartStatCard } from "@workspace/ui/smart-components/smart-stat-card"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageActions,
  SmartPageBreadcrumb,
  SmartToolbar,
  SmartPageTabs,
  SmartPageTab,
  SmartPageTabPanel,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import {
  analyticsKpis,
  conversionFunnel,
  deviceBreakdown,
  topCountries,
  trafficChannels,
  series,
} from "@/demo-data"

// ─── Shared lookups ───────────────────────────────────────────────────────────

const KPI_ICONS: Record<string, React.ReactNode> = {
  sessions: <BarChart3 className="size-4" />,
  visitors: <TrendingUp className="size-4" />,
}

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
} as const

// ─── Bar chart placeholder ────────────────────────────────────────────────────

const BarChartPlaceholder = ({
  label,
  data,
  height = 120,
}: {
  label?: string
  data: number[]
  height?: number
}) => {
  const max = Math.max(...data)
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex items-end gap-0.5" style={{ height }}>
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-primary/20 transition-colors hover:bg-primary/40"
            style={{ height: `${(v / max) * 100}%` }}
            title={String(v)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Funnel step ──────────────────────────────────────────────────────────────

const FunnelStep = ({
  label,
  value,
  pct,
  drop,
}: {
  label: string
  value: string
  pct: number
  drop?: number
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
    </div>
    {drop !== undefined && (
      <p className="text-[10px] text-red-500 dark:text-red-400">
        <TrendingDown className="mr-0.5 inline size-2.5" />
        {drop}% drop-off
      </p>
    )}
  </div>
)

// ─── Geo / proportion row ─────────────────────────────────────────────────────

const GeoRow = ({
  country,
  sessions,
  pct,
}: {
  country: string
  sessions: string
  pct: number
}) => (
  <div className="flex items-center gap-3 py-1.5">
    <Globe className="size-3.5 shrink-0 text-muted-foreground" />
    <span className="flex-1 text-xs">{country}</span>
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs text-muted-foreground">
        {sessions}
      </span>
    </div>
  </div>
)

// ─── Overview tab ─────────────────────────────────────────────────────────────

const SESSIONS_SERIES = series({
  length: 30,
  seed: 7,
  min: 12,
  max: 96,
  trend: 0.85,
})

const OverviewTab = () => (
  <SmartPageContent padding="md">
    {/* KPIs */}
    <SmartPageSection padding={false}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {analyticsKpis.map((stat) => (
          <SmartStatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaLabel={stat.deltaLabel}
            trend={stat.trend}
            icon={KPI_ICONS[stat.key]}
          />
        ))}
      </div>
    </SmartPageSection>

    {/* Sessions over time */}
    <SmartPageSection title="Sessions over time" bordered>
      <BarChartPlaceholder height={160} data={SESSIONS_SERIES} />
      <div className="flex items-center justify-between px-0.5 text-[10px] text-muted-foreground">
        <span>Jun 1</span>
        <span>Jun 8</span>
        <span>Jun 15</span>
        <span>Jun 22</span>
        <span>Jul 1</span>
      </div>
    </SmartPageSection>

    {/* Channels + Devices */}
    <div className="grid gap-4 md:grid-cols-2">
      <SmartPageSection title="Traffic channels" bordered>
        {trafficChannels.map((r) => (
          <GeoRow
            key={r.label}
            country={r.label}
            sessions={r.value ?? ""}
            pct={r.pct}
          />
        ))}
      </SmartPageSection>

      <SmartPageSection title="Device breakdown" bordered>
        {deviceBreakdown.map(({ key, label, pct, value }) => {
          const Icon = DEVICE_ICONS[key]
          return (
            <div key={label} className="flex items-center gap-3 py-1.5">
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="flex-1 text-xs">{label}</span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground">
                  {value}
                </span>
              </div>
            </div>
          )
        })}
      </SmartPageSection>
    </div>
  </SmartPageContent>
)

// ─── Funnel tab ───────────────────────────────────────────────────────────────

const FunnelTab = () => (
  <SmartPageContent maxWidth="lg" centered padding="md">
    <SmartPageSection
      title="Conversion funnel"
      description="Visitor flow from landing to purchase for the current period."
      bordered
    >
      {conversionFunnel.map((step) => (
        <FunnelStep key={step.label} {...step} />
      ))}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 p-3 text-xs">
        <span className="font-medium">Overall conversion rate</span>
        <Badge
          variant="secondary"
          className="text-green-700 dark:text-green-400"
        >
          9.0%
        </Badge>
      </div>
    </SmartPageSection>
  </SmartPageContent>
)

// ─── Geo tab ──────────────────────────────────────────────────────────────────

const GeoTab = () => (
  <SmartPageContent padding="md">
    <SmartPageSection title="Top countries" bordered>
      {topCountries.map((r) => (
        <GeoRow
          key={r.label}
          country={r.label}
          sessions={r.value ?? ""}
          pct={r.pct}
        />
      ))}
    </SmartPageSection>
  </SmartPageContent>
)

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsExamplePage = () => {
  const [period, setPeriod] = useState("30d")

  return (
    <SmartPage layout="dashboard">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <SmartPageHeader>
        <SmartPageBreadcrumb items={[{ label: "Analytics" }]} />
        <div className="flex items-center justify-between">
          <div>
            <SmartPageTitle>Analytics</SmartPageTitle>
          </div>
          <SmartPageActions>
            <Button variant="outline" size="sm">
              <Download />
              Export CSV
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      {/* ── Period selector toolbar ─────────────────────────────────────────── */}
      <SmartToolbar>
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          {["7d", "30d", "90d", "12m"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <span className="ms-auto" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LineChart className="size-3.5" />
          Jun 1 – Jul 1, 2026
        </div>
      </SmartToolbar>

      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <SmartPageTabs defaultValue="overview" variant="line">
        <SmartPageTab value="overview">Overview</SmartPageTab>
        <SmartPageTab value="funnel">Funnel</SmartPageTab>
        <SmartPageTab value="geo">Geography</SmartPageTab>

        <SmartPageTabPanel value="overview">
          <OverviewTab />
        </SmartPageTabPanel>
        <SmartPageTabPanel value="funnel">
          <FunnelTab />
        </SmartPageTabPanel>
        <SmartPageTabPanel value="geo">
          <GeoTab />
        </SmartPageTabPanel>
      </SmartPageTabs>
    </SmartPage>
  )
}

export default AnalyticsExamplePage
