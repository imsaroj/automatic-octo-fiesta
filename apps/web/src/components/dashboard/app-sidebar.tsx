import * as React from "react"
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  LayoutDashboardIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavProjects } from "@/components/dashboard/nav-projects"
import { NavUser } from "@/components/dashboard/nav-user"
import { TeamSwitcher } from "@/components/dashboard/team-switcher"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    { name: "Acme Inc", logo: <GalleryVerticalEndIcon />, plan: "Enterprise" },
    { name: "Acme Corp.", logo: <AudioLinesIcon />, plan: "Startup" },
    { name: "Evil Corp.", logo: <TerminalIcon />, plan: "Free" },
  ],
  navMain: [
    {
      title: "Playground",
      url: "/playground/history",
      icon: <TerminalSquareIcon />,
      items: [
        { title: "History", url: "/playground/history" },
        { title: "Starred", url: "/playground/starred" },
        { title: "Settings", url: "/playground/settings" },
      ],
    },
    {
      title: "Models",
      url: "/models/genesis",
      icon: <BotIcon />,
      items: [
        { title: "Genesis", url: "/models/genesis" },
        { title: "Explorer", url: "/models/explorer" },
        { title: "Quantum", url: "/models/quantum" },
      ],
    },
    {
      title: "Documentation",
      url: "/docs/introduction",
      icon: <BookOpenIcon />,
      items: [
        { title: "Introduction", url: "/docs/introduction" },
        { title: "Get Started", url: "/docs/get-started" },
        { title: "Tutorials", url: "/docs/tutorials" },
        { title: "Changelog", url: "/docs/changelog" },
      ],
    },
    {
      title: "Settings",
      url: "/settings/general",
      icon: <Settings2Icon />,
      items: [
        { title: "General", url: "/settings/general" },
        { title: "Team", url: "/settings/team" },
        { title: "Billing", url: "/settings/billing" },
        { title: "Limits", url: "/settings/limits" },
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
  ],
  projects: [
    { name: "Design Engineering", url: "/projects/design-engineering", icon: <FrameIcon /> },
    { name: "Sales & Marketing", url: "/projects/sales-marketing", icon: <PieChartIcon /> },
    { name: "Travel", url: "/projects/travel", icon: <MapIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
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
