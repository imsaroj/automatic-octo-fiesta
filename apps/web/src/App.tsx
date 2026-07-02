import { BrowserRouter, Routes, Route } from "react-router-dom"
import { PlaygroundShell } from "@/components/dashboard/playground-shell"

import DashboardPage from "@/pages/dashboard-page"

// Grids
import SimpleGridPage from "@/pages/grids/simple-grid-page"
import ServerGridPage from "@/pages/grids/server-grid-page"
import InfiniteGridPage from "@/pages/grids/infinite-grid-page"
import EditableGridPage from "@/pages/grids/editable-grid-page"
import MasterDetailGridPage from "@/pages/grids/master-detail-grid-page"

// Examples
import CrudExamplePage from "@/pages/examples/crud-example-page"
import DashboardExamplePage from "@/pages/examples/dashboard-example-page"
import SettingsExamplePage from "@/pages/examples/settings-example-page"
import DetailExamplePage from "@/pages/examples/detail-example-page"
import WizardExamplePage from "@/pages/examples/wizard-example-page"
import AnalyticsExamplePage from "@/pages/examples/analytics-example-page"
import BasicTextFieldsPage from "@/pages/examples/basic-text-fields-page"

// Projects
import DesignEngineeringPage from "@/pages/projects/design-engineering-page"
import SalesMarketingPage from "@/pages/projects/sales-marketing-page"
import TravelPage from "@/pages/projects/travel-page"

// Smart component showcases
import FormsPage from "@/pages/smart/forms-page"
import PickersPage from "@/pages/smart/pickers-page"
import OverlaysPage from "@/pages/smart/overlays-page"
import FeedbackPage from "@/pages/smart/feedback-page"
import TextEditorPage from "@/pages/smart/text-editor-page"

// Form engine demos
import BasicFormPage from "@/pages/form-engine/basic-form-page"
import DynamicFormPage from "@/pages/form-engine/dynamic-form-page"
import MultiStepFormPage from "@/pages/form-engine/multi-step-form-page"

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

          {/* Examples */}
          <Route path="/examples/fields" element={<BasicTextFieldsPage />} />
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

          {/* Smart component showcases */}
          <Route path="/smart/forms" element={<FormsPage />} />
          <Route path="/smart/pickers" element={<PickersPage />} />
          <Route path="/smart/overlays" element={<OverlaysPage />} />
          <Route path="/smart/feedback" element={<FeedbackPage />} />
          <Route path="/smart/text-editor" element={<TextEditorPage />} />

          {/* Form engine */}
          <Route path="/form-engine/basic" element={<BasicFormPage />} />
          <Route path="/form-engine/dynamic" element={<DynamicFormPage />} />
          <Route path="/form-engine/wizard" element={<MultiStepFormPage />} />
        </Routes>
      </PlaygroundShell>
    </BrowserRouter>
  )
}
