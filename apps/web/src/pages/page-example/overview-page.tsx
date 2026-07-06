/**
 * Page Example — Overview
 *
 * Landing page for the "Page Example" section. It catalogs every SmartPage
 * layout preset and pattern with a short description and a link to the live
 * example. Rendered as a plain "document" layout so the catalog itself is a
 * working demo of natural page flow.
 */

import { Link } from "react-router-dom"
import {
  ArrowRight,
  FileText,
  LayoutDashboard,
  Table2,
  Columns2,
  IdCard,
  ListChecks,
  Maximize,
  PanelsTopLeft,
  Loader,
  Boxes,
} from "lucide-react"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"

// ─── Catalog ──────────────────────────────────────────────────────────────────

interface Example {
  to: string
  title: string
  layout: string
  icon: React.ReactNode
  description: string
}

const EXAMPLES: Example[] = [
  {
    to: "/page-example/document",
    title: "Document",
    layout: "document",
    icon: <FileText className="size-5" />,
    description:
      "Natural page flow for articles, docs and settings. Centered, readable max-width content with sections.",
  },
  {
    to: "/page-example/dashboard",
    title: "Dashboard",
    layout: "dashboard",
    icon: <LayoutDashboard className="size-5" />,
    description:
      "Hero banner over a responsive grid of KPI cards and charts. The page scrolls naturally — no height tricks.",
  },
  {
    to: "/page-example/grid",
    title: "Data Grid",
    layout: "grid",
    icon: <Table2 className="size-5" />,
    description:
      "Full CRUD shell: sticky header, toolbar, search, filters, a height-filling grid, status bar and footer.",
  },
  {
    to: "/page-example/split",
    title: "Split",
    layout: "split",
    icon: <Columns2 className="size-5" />,
    description:
      "Main content beside an independently-scrolling sidebar. Great for mail, inspectors and master/detail views.",
  },
  {
    to: "/page-example/detail",
    title: "Detail",
    layout: "detail",
    icon: <IdCard className="size-5" />,
    description:
      "Entity detail with a sticky header and its own scroll container — profiles, records and item views.",
  },
  {
    to: "/page-example/wizard",
    title: "Wizard",
    layout: "wizard",
    icon: <ListChecks className="size-5" />,
    description:
      "Stepped flow with a pinned footer for Back / Next navigation. Onboarding, checkout and multi-step forms.",
  },
  {
    to: "/page-example/fullscreen",
    title: "Fullscreen",
    layout: "fullscreen",
    icon: <Maximize className="size-5" />,
    description:
      "Fills the entire viewport with no page scroll. Canvases, maps, editors and other immersive surfaces.",
  },
  {
    to: "/page-example/tabs",
    title: "Tabbed",
    layout: "tabs",
    icon: <PanelsTopLeft className="size-5" />,
    description:
      "Page-level tab navigation between views that share the same header — Overview / Activity / Settings.",
  },
  {
    to: "/page-example/states",
    title: "States",
    layout: "loading · error · empty",
    icon: <Loader className="size-5" />,
    description:
      "The built-in loading, error and empty full-page states, toggled through SmartPage's state props.",
  },
  {
    to: "/page-example/container",
    title: "Compound API",
    layout: "SmartPageContainer",
    icon: <Boxes className="size-5" />,
    description:
      "The same slots via a single import — SmartPageContainer.Header, .Content, .Footer and friends.",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageExampleOverview() {
  return (
    <SmartPage layout="document">
      <SmartPageHeader>
        <SmartPageTitle>Page Layouts</SmartPageTitle>
        <SmartPageDescription>
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            SmartPage
          </code>{" "}
          is a layout engine that assembles named slots — header, hero, toolbar,
          search, filters, tabs, content, sidebar, grid, status bar and footer —
          into one of seven presets, and manages scroll containment for you.
          Each card below is a live example of one preset or pattern.
        </SmartPageDescription>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" centered>
        <SmartPageSection padding={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.to}
                to={ex.to}
                className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {ex.icon}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold">{ex.title}</span>
                    <Badge
                      variant="secondary"
                      className="w-fit font-mono text-[10px]"
                    >
                      {ex.layout}
                    </Badge>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {ex.description}
                </p>
              </Link>
            ))}
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}
