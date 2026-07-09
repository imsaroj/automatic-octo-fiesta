"use client"

import { SmartPage, type SmartPageProps } from "./smart-page"
import {
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageBreadcrumb,
} from "./smart-page-header"
import { SmartPageHero } from "./smart-page-hero"
import { SmartToolbar } from "./smart-toolbar"
import { SmartPageSearch } from "./smart-page-search"
import { SmartPageFilters } from "./smart-page-filters"
import {
  SmartPageTabs,
  SmartPageTab,
  SmartPageTabPanel,
} from "./smart-page-tabs"
import { SmartPageContent } from "./smart-page-content"
import { SmartPageSection } from "./smart-page-section"
import { SmartSidebar } from "./smart-sidebar"
import { SmartGridArea } from "./smart-grid-area"
import { SmartPageStatusBar } from "./smart-page-status-bar"
import { SmartPageFooter } from "./smart-page-footer"
import { SmartPageEmpty } from "./smart-page-empty"
import { SmartPageLoading } from "./smart-page-loading"
import { SmartPageError } from "./smart-page-error"

export type { SmartPageProps as SmartPageContainerProps }

/**
 * Compound wrapper around {@link SmartPage} that bundles all page slot
 * components as static properties so you only need one import.
 *
 * Every sub-component is identical to its standalone counterpart —
 * `SmartPageContainer.Header` is `SmartPageHeader`, etc.
 *
 * @example Grid page (single import)
 * ```tsx
 * import { SmartPageContainer as Page } from "@imsaroj/smart-ui/..."
 *
 * <Page>
 *   <Page.Header>
 *     <Page.Title>Users</Page.Title>
 *     <Page.Actions><Button>New</Button></Page.Actions>
 *   </Page.Header>
 *   <Page.Toolbar>…</Page.Toolbar>
 *   <Page.GridArea><UserGrid /></Page.GridArea>
 *   <Page.Footer><Page.StatusBar>42 rows</Page.StatusBar></Page.Footer>
 * </Page>
 * ```
 *
 * @example Document page
 * ```tsx
 * <Page layout="document">
 *   <Page.Header>
 *     <Page.Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
 *     <Page.Title>Profile</Page.Title>
 *   </Page.Header>
 *   <Page.Content maxWidth="2xl" centered>
 *     <Page.Section title="Personal info" divider>
 *       <ProfileForm />
 *     </Page.Section>
 *   </Page.Content>
 *   <Page.Footer>
 *     <Button type="submit">Save</Button>
 *   </Page.Footer>
 * </Page>
 * ```
 */
export const SmartPageContainer = Object.assign(
  (props: SmartPageProps) => <SmartPage {...props} />,
  {
    // ── Header zone ──────────────────────────────────────────────────────────
    Header: SmartPageHeader,
    Title: SmartPageTitle,
    Description: SmartPageDescription,
    Actions: SmartPageActions,
    Breadcrumb: SmartPageBreadcrumb,

    // ── Hero ─────────────────────────────────────────────────────────────────
    Hero: SmartPageHero,

    // ── Toolbar ──────────────────────────────────────────────────────────────
    Toolbar: SmartToolbar,

    // ── Search + Filters ─────────────────────────────────────────────────────
    Search: SmartPageSearch,
    Filters: SmartPageFilters,

    // ── Tabs ─────────────────────────────────────────────────────────────────
    Tabs: SmartPageTabs,
    Tab: SmartPageTab,
    TabPanel: SmartPageTabPanel,

    // ── Content ──────────────────────────────────────────────────────────────
    Content: SmartPageContent,
    Section: SmartPageSection,

    // ── Sidebar ──────────────────────────────────────────────────────────────
    Sidebar: SmartSidebar,

    // ── Grid area ────────────────────────────────────────────────────────────
    GridArea: SmartGridArea,

    // ── Status bar ───────────────────────────────────────────────────────────
    StatusBar: SmartPageStatusBar,

    // ── Footer ───────────────────────────────────────────────────────────────
    Footer: SmartPageFooter,

    // ── States ───────────────────────────────────────────────────────────────
    Empty: SmartPageEmpty,
    Loading: SmartPageLoading,
    Error: SmartPageError,
  }
)
