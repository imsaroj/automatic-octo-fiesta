"use client"

import * as React from "react"
import {
  Bell,
  Globe,
  Lock,
  Paintbrush,
  User,
  type LucideIcon,
} from "lucide-react"

import { SmartBreadcrumb } from "@imsaroj/smart-ui/smart-components/smart-breadcrumb"
import { SmartButton } from "@imsaroj/smart-ui/smart-components/smart-button"
import { SmartInput } from "@imsaroj/smart-ui/smart-components/smart-input"
import { SmartSelect } from "@imsaroj/smart-ui/smart-components/smart-select"
import { SmartSwitch } from "@imsaroj/smart-ui/smart-components/smart-switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@imsaroj/smart-ui/components/dialog"
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

// ─── Navigation ─────────────────────────────────────────────────────────────

const NAV: { name: string; icon: LucideIcon }[] = [
  { name: "Account", icon: User },
  { name: "Notifications", icon: Bell },
  { name: "Appearance", icon: Paintbrush },
  { name: "Language & region", icon: Globe },
  { name: "Privacy & visibility", icon: Lock },
]

// ─── Reusable toggle-list row ───────────────────────────────────────────────

interface ToggleDef {
  key: string
  label: string
  description: string
  default: boolean
}

const ToggleList = ({ items }: { items: ToggleDef[] }) => {
  const [state, setState] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.key, i.default]))
  )
  return (
    <div className="flex flex-col divide-y">
      {items.map((item) => (
        <div key={item.key} className="py-3">
          <SmartSwitch
            label={item.label}
            description={item.description}
            checked={state[item.key]}
            onCheckedChange={(checked) =>
              setState((s) => ({ ...s, [item.key]: checked }))
            }
          />
        </div>
      ))}
    </div>
  )
}

const SectionTitle = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="mb-4 flex flex-col gap-1">
    <h2 className="text-sm font-semibold">{title}</h2>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
)

// ─── Per-section content ────────────────────────────────────────────────────

const SectionContent = ({ section }: { section: string }) => {
  switch (section) {
    case "Account":
      return (
        <>
          <SectionTitle
            title="Account"
            description="Your basic profile details."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartInput label="Full name" defaultValue="Saroj Kumar" />
            <SmartInput
              label="Email"
              type="email"
              defaultValue="imsaroj@g.skku.edu"
            />
            <div className="sm:col-span-2">
              <SmartInput label="Username" defaultValue="saroj" />
            </div>
            <div className="sm:col-span-2">
              <SmartSelect
                label="Role"
                defaultValue="admin"
                options={[
                  { value: "admin", label: "Admin" },
                  { value: "editor", label: "Editor" },
                  { value: "viewer", label: "Viewer" },
                ]}
              />
            </div>
          </div>
        </>
      )

    case "Notifications":
      return (
        <>
          <SectionTitle
            title="Notification preferences"
            description="Choose how and when this workspace can reach you."
          />
          <ToggleList
            items={[
              {
                key: "digest",
                label: "Weekly digest",
                description: "A summary of activity every Monday morning.",
                default: true,
              },
              {
                key: "mentions",
                label: "Mentions",
                description: "Notify me when someone @mentions me.",
                default: true,
              },
              {
                key: "browser",
                label: "Browser push",
                description: "Show desktop notifications in this browser.",
                default: false,
              },
              {
                key: "marketing",
                label: "Product & marketing",
                description: "Occasional news about new features.",
                default: false,
              },
            ]}
          />
        </>
      )

    case "Appearance":
      return (
        <>
          <SectionTitle
            title="Appearance"
            description="Tune the look and feel of the interface."
          />
          <div className="mb-2 grid gap-4 sm:grid-cols-2">
            <SmartSelect
              label="Theme"
              defaultValue="system"
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <SmartSelect
              label="Accent color"
              defaultValue="blue"
              options={[
                { value: "blue", label: "Blue" },
                { value: "green", label: "Green" },
                { value: "violet", label: "Violet" },
                { value: "orange", label: "Orange" },
              ]}
            />
          </div>
          <ToggleList
            items={[
              {
                key: "compact",
                label: "Compact mode",
                description: "Reduce padding to fit more on screen.",
                default: false,
              },
              {
                key: "motion",
                label: "Reduce motion",
                description: "Minimize non-essential animations.",
                default: false,
              },
            ]}
          />
        </>
      )

    case "Language & region":
      return (
        <>
          <SectionTitle
            title="Language & region"
            description="Set your display language and local formats."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SmartSelect
              label="Display language"
              defaultValue="en-US"
              options={[
                { value: "en-US", label: "English (US)" },
                { value: "en-GB", label: "English (UK)" },
                { value: "ko-KR", label: "한국어" },
                { value: "hi-IN", label: "हिन्दी" },
              ]}
            />
            <SmartSelect
              label="Time zone"
              defaultValue="Asia/Seoul"
              options={[
                { value: "Asia/Seoul", label: "GMT+09:00 — Seoul" },
                { value: "Asia/Kolkata", label: "GMT+05:30 — Kolkata" },
                { value: "Europe/London", label: "GMT+00:00 — London" },
                { value: "America/New_York", label: "GMT−05:00 — New York" },
              ]}
            />
            <div className="sm:col-span-2">
              <SmartSwitch
                label="Use 24-hour time"
                description="Show times like 14:30 instead of 2:30 PM."
                defaultChecked
              />
            </div>
          </div>
        </>
      )

    case "Privacy & visibility":
      return (
        <>
          <SectionTitle
            title="Privacy & visibility"
            description="Control what others can see about you."
          />
          <ToggleList
            items={[
              {
                key: "presence",
                label: "Show online status",
                description: "Let teammates see when you're active.",
                default: true,
              },
              {
                key: "readreceipts",
                label: "Read receipts",
                description: "Share when you've read a message.",
                default: true,
              },
              {
                key: "profile",
                label: "Public profile",
                description: "Make your profile discoverable in search.",
                default: false,
              },
            ]}
          />
        </>
      )

    default:
      return null
  }
}

// ─── Dialog ─────────────────────────────────────────────────────────────────

export interface SettingsDialogProps {
  /** Element that opens the dialog (rendered as the trigger). */
  trigger?: React.ReactElement
  /** Controlled open state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Section selected when the dialog first opens. @default "Account" */
  defaultSection?: string
}

export const SettingsDialog = ({
  trigger,
  open,
  onOpenChange,
  defaultSection = "Account",
}: SettingsDialogProps) => {
  const [active, setActive] = React.useState(defaultSection)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="overflow-hidden p-0 md:max-h-125 md:max-w-175 lg:max-w-200">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your {active.toLowerCase()} settings.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {NAV.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === active}
                          onClick={() => setActive(item.name)}
                        >
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
          <main className="flex h-120 flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SmartBreadcrumb
                  items={[
                    {
                      label: "Settings",
                      href: "#",
                      className: "hidden md:block",
                    },
                    { label: active },
                  ]}
                />
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <SectionContent section={active} />
            </div>
            <footer className="flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
              <SmartButton
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </SmartButton>
              <SmartButton size="sm" onClick={() => onOpenChange?.(false)}>
                Save changes
              </SmartButton>
            </footer>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
