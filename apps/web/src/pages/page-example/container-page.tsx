/**
 * Page Example — Compound API (SmartPageContainer)
 *
 * `SmartPageContainer` bundles every page slot as a static property, so the
 * whole layout comes from a single import. `SmartPageContainer.Header` is
 * exactly `SmartPageHeader`, `.Content` is `SmartPageContent`, and so on — it's
 * a convenience surface, not a different component.
 */

import { Plus } from "lucide-react"
import { SmartPageContainer as Page } from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"

export default function ContainerLayoutPage() {
  return (
    <Page layout="document">
      <Page.Header>
        <Page.Breadcrumb
          items={[
            { label: "Page Layouts", href: "/page-example" },
            { label: "Compound API" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <Page.Title>Single-import layout</Page.Title>
            <Page.Description>
              Everything below comes from one <code>SmartPageContainer</code>{" "}
              import via its dot-notation sub-components.
            </Page.Description>
          </div>
          <Page.Actions>
            <Button size="sm">
              <Plus /> New
            </Button>
          </Page.Actions>
        </div>
      </Page.Header>

      <Page.Content maxWidth="2xl" centered>
        <Page.Section
          title="Why a compound API?"
          description="Fewer imports, same components."
          divider
        >
          <p className="text-sm text-muted-foreground">
            When a page uses many slots, importing each one adds up. The
            compound surface keeps the call site tidy — <code>Page.Header</code>
            , <code>Page.Content</code>, <code>Page.Section</code>,{" "}
            <code>Page.Footer</code> — while rendering the identical elements
            you would get from the standalone exports.
          </p>
        </Page.Section>

        <Page.Section title="Available on the container" bordered>
          <div className="flex flex-wrap gap-2">
            {[
              "Header",
              "Title",
              "Description",
              "Actions",
              "Breadcrumb",
              "Hero",
              "Toolbar",
              "Search",
              "Filters",
              "Tabs",
              "Tab",
              "TabPanel",
              "Content",
              "Section",
              "Sidebar",
              "GridArea",
              "StatusBar",
              "Footer",
              "Empty",
              "Loading",
              "Error",
            ].map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="font-mono text-[10px]"
              >
                Page.{name}
              </Badge>
            ))}
          </div>
        </Page.Section>
      </Page.Content>

      <Page.Footer>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save changes</Button>
      </Page.Footer>
    </Page>
  )
}
