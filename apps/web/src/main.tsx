import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"

import "@imsaroj/smart-ui/globals.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { SmartToaster } from "@imsaroj/smart-ui/smart-components/smart-toaster"
import { queryClient } from "@/lib/query-client"
import { enableMocking } from "@/mocks/enable"

const container = document.getElementById("root")
if (!container) throw new Error("Root container #root not found")

// Start the MSW mock API (dev only) before the first render so the server data
// grid page has a real endpoint to call.
void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
          <SmartToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
})
