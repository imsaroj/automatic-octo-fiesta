/**
 * Settings Example Page
 *
 * Demonstrates the "detail" layout:
 * - Header sticks at the top
 * - SmartPageContent is the scroll container (only body scrolls, not the header)
 * - SmartPageSection groups each settings category
 * - SmartPageTabs switches between settings categories
 * - SmartPageFooter pins save/cancel actions at the bottom
 */

import { useState } from "react"
import {
  Bell,
  CreditCard,
  Key,
  Palette,
  Shield,
  SlidersHorizontal,
  User,
} from "lucide-react"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { Input } from "@iamsaroj/smart-ui/smart-components/smart-input"
import { Label } from "@iamsaroj/smart-ui/smart-components/smart-label"
import { Switch } from "@iamsaroj/smart-ui/smart-components/smart-switch"
import {
  Avatar,
  AvatarFallback,
} from "@iamsaroj/smart-ui/smart-components/smart-avatar"
import {
  SmartPage,
  SmartPageTabs,
  SmartPageTab,
  SmartPageTabPanel,
  SmartPageContent,
  SmartPageSection,
  SmartPageFooter,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SettingsDialog } from "@/components/settings/settings-dialog"

// ─── Profile settings ─────────────────────────────────────────────────────────

const ProfileSettings = () => (
  <SmartPageContent maxWidth="2xl" padding="md">
    <SmartPageSection
      title="Personal information"
      description="Update your name, email, and profile picture."
      divider
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">SK</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Change avatar
          </Button>
          <Button variant="ghost" size="sm">
            Remove
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first-name" className="text-xs">
            First name
          </Label>
          <Input id="first-name" defaultValue="Saroj" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last-name" className="text-xs">
            Last name
          </Label>
          <Input id="last-name" defaultValue="Kumar" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="email" className="text-xs">
            Email address
          </Label>
          <Input id="email" type="email" defaultValue="imsaroj@g.skku.edu" />
        </div>
      </div>
    </SmartPageSection>

    <SmartPageSection
      title="Danger zone"
      description="Irreversible actions that affect your account permanently."
      divider
    >
      <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div>
          <p className="text-xs font-medium">Delete account</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <Button variant="destructive" size="sm">
          Delete account
        </Button>
      </div>
    </SmartPageSection>
  </SmartPageContent>
)

// ─── Notifications settings ───────────────────────────────────────────────────

const NotificationsSettings = () => {
  const [prefs, setPrefs] = useState({
    email_digest: true,
    browser_push: false,
    mobile_push: true,
    marketing: false,
    product_updates: true,
    security_alerts: true,
  })

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    {
      key: "email_digest",
      label: "Weekly email digest",
      desc: "A summary of activity sent every Monday.",
    },
    {
      key: "browser_push",
      label: "Browser notifications",
      desc: "Push notifications in your browser.",
    },
    {
      key: "mobile_push",
      label: "Mobile push",
      desc: "Push notifications on your phone.",
    },
    {
      key: "product_updates",
      label: "Product updates",
      desc: "New features and improvements.",
    },
    {
      key: "marketing",
      label: "Marketing emails",
      desc: "Promotions, offers, and announcements.",
    },
    {
      key: "security_alerts",
      label: "Security alerts",
      desc: "Unusual sign-ins and security events.",
    },
  ]

  return (
    <SmartPageContent maxWidth="2xl" padding="md">
      <SmartPageSection
        title="Notification preferences"
        description="Choose how and when you receive notifications from us."
        divider
      >
        <div className="flex flex-col divide-y">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={() => toggle(key)}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      </SmartPageSection>
    </SmartPageContent>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const SettingsExamplePage = () => {
  const [tab, setTab] = useState("profile")
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <SmartPage
      layout="detail"
      breadcrumb={[{ label: "Account settings" }]}
      title="Account settings"
      description="Manage your profile, preferences, and security."
      actions={
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          trigger={
            <Button variant="outline" size="sm">
              <SlidersHorizontal /> Open in dialog
            </Button>
          }
        />
      }
    >
      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <SmartPageTabs value={tab} onValueChange={setTab} variant="line">
        <SmartPageTab value="profile">
          <User className="size-3.5" />
          Profile
        </SmartPageTab>
        <SmartPageTab value="notifications">
          <Bell className="size-3.5" />
          Notifications
        </SmartPageTab>
        <SmartPageTab value="security">
          <Shield className="size-3.5" />
          Security
        </SmartPageTab>
        <SmartPageTab value="billing">
          <CreditCard className="size-3.5" />
          Billing
        </SmartPageTab>
        <SmartPageTab value="appearance">
          <Palette className="size-3.5" />
          Appearance
        </SmartPageTab>
        <SmartPageTab value="api">
          <Key className="size-3.5" />
          API
        </SmartPageTab>

        <SmartPageTabPanel value="profile">
          <ProfileSettings />
        </SmartPageTabPanel>
        <SmartPageTabPanel value="notifications">
          <NotificationsSettings />
        </SmartPageTabPanel>
        {["security", "billing", "appearance", "api"].map((v) => (
          <SmartPageTabPanel key={v} value={v}>
            <SmartPageContent padding="md">
              <p className="text-sm text-muted-foreground capitalize">
                {v} settings coming soon.
              </p>
            </SmartPageContent>
          </SmartPageTabPanel>
        ))}
      </SmartPageTabs>

      {/* ── Footer: save / cancel ───────────────────────────────────────────── */}
      <SmartPageFooter>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save changes</Button>
      </SmartPageFooter>
    </SmartPage>
  )
}

export default SettingsExamplePage
