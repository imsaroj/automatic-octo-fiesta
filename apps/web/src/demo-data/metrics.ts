/**
 * Typed demo datasets for the dashboard/analytics example pages. Kept in one
 * place so the KPI figures, activity feeds, and breakdown lists that used to be
 * copy-pasted inline across pages have a single source of truth.
 *
 * Icons are intentionally *not* stored here (this stays a plain data module);
 * pages map each entry's `key` to a lucide icon at render time.
 */

/** A single KPI/metric, shaped for `SmartStatCard`. */
export interface DemoStat {
  /** Stable key used to attach an icon in the page. */
  key: string
  label: string
  /** Pre-formatted headline value. */
  value: string
  /** Numeric delta → auto sign + `%`; string → shown verbatim. */
  delta: number | string
  /** Caption after the delta. */
  deltaLabel?: string
  /** Overrides the auto-derived trend (needed for string deltas). */
  trend?: "up" | "down" | "neutral"
}

export const dashboardStats: DemoStat[] = [
  {
    key: "revenue",
    label: "Total Revenue",
    value: "$48,295",
    delta: "+12.5%",
    deltaLabel: "from last month",
  },
  {
    key: "users",
    label: "Active Users",
    value: "3,842",
    delta: "+8.2%",
    deltaLabel: "from last month",
  },
  {
    key: "orders",
    label: "Orders",
    value: "1,204",
    delta: "+3.1%",
    deltaLabel: "from last month",
  },
  {
    key: "growth",
    label: "Growth Rate",
    value: "18.4%",
    delta: "+2.3 pp",
    deltaLabel: "from last month",
  },
]

export const analyticsKpis: DemoStat[] = [
  {
    key: "sessions",
    label: "Sessions",
    value: "248,392",
    delta: 12.4,
    deltaLabel: "vs last period",
  },
  {
    key: "visitors",
    label: "Unique visitors",
    value: "184,271",
    delta: 8.7,
    deltaLabel: "vs last period",
  },
  {
    key: "bounce",
    label: "Bounce rate",
    value: "38.2%",
    delta: -3.1,
    deltaLabel: "vs last period",
  },
  {
    key: "session",
    label: "Avg. session",
    value: "4m 12s",
    delta: 5.8,
    deltaLabel: "vs last period",
  },
]

/** Recent-activity feed rows. */
export interface ActivityEntry {
  name: string
  action: string
  time: string
}

export const recentActivity: ActivityEntry[] = [
  { name: "Alice", action: "invited 3 new members", time: "2m ago" },
  { name: "Bob", action: "exported the Q3 report", time: "14m ago" },
  { name: "Carol", action: "updated billing plan to Pro", time: "1h ago" },
  { name: "Dave", action: "created workspace Alpha", time: "3h ago" },
  { name: "Eve", action: "resolved 12 issues", time: "5h ago" },
]

/** A labelled proportion row (traffic sources, channels, devices, geo…). */
export interface BreakdownRow {
  label: string
  pct: number
  /** Optional pre-formatted absolute figure. */
  value?: string
}

export const topSources: BreakdownRow[] = [
  { label: "Direct", pct: 38 },
  { label: "Organic search", pct: 27 },
  { label: "Referral", pct: 18 },
  { label: "Social", pct: 11 },
  { label: "Email", pct: 6 },
]

export const trafficChannels: BreakdownRow[] = [
  { label: "Organic search", pct: 42, value: "104,325" },
  { label: "Direct", pct: 28, value: "69,549" },
  { label: "Referral", pct: 16, value: "39,743" },
  { label: "Social", pct: 9, value: "22,355" },
  { label: "Email", pct: 5, value: "12,420" },
]

/** Device breakdown — `key` maps to a lucide icon in the page. */
export interface DeviceRow extends BreakdownRow {
  key: "desktop" | "mobile" | "tablet"
}

export const deviceBreakdown: DeviceRow[] = [
  { key: "desktop", label: "Desktop", pct: 54, value: "134,131" },
  { key: "mobile", label: "Mobile", pct: 37, value: "91,905" },
  { key: "tablet", label: "Tablet", pct: 9, value: "22,355" },
]

export const topCountries: BreakdownRow[] = [
  { label: "United States", pct: 39.5, value: "98,240" },
  { label: "South Korea", pct: 17.0, value: "42,180" },
  { label: "United Kingdom", pct: 11.5, value: "28,640" },
  { label: "Germany", pct: 7.8, value: "19,430" },
  { label: "Japan", pct: 6.4, value: "15,820" },
  { label: "France", pct: 5.0, value: "12,470" },
  { label: "Australia", pct: 4.0, value: "9,840" },
  { label: "Canada", pct: 3.5, value: "8,760" },
  { label: "Brazil", pct: 2.9, value: "7,230" },
  { label: "Other", pct: 2.3, value: "5,778" },
]

/** A conversion-funnel step. */
export interface FunnelStepDatum {
  label: string
  value: string
  pct: number
  /** Drop-off from the previous step, in percent. */
  drop?: number
}

export const conversionFunnel: FunnelStepDatum[] = [
  { label: "Visitors", value: "248,392", pct: 100 },
  { label: "Product page views", value: "148,321", pct: 59.7, drop: 40.3 },
  { label: "Add to cart", value: "72,840", pct: 29.3, drop: 30.9 },
  { label: "Checkout started", value: "41,280", pct: 16.6, drop: 43.4 },
  { label: "Purchase completed", value: "22,355", pct: 9, drop: 45.8 },
]
