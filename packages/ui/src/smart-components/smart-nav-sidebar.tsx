"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@imsaroj/smart-ui/components/sidebar"

export interface SmartNavSidebarItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export interface SmartNavSidebarProps {
  items: SmartNavSidebarItem[]
  /** Name of the currently active item. */
  activeItem?: string
  children?: React.ReactNode
}

/**
 * Settings-style nav sidebar layout.
 * Wraps the full SidebarProvider + Sidebar + nav item list, with a slot for
 * the main content area passed as `children`.
 *
 * ```tsx
 * // Before
 * <SidebarProvider className="items-start">
 *   <Sidebar collapsible="none" className="hidden md:flex">
 *     <SidebarContent>
 *       <SidebarGroup><SidebarGroupContent>
 *         <SidebarMenu>
 *           {items.map(item => (
 *             <SidebarMenuItem key={item.name}>
 *               <SidebarMenuButton isActive={item.name === active}>
 *                 <a href="#"><item.icon /><span>{item.name}</span></a>
 *               </SidebarMenuButton>
 *             </SidebarMenuItem>
 *           ))}
 *         </SidebarMenu>
 *       </SidebarGroupContent></SidebarGroup>
 *     </SidebarContent>
 *   </Sidebar>
 *   <main>…</main>
 * </SidebarProvider>
 *
 * // After
 * <SmartNavSidebar items={items} activeItem="Messages & media">
 *   <main>…</main>
 * </SmartNavSidebar>
 * ```
 */
export const SmartNavSidebar = ({
  items,
  activeItem,
  children,
}: SmartNavSidebarProps) => (
  <SidebarProvider className="items-start">
    <Sidebar collapsible="none" className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton isActive={item.name === activeItem}>
                    <item.icon />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    {children}
  </SidebarProvider>
)
