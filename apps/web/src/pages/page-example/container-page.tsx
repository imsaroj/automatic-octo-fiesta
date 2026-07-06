/**
 * Page Example — Slot composition
 *
 * A plain `document` layout composed from the standalone slot exports
 * (`SmartPageHeader`, `SmartPageContent`, `SmartPageSection`, `SmartPageFooter`,
 * …) — the same import style every other example uses. It doubles as a quick
 * reference for the full slot vocabulary available on `SmartPage`.
 */

import { Plus } from "lucide-react"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageBreadcrumb,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageContent,
  SmartPageSection,
  SmartPageFooter,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"

const SLOTS = [
  "SmartPageHeader",
  "SmartPageTitle",
  "SmartPageDescription",
  "SmartPageActions",
  "SmartPageBreadcrumb",
  "SmartPageHero",
  "SmartToolbar",
  "SmartPageSearch",
  "SmartPageFilters",
  "SmartPageTabs",
  "SmartPageTab",
  "SmartPageTabPanel",
  "SmartPageContent",
  "SmartPageSection",
  "SmartSidebar",
  "SmartGridArea",
  "SmartPageStatusBar",
  "SmartPageFooter",
  "SmartPageEmpty",
  "SmartPageLoading",
  "SmartPageError",
]

export default function ContainerLayoutPage() {
  return (
    <SmartPage layout="document">
      <SmartPageHeader>
        <SmartPageBreadcrumb
          items={[
            { label: "Page Layouts", href: "/page-example" },
            { label: "Composition" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <SmartPageTitle>Slot composition</SmartPageTitle>
            <SmartPageDescription>
              Every region is a standalone slot component you drop in as a
              direct child of <code>SmartPage</code> — the same import style
              used across all of these examples.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            <Button size="sm">
              <Plus /> New
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" centered={true}>
        <SmartPageSection
          title="How composition works"
          description="Slots are order-independent — SmartPage places each one."
          divider
        >
          <p className="text-sm text-muted-foreground">
            You import the slots you need and render them as children.{" "}
            <code>SmartPage</code> reads which slots are present, picks the
            right layout, and wires up sticky regions and scroll containment for
            you — so the same building blocks compose a document, a dashboard, a
            grid or a wizard.
          </p>
        </SmartPageSection>

        <SmartPageSection title="Available slots" bordered>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="font-mono text-[10px]"
              >
                {name}
              </Badge>
            ))}
          </div>
        </SmartPageSection>
      </SmartPageContent>

      <SmartPageFooter>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save changes</Button>
      </SmartPageFooter>
    </SmartPage>
  )
}
