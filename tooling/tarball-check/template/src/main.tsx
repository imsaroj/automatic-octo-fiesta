/**
 * Imports one runtime symbol from several export subpaths so the built bundle
 * proves the published exports map, the compiled dist, and the transitive
 * dependency graph all resolve from a clean install — the things the
 * in-monorepo checks (which consume source, not the tarball) cannot see.
 */
import { createRoot } from "react-dom/client"
import { z } from "zod"

import "./app.css"

import { SmartButton } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartUIProvider } from "@iamsaroj/smart-ui/smart-components/provider"
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"
import { toServerFilters } from "@iamsaroj/smart-ui/data-grid"
import { SmartTree } from "@iamsaroj/smart-ui/tree"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

const schema = z.object({ name: z.string().min(1) })
type Values = z.infer<typeof schema>
const fields: FieldDefinition<Values>[] = [
  { name: "name", type: "text", label: "Name" },
]

const App = () => (
  <SmartUIProvider defaults={{ form: { columns: 1 } }}>
    <main className={cn("grid gap-4 p-6")}>
      <SmartButton>It builds</SmartButton>
      <SmartForm schema={schema} fields={fields} onSubmit={() => {}} />
      <SmartTree nodes={[{ id: "a", label: "a" }]} />
      <pre>{JSON.stringify(toServerFilters({ q: "x" }))}</pre>
    </main>
  </SmartUIProvider>
)

createRoot(document.getElementById("root")!).render(<App />)
