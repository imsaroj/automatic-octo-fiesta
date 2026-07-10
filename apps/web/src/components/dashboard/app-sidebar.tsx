import * as React from "react"
import {
  ComponentIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  TableIcon,
  SparklesIcon,
  NotepadTextIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@iamsaroj/smart-ui/components/sidebar"
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
        { title: "Action Column Grid", url: "/grids/actions" },
      ],
    },
    {
      title: "Examples",
      url: "/examples/crud",
      icon: <LayoutDashboardIcon />,
      items: [
        { title: "Basic Text Fields", url: "/examples/fields" },
        { title: "CRUD Grid", url: "/examples/crud" },
        { title: "Dashboard", url: "/examples/dashboard" },
        { title: "Settings", url: "/examples/settings" },
        { title: "Detail", url: "/examples/detail" },
        { title: "Wizard", url: "/examples/wizard" },
        { title: "Analytics", url: "/examples/analytics" },
      ],
    },
    {
      title: "Page Example",
      url: "/page-example",
      icon: <LayoutTemplateIcon />,
      items: [
        { title: "Overview", url: "/page-example" },
        { title: "Document", url: "/page-example/document" },
        { title: "Dashboard", url: "/page-example/dashboard" },
        { title: "Data Grid", url: "/page-example/grid" },
        { title: "Split", url: "/page-example/split" },
        { title: "Detail", url: "/page-example/detail" },
        { title: "Wizard", url: "/page-example/wizard" },
        { title: "Fullscreen", url: "/page-example/fullscreen" },
        { title: "Tabbed", url: "/page-example/tabs" },
        { title: "States", url: "/page-example/states" },
        { title: "Composition", url: "/page-example/container" },
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
        { title: "Text Editor", url: "/smart/text-editor" },
        { title: "Action Buttons", url: "/smart/buttons" },
        { title: "Tree Engine", url: "/smart/tree" },
        { title: "Tree Explorer", url: "/smart/tree-explorer" },
        { title: "Transfer List", url: "/smart/transfer-list" },
        { title: "Calendar Engine", url: "/smart/calendar" },
      ],
    },
    {
      title: "Form Engine",
      url: "/form/basic",
      icon: <NotepadTextIcon />,
      items: [
        { title: "Basic Form", url: "/form/basic" },
        { title: "All Field Types", url: "/form/all-fields" },
        { title: "Dynamic Form", url: "/form/dynamic" },
        { title: "Multi-Step Wizard", url: "/form/wizard" },
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

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => (
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
