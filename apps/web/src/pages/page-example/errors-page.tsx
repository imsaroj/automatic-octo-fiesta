/**
 * Page Example — Error states
 *
 * `SmartPageError` derives everything it shows from the value you caught. This
 * page feeds it the shapes a real app actually catches — an axios rejection, a
 * response envelope, a `TypeError: Failed to fetch` — and shows the three
 * variants, the async/auto retry behaviour, and `SmartPageErrorBoundary`.
 */

import { useState } from "react"
import { LifeBuoy } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
  SmartPageError,
  SmartPageErrorBoundary,
  type SmartPageErrorKind,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"

/** The shape an axios rejection carrying the backend's ApiResponse envelope has. */
const rejection = (status: number, message: string, code?: string) => ({
  message: `Request failed with status code ${status}`,
  code: "ERR_BAD_RESPONSE",
  response: {
    status,
    data: {
      success: false,
      code,
      message,
      path: "/api/v1/users",
      traceId: "b7f1c2e4-9a10-4c3d-8f21-6d5e0a4b7c88",
      timestamp: new Date().toISOString(),
    },
  },
})

const SAMPLES: { kind: SmartPageErrorKind; label: string; error: unknown }[] = [
  {
    kind: "server",
    label: "500",
    error: rejection(500, "Unable to reach the reporting service."),
  },
  {
    kind: "forbidden",
    label: "403",
    error: rejection(
      403,
      "You need the Reports role to open this.",
      "ACCESS_DENIED"
    ),
  },
  {
    kind: "notFound",
    label: "404",
    error: rejection(404, "That report no longer exists."),
  },
  {
    kind: "unauthorized",
    label: "401",
    error: rejection(401, "Your token has expired."),
  },
  {
    kind: "rateLimited",
    label: "429",
    error: rejection(429, "Slow down — 60 requests per minute."),
  },
  {
    kind: "maintenance",
    label: "503",
    error: rejection(503, "Upgrading the reporting cluster."),
  },
  {
    kind: "timeout",
    label: "Timeout",
    error: Object.assign(new Error("timeout of 5000ms exceeded"), {
      code: "ECONNABORTED",
    }),
  },
  {
    kind: "network",
    label: "Offline",
    error: new TypeError("Failed to fetch"),
  },
  {
    kind: "error",
    label: "Thrown",
    error: new Error("Cannot read properties of undefined (reading 'id')"),
  },
]

/** Throws on render — the failure a boundary exists for. */
const Exploding = ({ armed }: { armed: boolean }) => {
  if (armed) throw new Error("RevenueChart received a null series")
  return (
    <p className="text-sm text-muted-foreground">
      The chart is rendering normally.
    </p>
  )
}

const PageErrorsPage = () => {
  const [sample, setSample] = useState(0)
  const [autoRetry, setAutoRetry] = useState(false)
  const [armed, setArmed] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const current = SAMPLES[sample]!

  // A retry that takes a beat and fails — the honest case, and the one that
  // shows the pending button and the auto-retry budget running out.
  const failingRetry = () =>
    new Promise<void>((resolve) => {
      setAttempts((n) => n + 1)
      setTimeout(resolve, 900)
    })

  return (
    <SmartPage
      layout="document"
      title="Error states"
      description={
        <>
          Every panel below is the same component fed a different caught value —
          the icon, tone, copy, chips and whether a retry is even offered are
          all derived. Open <em>Technical details</em> on any of them to see the
          support blob.
        </>
      }
    >
      <SmartPageContent maxWidth="2xl" centered>
        <SmartPageSection
          title="Derived from the caught value"
          description={`Kind: ${current.kind} · retried ${attempts} time(s)`}
          bordered
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {SAMPLES.map((entry, index) => (
              <Button
                key={entry.label}
                size="sm"
                variant={index === sample ? "default" : "outline"}
                onClick={() => {
                  setSample(index)
                  setAttempts(0)
                }}
              >
                {entry.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={autoRetry ? "default" : "ghost"}
              onClick={() => setAutoRetry((on) => !on)}
            >
              Auto-retry {autoRetry ? "on" : "off"}
            </Button>
          </div>

          <div className="min-h-[420px] rounded-lg border">
            <SmartPageError
              key={`${sample}-${autoRetry}`}
              error={current.error}
              onRetry={failingRetry}
              autoRetryAfter={autoRetry ? 5 : undefined}
              actions={
                <Button variant="outline" size="sm">
                  <LifeBuoy /> Contact support
                </Button>
              }
              diagnostics={{ tenant: "acme", build: "a1b2c3d" }}
            />
          </div>
        </SmartPageSection>

        <SmartPageSection
          title="Inline variant"
          description="For a card, a section, or a panel that failed on its own."
          bordered
        >
          <SmartCard header={{ title: "Monthly revenue" }}>
            <SmartPageError
              variant="inline"
              error={rejection(500, "The aggregation job hasn't finished yet.")}
              onRetry={failingRetry}
            />
          </SmartCard>
        </SmartPageSection>

        <SmartPageSection
          title="Overlay variant"
          description="Covers the region it belongs to — how the server grid reports a failed fetch."
          bordered
        >
          <div className="relative min-h-[320px] overflow-hidden rounded-lg border bg-muted/20">
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-8 rounded bg-foreground/[0.06]" />
              ))}
            </div>
            <SmartPageError
              variant="overlay"
              error={new TypeError("Failed to fetch")}
              onRetry={failingRetry}
            />
          </div>
        </SmartPageSection>

        <SmartPageSection
          title="Error boundary"
          description="Render-time throws never reach a try/catch — they need a boundary."
          bordered
        >
          <div className="mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setArmed((on) => !on)}
            >
              {armed ? "Disarm" : "Throw during render"}
            </Button>
          </div>
          <SmartPageErrorBoundary
            variant="inline"
            resetKeys={[armed]}
            onError={(error) => console.warn("[boundary]", error)}
          >
            <Exploding armed={armed} />
          </SmartPageErrorBoundary>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default PageErrorsPage
