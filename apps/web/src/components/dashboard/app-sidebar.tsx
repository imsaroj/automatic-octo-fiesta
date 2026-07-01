import * as React from "react"
import {
  ComponentIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  LayoutDashboardIcon,
  TableIcon,
  SparklesIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavProjects } from "@/components/dashboard/nav-projects"
import { NavUser } from "@/components/dashboard/nav-user"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Grids",
      url: "/grids/simple",
      icon: <TableIcon />,
      items: [
        { title: "Simple Grid", url: "/grids/simple" },
        { title: "Server Driven Grid", url: "/grids/server" },
        { title: "Infinite Scroll Grid", url: "/grids/infinite" },
        { title: "Editable Grid", url: "/grids/editable" },
        { title: "Master Detail Grid", url: "/grids/master-detail" },
      ],
    },
    {
      title: "Examples",
      url: "/examples/crud",
      icon: <LayoutDashboardIcon />,
      items: [
        { title: "CRUD Grid", url: "/examples/crud" },
        { title: "Dashboard", url: "/examples/dashboard" },
        { title: "Settings", url: "/examples/settings" },
        { title: "Detail", url: "/examples/detail" },
        { title: "Wizard", url: "/examples/wizard" },
        { title: "Analytics", url: "/examples/analytics" },
      ],
    },
    {
      title: "Smart Components",
      url: "/smart/forms",
      icon: <SparklesIcon />,
      items: [
        { title: "Form Controls", url: "/smart/forms" },
        { title: "Pickers", url: "/smart/pickers" },
        { title: "Overlays", url: "/smart/overlays" },
        { title: "Feedback & Display", url: "/smart/feedback" },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/projects/design-engineering",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "/projects/sales-marketing",
      icon: <PieChartIcon />,
    },
    { name: "Travel", url: "/projects/travel", icon: <MapIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
            <ComponentIcon className="size-5" />
          </div>
          <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            smart-component
          </span>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
