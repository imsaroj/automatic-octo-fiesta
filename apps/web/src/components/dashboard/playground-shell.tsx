import {
  SidebarInset,
  SidebarProvider,
} from "@iamsaroj/smart-ui/components/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import * as React from "react"

export const PlaygroundShell = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <SidebarProvider>
    {/* First focusable element: a skip link that jumps keyboard users past the
        sidebar straight to the main content. Visually hidden until focused. */}
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:ring-2 focus:ring-ring focus:outline-none"
    >
      Skip to content
    </a>
    <AppSidebar />
    <SidebarInset>
      <header className="flex h-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear"></header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col gap-4 p-4 pt-0 focus:outline-none"
      >
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
)
