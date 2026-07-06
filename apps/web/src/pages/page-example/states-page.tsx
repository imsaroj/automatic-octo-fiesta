/**
 * Page Example — Page states
 *
 * SmartPage can replace its children with a full-page state via the `loading`,
 * `error` and `empty` props. This page toggles between them so you can see each
 * built-in state component: `SmartPageLoading`, `SmartPageError` and
 * `SmartPageEmpty`.
 */

import { useState } from "react"
import { Inbox, Plus } from "lucide-react"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageContent,
  SmartPageSection,
  SmartPageEmpty,
  SmartPageError,
} from "@workspace/ui/smart-components/page"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"

type State = "ready" | "loading" | "error" | "empty"

const STATES: { id: State; label: string }[] = [
  { id: "ready", label: "Ready" },
  { id: "loading", label: "Loading" },
  { id: "error", label: "Error" },
  { id: "empty", label: "Empty" },
]

const StatesPage = () => {
  const [state, setState] = useState<State>("ready")

  return (
    <SmartPage
      layout="document"
      loading={state === "loading"}
      loadingLabel="Loading report…"
      error={
        state === "error" ? (
          <SmartPageError
            title="Failed to load report"
            description="The server returned a 500 while fetching this page."
            onRetry={() => setState("ready")}
          />
        ) : undefined
      }
      empty={
        state === "empty" ? (
          <SmartPageEmpty
            icon={<Inbox />}
            title="Nothing here yet"
            description="When records are created they'll show up on this page."
            action={
              <Button size="sm" onClick={() => setState("ready")}>
                <Plus /> Create the first record
              </Button>
            }
          />
        ) : undefined
      }
    >
      <SmartPageHeader>
        <div className="flex items-start justify-between">
          <div>
            <SmartPageTitle>Page states</SmartPageTitle>
            <SmartPageDescription>
              Toggle a state to swap the whole page for the matching built-in
              placeholder. The header only shows in the <code>ready</code> state
              because the state props replace <em>all</em> children.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            {STATES.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={state === s.id ? "default" : "outline"}
                onClick={() => setState(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      <SmartPageContent maxWidth="2xl" centered>
        <SmartPageSection title="Ready state" bordered>
          <p className="text-sm text-muted-foreground">
            This is the normal content. Use the buttons above to preview the
            loading, error and empty states — each is passed to the matching
            SmartPage prop and rendered in place of everything else.
          </p>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default StatesPage
