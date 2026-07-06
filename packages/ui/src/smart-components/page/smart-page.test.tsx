import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPage, SMART_PAGE_SLOT } from "./smart-page"
import { usePageContext, type PageLayout } from "./page-context"

/**
 * SmartPage auto-detects its layout from the slot-tagged children and dispatches
 * to the matching renderer. These lock in that detection + dispatch after the
 * layout renderers were extracted into `./layouts/*` — a `sidebar` slot must
 * still produce the split layout (bordered sidebar column), a `grid-area` slot
 * the standard layout, and `loading`/`error` must replace the children.
 */

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

/** Build a slot-tagged component the way the real slot components are tagged. */
const slot = (name: string, testid: string) =>
  Object.assign(() => <div data-testid={testid} />, {
    [SMART_PAGE_SLOT]: name,
  })

test("a sidebar slot renders the split layout with a bordered sidebar column", () => {
  const Sidebar = slot("sidebar", "sidebar-content")
  const Content = slot("content", "main-content")
  mount(
    <SmartPage>
      <Content />
      <Sidebar />
    </SmartPage>
  )

  // Split layout wraps the sidebar in a bordered right column.
  const sidebarCol = container.querySelector(".border-l")
  expect(sidebarCol).not.toBeNull()
  expect(
    sidebarCol!.querySelector('[data-testid="sidebar-content"]')
  ).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).not.toBeNull()
})

test("a grid-area slot renders the standard layout (no split sidebar column)", () => {
  const Grid = slot("grid-area", "grid-content")
  mount(
    <SmartPage>
      <Grid />
    </SmartPage>
  )

  expect(container.querySelector('[data-testid="grid-content"]')).not.toBeNull()
  // Standard layout has no bordered sidebar column.
  expect(container.querySelector(".border-l")).toBeNull()
})

test("the loading prop replaces children with a status region", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage loading loadingLabel="Fetching…">
      <Content />
    </SmartPage>
  )

  const status = container.querySelector('[role="status"]')
  expect(status).not.toBeNull()
  expect(status!.textContent).toContain("Fetching…")
  // Children are not rendered while loading.
  expect(container.querySelector('[data-testid="main-content"]')).toBeNull()
})

test("the error prop replaces children with the error node", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage error={<div data-testid="err">Boom</div>}>
      <Content />
    </SmartPage>
  )

  expect(container.querySelector('[data-testid="err"]')).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).toBeNull()
})

test("the empty prop replaces children with the empty node", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage empty={<div data-testid="empty">Nothing yet</div>}>
      <Content />
    </SmartPage>
  )

  expect(container.querySelector('[data-testid="empty"]')).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).toBeNull()
})

// ─── detectLayout ──────────────────────────────────────────────────────────────

/** Reads the resolved layout out of PageContext from inside the page. */
const LayoutProbe = () => {
  const { layout } = usePageContext()
  return <output data-testid="layout">{layout}</output>
}

/**
 * A slot-tagged component that renders the probe as its content, so the probe
 * is guaranteed to be rendered whichever bucket the layout treats as main.
 */
const probeSlot = (name: string) =>
  Object.assign(() => <LayoutProbe />, { [SMART_PAGE_SLOT]: name })

const detectedLayout = (children: React.ReactNode): PageLayout => {
  mount(<SmartPage>{children}</SmartPage>)
  const probe = container.querySelector('[data-testid="layout"]')
  const layout = probe!.textContent as PageLayout
  act(() => root.unmount())
  container.remove()
  return layout
}

test("detectLayout: grid-area → grid, hero → dashboard, sidebar → split, else document", () => {
  const Grid = probeSlot("grid-area")
  const Hero = probeSlot("hero")
  const Sidebar = probeSlot("sidebar")
  const Content = probeSlot("content")

  expect(detectedLayout(<Grid />)).toBe("grid")
  expect(detectedLayout(<Hero />)).toBe("dashboard")
  expect(detectedLayout(<Sidebar />)).toBe("split")
  expect(detectedLayout(<Content />)).toBe("document")
  expect(detectedLayout(<LayoutProbe />)).toBe("document")
})

test("grid-area wins over hero and sidebar when several slots are present", () => {
  const Grid = probeSlot("grid-area")
  const Hero = slot("hero", "h")
  const Sidebar = slot("sidebar", "s")
  // Passed as an array (not a fragment): slot detection walks direct children
  // only — a fragment wrapper hides the slots, by design.
  expect(
    detectedLayout([<Hero key="h" />, <Grid key="g" />, <Sidebar key="s" />])
  ).toBe("grid")
})

test("an explicit layout prop overrides detection", () => {
  const Content = probeSlot("content")
  const Sidebar = slot("sidebar", "s")
  mount(
    <SmartPage layout="document">
      <Content />
      <Sidebar />
    </SmartPage>
  )
  expect(container.querySelector('[data-testid="layout"]')!.textContent).toBe(
    "document"
  )
  // Document layout renders the standard (non-split) path — no sidebar column.
  expect(container.querySelector(".border-l")).toBeNull()
})

// ─── slot bucketing ────────────────────────────────────────────────────────────

test("slots render in layout order regardless of JSX order", () => {
  const Header = slot("header", "hdr")
  const Footer = slot("footer", "ftr")
  const Content = slot("content", "cnt")

  mount(
    <SmartPage>
      <Footer />
      <p data-testid="loose">Loose body text</p>
      <Content />
      <Header />
    </SmartPage>
  )

  const order = Array.from(container.querySelectorAll("[data-testid]")).map(
    (el) => el.getAttribute("data-testid")
  )
  // The loose <p> is absent: with a content slot present, `body` children are
  // superseded (main region priority: grid-area → content → body).
  expect(order).toEqual(["hdr", "cnt", "ftr"])
})

test("without a content slot, loose children become the main region", () => {
  mount(
    <SmartPage>
      <p data-testid="loose">Loose body text</p>
    </SmartPage>
  )
  expect(container.querySelector('[data-testid="loose"]')).not.toBeNull()
})

// ─── flat header props ───────────────────────────────────────────────────────────

test("flat header props render a header without nesting SmartPageHeader", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage
      breadcrumb={[{ label: "Admin", href: "#" }, { label: "Users" }]}
      title="Users"
      description="Manage members."
      actions={<button data-testid="action">Invite</button>}
    >
      <Content />
    </SmartPage>
  )

  const header = container.querySelector('[data-slot="page-header"]')
  expect(header).not.toBeNull()
  expect(header!.querySelector('[data-slot="page-title"]')!.textContent).toBe(
    "Users"
  )
  expect(
    header!.querySelector('[data-slot="page-description"]')!.textContent
  ).toBe("Manage members.")
  expect(header!.querySelector('[data-testid="action"]')).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).not.toBeNull()
})

test("a flat header renders ahead of a composed SmartPageHeader child", () => {
  const Header = slot("header", "composed-header")
  mount(
    <SmartPage title="Flat title">
      <Header />
    </SmartPage>
  )

  // The flat header (its title) comes before the composed header child.
  const flat = container.querySelector('[data-slot="page-title"]')
  const composed = container.querySelector('[data-testid="composed-header"]')
  expect(flat).not.toBeNull()
  expect(composed).not.toBeNull()
  expect(
    flat!.compareDocumentPosition(composed!) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
})
