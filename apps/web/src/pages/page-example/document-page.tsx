/**
 * Page Example — Document layout
 *
 * `layout="document"` → natural page flow. The browser/shell scrolls; content
 * is constrained to a readable max-width and centered. Ideal for articles,
 * documentation, legal text, and long-form settings.
 */

import {
  SmartPage,
  SmartPageTitle,
  SmartPageContent,
  SmartPageSection,
} from "@workspace/ui/smart-components/page"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"

const DocumentLayoutPage = () => {
  return (
    <SmartPage
      layout="document"
      breadcrumb={[
        { label: "Page Layouts", href: "/page-example" },
        { label: "Document" },
      ]}
      title={
        <div className="flex items-center gap-2">
          <SmartPageTitle>Building a design system</SmartPageTitle>
          <Badge variant="secondary">Guide</Badge>
        </div>
      }
      description={
        <>
          A worked example of the <code>document</code> layout — the page
          scrolls naturally and the content column stays comfortably readable.
        </>
      }
    >
      <SmartPageContent maxWidth="2xl" centered>
        <SmartPageSection title="Introduction">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The document layout applies no height tricks and no independent
            scroll containers. It grows to fit its content and lets the page
            scroll the way the browser intends. That makes it the right choice
            for anything text-heavy: articles, changelogs, terms of service, or
            a settings screen that simply flows top to bottom.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Content is placed inside{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              SmartPageContent
            </code>{" "}
            with <code>maxWidth</code> and <code>centered</code> so long lines
            never become fatiguing to read on wide monitors.
          </p>
        </SmartPageSection>

        <SmartPageSection
          title="Anatomy"
          description="Every document page is made of the same three parts."
          divider
        >
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Header</strong> — breadcrumb,
              title and description sit at the top and scroll away with the
              page.
            </li>
            <li>
              <strong className="text-foreground">Content</strong> — a centered
              reading column composed of one or more{" "}
              <code>SmartPageSection</code> blocks.
            </li>
            <li>
              <strong className="text-foreground">Sections</strong> — semantic
              groupings with an optional title, description and divider.
            </li>
          </ul>
        </SmartPageSection>

        <SmartPageSection title="Typography sampler" bordered>
          <h3 className="text-base font-semibold">A second-level heading</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Body copy renders at a comfortable measure. Inline elements like{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">code</code>,{" "}
            <span className="text-primary underline underline-offset-2">
              links
            </span>{" "}
            and <strong>strong emphasis</strong> all inherit the theme.
          </p>
          <blockquote className="border-l-2 pl-4 text-sm text-muted-foreground italic">
            “A layout preset is just a set of sensible defaults you didn't have
            to remember.”
          </blockquote>
        </SmartPageSection>

        <SmartPageSection title="When to reach for it">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Use the document layout whenever the primary job of the page is to
            be read. If instead the primary job is to hold a data grid, a
            dashboard of widgets, or a stepped flow, pick one of the other
            presets — they switch on scroll containment and stickiness that a
            document doesn't need.
          </p>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default DocumentLayoutPage
