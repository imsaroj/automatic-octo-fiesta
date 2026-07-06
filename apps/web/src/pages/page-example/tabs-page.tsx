/**
 * Page Example — Tabbed page
 *
 * `SmartPageTabs` renders a page-level tab strip below the header. Each
 * `SmartPageTab` trigger pairs with a `SmartPageTabPanel` that shows only when
 * active. Use it to navigate between views that share the same page header.
 */

import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageTabs,
  SmartPageTab,
  SmartPageTabPanel,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"
import { SmartStatCard } from "@workspace/ui/smart-components/smart-stat-card"

export default function TabsLayoutPage() {
  return (
    <SmartPage layout="detail">
      <SmartPageHeader border={false}>
        <div className="flex items-start justify-between">
          <div>
            <SmartPageTitle>Project Alpha</SmartPageTitle>
            <SmartPageDescription>
              A tabbed page keeps one header while swapping the body between
              views.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button size="sm">Deploy</Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      <SmartPageTabs defaultValue="overview" variant="line">
        <SmartPageTab value="overview">Overview</SmartPageTab>
        <SmartPageTab value="activity">Activity</SmartPageTab>
        <SmartPageTab value="settings">Settings</SmartPageTab>

        <SmartPageTabPanel value="overview">
          <SmartPageContent padding="md">
            <SmartPageSection padding={false}>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <SmartStatCard
                  label="Deploys"
                  value="128"
                  delta={8}
                  trend="up"
                />
                <SmartStatCard label="Uptime" value="99.98%" trend="neutral" />
                <SmartStatCard
                  label="Errors"
                  value="12"
                  delta={-40}
                  trend="down"
                />
                <SmartStatCard
                  label="Latency"
                  value="184ms"
                  delta={-6}
                  trend="down"
                />
              </div>
            </SmartPageSection>
            <SmartPageSection title="About" bordered>
              <p className="text-sm text-muted-foreground">
                Project Alpha is the flagship service powering the public API.
                This Overview tab summarizes its health; switch tabs for
                activity and configuration without leaving the page.
              </p>
            </SmartPageSection>
          </SmartPageContent>
        </SmartPageTabPanel>

        <SmartPageTabPanel value="activity">
          <SmartPageContent padding="md">
            <SmartPageSection title="Recent activity" bordered>
              {[
                ["Deployed v2.4.0 to production", "2h ago"],
                ["Merged PR #482 — sticky header fix", "5h ago"],
                ["Scaled to 6 instances", "Yesterday"],
                ["Rotated API keys", "2 days ago"],
              ].map(([text, time]) => (
                <div
                  key={text}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{text}</span>
                  <time className="text-xs text-muted-foreground">{time}</time>
                </div>
              ))}
            </SmartPageSection>
          </SmartPageContent>
        </SmartPageTabPanel>

        <SmartPageTabPanel value="settings">
          <SmartPageContent padding="md" maxWidth="xl">
            <SmartPageSection
              title="General"
              description="Configure how Project Alpha behaves."
              divider
            >
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Auto-deploy</p>
                  <p className="text-xs text-muted-foreground">
                    Deploy automatically when main passes CI.
                  </p>
                </div>
                <Badge variant="secondary">On</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Region</p>
                  <p className="text-xs text-muted-foreground">us-east-1</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </SmartPageSection>
          </SmartPageContent>
        </SmartPageTabPanel>
      </SmartPageTabs>
    </SmartPage>
  )
}
