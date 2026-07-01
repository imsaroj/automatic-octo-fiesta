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
 */

import { useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
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
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui/smart-components/smart-card"
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

// ─── Metric card ─────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  delta: number
  format?: "percent" | "number" | "currency"
  icon?: React.ReactNode
}

function KpiCard({ label, value, delta, icon }: KpiCardProps) {
  const positive = delta >= 0
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div
          className={`mt-1 flex items-center gap-1 text-xs ${positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {positive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {positive ? "+" : ""}
          {delta}% vs last period
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Bar chart placeholder ────────────────────────────────────────────────────

function BarChartPlaceholder({
  label,
  data,
  height = 120,
}: {
  label?: string
  data: number[]
  height?: number
}) {
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

function FunnelStep({
  label,
  value,
  pct,
  drop,
}: {
  label: string
  value: string
  pct: number
  drop?: number
}) {
  return (
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
}

// ─── Geo row ──────────────────────────────────────────────────────────────────

function GeoRow({
  country,
  sessions,
  pct,
}: {
  country: string
  sessions: string
  pct: number
}) {
  return (
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
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <SmartPageContent padding="md">
      {/* KPIs */}
      <SmartPageSection padding={false}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Sessions"
            value="248,392"
            delta={12.4}
            icon={<BarChart3 className="size-4" />}
          />
          <KpiCard
            label="Unique visitors"
            value="184,271"
            delta={8.7}
            icon={<TrendingUp className="size-4" />}
          />
          <KpiCard label="Bounce rate" value="38.2%" delta={-3.1} />
          <KpiCard label="Avg. session" value="4m 12s" delta={5.8} />
        </div>
      </SmartPageSection>

      {/* Sessions over time */}
      <SmartPageSection title="Sessions over time" bordered>
        <BarChartPlaceholder
          height={160}
          data={[
            12, 19, 15, 28, 22, 34, 29, 38, 33, 41, 36, 48, 42, 55, 50, 62, 57,
            65, 58, 72, 66, 78, 70, 84, 76, 88, 80, 94, 87, 96,
          ]}
        />
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
          {[
            { label: "Organic search", pct: 42, value: "104,325" },
            { label: "Direct", pct: 28, value: "69,549" },
            { label: "Referral", pct: 16, value: "39,743" },
            { label: "Social", pct: 9, value: "22,355" },
            { label: "Email", pct: 5, value: "12,420" },
          ].map((r) => (
            <GeoRow
              key={r.label}
              country={r.label}
              sessions={r.value}
              pct={r.pct}
            />
          ))}
        </SmartPageSection>

        <SmartPageSection title="Device breakdown" bordered>
          {[
            { icon: Monitor, label: "Desktop", pct: 54, value: "134,131" },
            { icon: Smartphone, label: "Mobile", pct: 37, value: "91,905" },
            { icon: Tablet, label: "Tablet", pct: 9, value: "22,355" },
          ].map(({ icon: Icon, label, pct, value }) => (
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
          ))}
        </SmartPageSection>
      </div>
    </SmartPageContent>
  )
}

// ─── Funnel tab ───────────────────────────────────────────────────────────────

function FunnelTab() {
  return (
    <SmartPageContent maxWidth="lg" centered padding="md">
      <SmartPageSection
        title="Conversion funnel"
        description="Visitor flow from landing to purchase for the current period."
        bordered
      >
        <FunnelStep label="Visitors" value="248,392" pct={100} />
        <FunnelStep
          label="Product page views"
          value="148,321"
          pct={59.7}
          drop={40.3}
        />
        <FunnelStep label="Add to cart" value="72,840" pct={29.3} drop={30.9} />
        <FunnelStep
          label="Checkout started"
          value="41,280"
          pct={16.6}
          drop={43.4}
        />
        <FunnelStep
          label="Purchase completed"
          value="22,355"
          pct={9}
          drop={45.8}
        />
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
}

// ─── Geo tab ──────────────────────────────────────────────────────────────────

function GeoTab() {
  return (
    <SmartPageContent padding="md">
      <SmartPageSection title="Top countries" bordered>
        {[
          { country: "United States", sessions: "98,240", pct: 39.5 },
          { country: "South Korea", sessions: "42,180", pct: 17.0 },
          { country: "United Kingdom", sessions: "28,640", pct: 11.5 },
          { country: "Germany", sessions: "19,430", pct: 7.8 },
          { country: "Japan", sessions: "15,820", pct: 6.4 },
          { country: "France", sessions: "12,470", pct: 5.0 },
          { country: "Australia", sessions: "9,840", pct: 4.0 },
          { country: "Canada", sessions: "8,760", pct: 3.5 },
          { country: "Brazil", sessions: "7,230", pct: 2.9 },
          { country: "Other", sessions: "5,778", pct: 2.3 },
        ].map((r) => (
          <GeoRow
            key={r.country}
            country={r.country}
            sessions={r.sessions}
            pct={r.pct}
          />
        ))}
      </SmartPageSection>
    </SmartPageContent>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsExamplePage() {
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
