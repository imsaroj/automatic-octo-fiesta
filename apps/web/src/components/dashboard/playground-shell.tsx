import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import * as React from "react"

export const PlaygroundShell = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header className="flex h-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear"></header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
    </SidebarInset>
  </SidebarProvider>
)
