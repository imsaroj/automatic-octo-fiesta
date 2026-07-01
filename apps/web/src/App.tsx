import { BrowserRouter, Routes, Route } from "react-router-dom"
import { PlaygroundShell } from "@/components/dashboard/playground-shell"

import DashboardPage from "@/pages/dashboard-page"

// Grids
import SimpleGridPage from "@/pages/grids/simple-grid-page"
import ServerGridPage from "@/pages/grids/server-grid-page"
import InfiniteGridPage from "@/pages/grids/infinite-grid-page"
import EditableGridPage from "@/pages/grids/editable-grid-page"
import MasterDetailGridPage from "@/pages/grids/master-detail-grid-page"

import CrudExamplePage from "@/pages/examples/crud-example-page"
import DashboardExamplePage from "@/pages/examples/dashboard-example-page"
import SettingsExamplePage from "@/pages/examples/settings-example-page"
import DetailExamplePage from "@/pages/examples/detail-example-page"
import WizardExamplePage from "@/pages/examples/wizard-example-page"
import AnalyticsExamplePage from "@/pages/examples/analytics-example-page"

import HistoryPage from "@/pages/playground/history-page"
import StarredPage from "@/pages/playground/starred-page"
import PlaygroundSettingsPage from "@/pages/playground/settings-page"

import GenesisPage from "@/pages/models/genesis-page"
import ExplorerPage from "@/pages/models/explorer-page"
import QuantumPage from "@/pages/models/quantum-page"

import IntroductionPage from "@/pages/docs/introduction-page"
import GetStartedPage from "@/pages/docs/get-started-page"
import TutorialsPage from "@/pages/docs/tutorials-page"
import ChangelogPage from "@/pages/docs/changelog-page"

import GeneralPage from "@/pages/settings/general-page"
import TeamPage from "@/pages/settings/team-page"
import BillingPage from "@/pages/settings/billing-page"
import LimitsPage from "@/pages/settings/limits-page"

import DesignEngineeringPage from "@/pages/projects/design-engineering-page"
import SalesMarketingPage from "@/pages/projects/sales-marketing-page"
import TravelPage from "@/pages/projects/travel-page"

export function App() {
  return (
    <BrowserRouter>
      <PlaygroundShell>
        <Routes>
          {/* Overview */}
          <Route path="/" element={<DashboardPage />} />

          {/* Grids */}
          <Route path="/grids/simple" element={<SimpleGridPage />} />
          <Route path="/grids/server" element={<ServerGridPage />} />
          <Route path="/grids/infinite" element={<InfiniteGridPage />} />
          <Route path="/grids/editable" element={<EditableGridPage />} />
          <Route
            path="/grids/master-detail"
            element={<MasterDetailGridPage />}
          />

          {/* Playground */}
          <Route path="/playground/history" element={<HistoryPage />} />
          <Route path="/playground/starred" element={<StarredPage />} />
          <Route
            path="/playground/settings"
            element={<PlaygroundSettingsPage />}
          />

          {/* Models */}
          <Route path="/models/genesis" element={<GenesisPage />} />
          <Route path="/models/explorer" element={<ExplorerPage />} />
          <Route path="/models/quantum" element={<QuantumPage />} />

          {/* Documentation */}
          <Route path="/docs/introduction" element={<IntroductionPage />} />
          <Route path="/docs/get-started" element={<GetStartedPage />} />
          <Route path="/docs/tutorials" element={<TutorialsPage />} />
          <Route path="/docs/changelog" element={<ChangelogPage />} />

          {/* Settings */}
          <Route path="/settings/general" element={<GeneralPage />} />
          <Route path="/settings/team" element={<TeamPage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/settings/limits" element={<LimitsPage />} />

          {/* Projects */}
          <Route
            path="/projects/design-engineering"
            element={<DesignEngineeringPage />}
          />
          <Route
            path="/projects/sales-marketing"
            element={<SalesMarketingPage />}
          />
          <Route path="/projects/travel" element={<TravelPage />} />

          {/* Smart-components examples */}
          <Route path="/examples/crud" element={<CrudExamplePage />} />
          <Route
            path="/examples/dashboard"
            element={<DashboardExamplePage />}
          />
          <Route path="/examples/settings" element={<SettingsExamplePage />} />
          <Route path="/examples/detail" element={<DetailExamplePage />} />
          <Route path="/examples/wizard" element={<WizardExamplePage />} />
          <Route
            path="/examples/analytics"
            element={<AnalyticsExamplePage />}
          />
        </Routes>
      </PlaygroundShell>
    </BrowserRouter>
  )
}
