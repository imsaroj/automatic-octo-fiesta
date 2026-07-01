import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { SmartToaster } from "@workspace/ui/smart-components/smart-toaster"
import { enableMocking } from "@/mocks/enable"

const container = document.getElementById("root")
if (!container) throw new Error("Root container #root not found")

// Start the MSW mock API (dev only) before the first render so the server data
// grid page has a real endpoint to call.
void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <App />
        <SmartToaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </StrictMode>
  )
})
