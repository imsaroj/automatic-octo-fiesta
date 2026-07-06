/**
 * Page Example — Detail layout
 *
 * `layout="detail"` gives an entity-detail view: the header sticks to the top
 * while `SmartPageContent` owns the scroll. Unlike `split` there's no sidebar —
 * it's a single focused column. Ideal for profiles, records and item views.
 */

import {
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
} from "lucide-react"
import {
  SmartPage,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"
import { SmartStatCard } from "@workspace/ui/smart-components/smart-stat-card"
import {
  Avatar,
  AvatarFallback,
} from "@workspace/ui/smart-components/smart-avatar"

const FIELDS = [
  {
    icon: <Mail className="size-4" />,
    label: "Email",
    value: "grace.hopper@example.com",
  },
  {
    icon: <Phone className="size-4" />,
    label: "Phone",
    value: "+1 (555) 013-3742",
  },
  {
    icon: <Building2 className="size-4" />,
    label: "Company",
    value: "Globex Corporation",
  },
  {
    icon: <MapPin className="size-4" />,
    label: "Location",
    value: "Arlington, VA",
  },
  {
    icon: <CalendarDays className="size-4" />,
    label: "Member since",
    value: "March 2021",
  },
]

const TIMELINE = [
  { time: "2h ago", text: "Upgraded to the Enterprise plan." },
  { time: "Yesterday", text: "Added 3 seats to the workspace." },
  { time: "3 days ago", text: "Completed onboarding checklist." },
  { time: "Last week", text: "Signed up for a trial." },
]

const DetailLayoutPage = () => {
  return (
    <SmartPage
      layout="detail"
      breadcrumb={[
        { label: "Page Layouts", href: "/page-example" },
        { label: "Customers", href: "#" },
        { label: "Grace Hopper" },
      ]}
      title={
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <SmartPageTitle>Grace Hopper</SmartPageTitle>
              <Badge>Enterprise</Badge>
            </div>
            <SmartPageDescription>
              Customer #4271 · Globex Corporation
            </SmartPageDescription>
          </div>
        </div>
      }
      actions={
        <>
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </>
      }
    >
      <SmartPageContent maxWidth="2xl" centered padding="md">
        <SmartPageSection padding={false}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <SmartStatCard
              label="Lifetime value"
              value="$48,200"
              delta={12}
              trend="up"
            />
            <SmartStatCard
              label="Open tickets"
              value="2"
              delta={-1}
              trend="down"
            />
            <SmartStatCard label="Seats" value="24" delta={3} trend="up" />
          </div>
        </SmartPageSection>

        <SmartPageSection title="Contact details" divider>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <span className="mt-0.5 text-muted-foreground">{f.icon}</span>
                <div>
                  <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {f.label}
                  </dt>
                  <dd className="text-sm">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </SmartPageSection>

        <SmartPageSection title="Activity" divider>
          <ol className="relative ml-2 border-l">
            {TIMELINE.map((item, i) => (
              <li key={i} className="mb-4 ml-4 last:mb-0">
                <span className="absolute -left-1.5 mt-1 size-3 rounded-full border-2 border-background bg-primary" />
                <p className="text-sm">{item.text}</p>
                <time className="text-xs text-muted-foreground">
                  {item.time}
                </time>
              </li>
            ))}
          </ol>
        </SmartPageSection>

        <SmartPageSection title="Notes" bordered>
          <p className="text-sm text-muted-foreground">
            Key account — routed to the strategic success team. Renewal is due
            in Q1. Champion is the VP of Engineering.
          </p>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default DetailLayoutPage
