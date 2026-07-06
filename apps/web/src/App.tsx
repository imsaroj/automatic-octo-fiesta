import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SmartPageLoading } from "@workspace/ui/smart-components/page"
import { PlaygroundShell } from "@/components/dashboard/playground-shell"

const DashboardPage = lazy(() => import("@/pages/dashboard-page"))

// Grids
const SimpleGridPage = lazy(() => import("@/pages/grids/simple-grid-page"))
const ServerGridPage = lazy(() => import("@/pages/grids/server-grid-page"))
const InfiniteGridPage = lazy(() => import("@/pages/grids/infinite-grid-page"))
const EditableGridPage = lazy(() => import("@/pages/grids/editable-grid-page"))
const MasterDetailGridPage = lazy(
  () => import("@/pages/grids/master-detail-grid-page")
)

// Examples
const CrudExamplePage = lazy(() => import("@/pages/examples/crud-example-page"))
const DashboardExamplePage = lazy(
  () => import("@/pages/examples/dashboard-example-page")
)
const SettingsExamplePage = lazy(
  () => import("@/pages/examples/settings-example-page")
)
const DetailExamplePage = lazy(
  () => import("@/pages/examples/detail-example-page")
)
const WizardExamplePage = lazy(
  () => import("@/pages/examples/wizard-example-page")
)
const AnalyticsExamplePage = lazy(
  () => import("@/pages/examples/analytics-example-page")
)
const BasicTextFieldsPage = lazy(
  () => import("@/pages/examples/basic-text-fields-page")
)

// Projects
const DesignEngineeringPage = lazy(
  () => import("@/pages/projects/design-engineering-page")
)
const SalesMarketingPage = lazy(
  () => import("@/pages/projects/sales-marketing-page")
)
const TravelPage = lazy(() => import("@/pages/projects/travel-page"))

// Smart component showcases
const FormsPage = lazy(() => import("@/pages/smart/forms-page"))
const PickersPage = lazy(() => import("@/pages/smart/pickers-page"))
const OverlaysPage = lazy(() => import("@/pages/smart/overlays-page"))
const FeedbackPage = lazy(() => import("@/pages/smart/feedback-page"))
const TextEditorPage = lazy(() => import("@/pages/smart/text-editor-page"))
const ActionButtonsPage = lazy(
  () => import("@/pages/smart/action-buttons-page")
)

// Page layout examples
const PageExampleOverview = lazy(
  () => import("@/pages/page-example/overview-page")
)
const DocumentLayoutPage = lazy(
  () => import("@/pages/page-example/document-page")
)
const DashboardLayoutPage = lazy(
  () => import("@/pages/page-example/dashboard-page")
)
const GridLayoutPage = lazy(() => import("@/pages/page-example/grid-page"))
const SplitLayoutPage = lazy(() => import("@/pages/page-example/split-page"))
const DetailLayoutPage = lazy(() => import("@/pages/page-example/detail-page"))
const WizardLayoutPage = lazy(() => import("@/pages/page-example/wizard-page"))
const FullscreenLayoutPage = lazy(
  () => import("@/pages/page-example/fullscreen-page")
)
const TabsLayoutPage = lazy(() => import("@/pages/page-example/tabs-page"))
const PageStatesPage = lazy(() => import("@/pages/page-example/states-page"))
const ContainerLayoutPage = lazy(
  () => import("@/pages/page-example/container-page")
)

// Form engine demos
const BasicFormPage = lazy(() => import("@/pages/form-engine/basic-form-page"))
const AllFieldsPage = lazy(() => import("@/pages/form-engine/all-fields-page"))
const DynamicFormPage = lazy(
  () => import("@/pages/form-engine/dynamic-form-page")
)
const MultiStepFormPage = lazy(
  () => import("@/pages/form-engine/multi-step-form-page")
)

export const App = () => (
  <BrowserRouter>
    <PlaygroundShell>
      <Suspense fallback={<SmartPageLoading />}>
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
          <Route path="/smart/buttons" element={<ActionButtonsPage />} />

          {/* Page layout examples */}
          <Route path="/page-example" element={<PageExampleOverview />} />
          <Route
            path="/page-example/document"
            element={<DocumentLayoutPage />}
          />
          <Route
            path="/page-example/dashboard"
            element={<DashboardLayoutPage />}
          />
          <Route path="/page-example/grid" element={<GridLayoutPage />} />
          <Route path="/page-example/split" element={<SplitLayoutPage />} />
          <Route path="/page-example/detail" element={<DetailLayoutPage />} />
          <Route path="/page-example/wizard" element={<WizardLayoutPage />} />
          <Route
            path="/page-example/fullscreen"
            element={<FullscreenLayoutPage />}
          />
          <Route path="/page-example/tabs" element={<TabsLayoutPage />} />
          <Route path="/page-example/states" element={<PageStatesPage />} />
          <Route
            path="/page-example/container"
            element={<ContainerLayoutPage />}
          />

          {/* Form engine */}
          <Route path="/form-engine/basic" element={<BasicFormPage />} />
          <Route path="/form-engine/all-fields" element={<AllFieldsPage />} />
          <Route path="/form-engine/dynamic" element={<DynamicFormPage />} />
          <Route path="/form-engine/wizard" element={<MultiStepFormPage />} />
        </Routes>
      </Suspense>
    </PlaygroundShell>
  </BrowserRouter>
)
