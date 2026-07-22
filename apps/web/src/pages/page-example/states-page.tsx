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
  SmartPageContent,
  SmartPageSection,
  SmartPageEmpty,
  SmartPageError,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"

type State = "ready" | "loading" | "error" | "empty"

/** The shape an axios rejection carrying the backend's ApiResponse envelope has. */
const FAILED_REQUEST = {
  message: "Request failed with status code 500",
  response: {
    status: 500,
    data: {
      success: false,
      message: "The reporting service didn't answer.",
      path: "/api/v1/reports/42",
      traceId: "b7f1c2e4-9a10-4c3d-8f21-6d5e0a4b7c88",
    },
  },
}

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
          // Everything shown — headline, tone, icon, status chip, trace chip and
          // the diagnostics blob — is derived from this one caught value. See
          // /page-example/errors for the full range.
          <SmartPageError
            error={FAILED_REQUEST}
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
      title="Page states"
      description={
        <>
          Toggle a state to swap the whole page for the matching built-in
          placeholder. The header only shows in the <code>ready</code> state
          because the state props replace <em>all</em> children.
        </>
      }
      actions={STATES.map((s) => (
        <Button
          key={s.id}
          size="sm"
          variant={state === s.id ? "default" : "outline"}
          onClick={() => setState(s.id)}
        >
          {s.label}
        </Button>
      ))}
    >
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
