/**
 * Detail Example Page
 *
 * Demonstrates the "split" layout — classic issue / entity detail pattern
 * (GitHub Issues, Linear, Jira):
 * - Header sticks at top
 * - SmartPageContent (left) is the primary scroll container
 * - SmartSidebar (right) scrolls independently
 * - Auto-detected from SmartSidebar as a direct child
 *
 * No layout prop needed because SmartPage detects SmartSidebar → "split".
 */

import { useState } from "react"
import {
  CheckCircle2,
  Circle,
  Clock,
  GitBranch,
  MessageSquare,
  Paperclip,
  Tag,
  ThumbsUp,
  User,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageActions,
  SmartPageBreadcrumb,
  SmartPageContent,
  SmartPageSection,
  SmartSidebar,
} from "@workspace/ui/smart-components/page"
import { Separator } from "@workspace/ui/components/separator"

// ─── Fake data ─────────────────────────────────────────────────────────────────

const COMMENTS = [
  {
    id: 1,
    author: "Alice",
    initials: "A",
    time: "3 hours ago",
    body: "I can reproduce this on Safari 17.2 as well. The CSS grid layout collapses on viewport widths below 480px.",
    reactions: { "👍": 4, "🎯": 2 },
  },
  {
    id: 2,
    author: "Bob",
    initials: "B",
    time: "1 hour ago",
    body: "Looking at the code, the grid template columns aren't using `minmax()`. A quick fix would be `grid-cols-[repeat(auto-fit,minmax(160px,1fr))]`.",
    reactions: { "👍": 6 },
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function DetailExamplePage() {
  const [comment, setComment] = useState("")
  const [resolved, setResolved] = useState(false)

  return (
    // Auto-detected as "split" because SmartSidebar is a direct child
    <SmartPage>
      <SmartPageHeader compact>
        <SmartPageBreadcrumb
          items={[
            { label: "Projects", href: "#" },
            { label: "smart-components", href: "#" },
            { label: "Issues" },
          ]}
        />
        <div className="flex items-center justify-between">
          <SmartPageTitle as="h1">
            <span className="text-muted-foreground font-normal">#42 — </span>
            Grid layout collapses on narrow viewports
          </SmartPageTitle>
          <SmartPageActions>
            <Button
              variant={resolved ? "secondary" : "outline"}
              size="sm"
              onClick={() => setResolved((v) => !v)}
            >
              {resolved ? (
                <><CheckCircle2 className="text-green-600" /> Resolved</>
              ) : (
                <><Circle /> Mark resolved</>
              )}
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      {/* ── Main content (scrolls) ──────────────────────────────────────────── */}
      <SmartPageContent padding="md">
        {/* Issue body */}
        <SmartPageSection padding={false}>
          <div className="flex gap-3">
            <Avatar className="size-8 mt-0.5 shrink-0">
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold">Saroj Kumar</span>
                <span className="text-xs text-muted-foreground">opened this issue 2 days ago</span>
              </div>
              <div className="text-xs leading-relaxed text-foreground space-y-2">
                <p>
                  When the viewport width drops below 480px, the responsive card grid collapses
                  instead of stacking. This breaks the layout on mobile and on iPad mini in portrait.
                </p>
                <p>
                  <strong>Steps to reproduce:</strong> Open the dashboard page on a device narrower
                  than 480px. The metric cards overflow the container horizontally.
                </p>
                <p>
                  <strong>Expected:</strong> Cards stack vertically in a single column.
                </p>
                <p>
                  <strong>Actual:</strong> Cards overflow the viewport and a horizontal scrollbar
                  appears.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                {["👍 12", "👀 4"].map((r) => (
                  <Button key={r} variant="secondary" size="xs">{r}</Button>
                ))}
              </div>
            </div>
          </div>
        </SmartPageSection>

        <Separator />

        {/* Comments */}
        <SmartPageSection title={`${COMMENTS.length} comments`} padding={false}>
          <div className="flex flex-col gap-4">
            {COMMENTS.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="size-8 mt-0.5 shrink-0">
                  <AvatarFallback>{c.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold">{c.author}</span>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{c.body}</p>
                  <div className="mt-2 flex gap-2">
                    {Object.entries(c.reactions).map(([emoji, count]) => (
                      <Button key={emoji} variant="secondary" size="xs">
                        {emoji} {count}
                      </Button>
                    ))}
                    <Button variant="ghost" size="xs">
                      <ThumbsUp className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SmartPageSection>

        {/* New comment */}
        <SmartPageSection padding={false}>
          <div className="flex gap-3">
            <Avatar className="size-8 mt-0.5 shrink-0">
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col gap-2">
              <Textarea
                placeholder="Leave a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none text-xs"
              />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" aria-label="Attach file">
                  <Paperclip />
                </Button>
                <span className="ms-auto" />
                <Button size="sm" disabled={!comment.trim()}>
                  <MessageSquare />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </SmartPageSection>
      </SmartPageContent>

      {/* ── Sidebar (right, scrolls independently) ─────────────────────────── */}
      <SmartSidebar width="sm" title="Details">
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Status
            </span>
            <div className="flex items-center gap-1.5">
              {resolved
                ? <CheckCircle2 className="size-3.5 text-green-600" />
                : <Circle className="size-3.5 text-muted-foreground" />
              }
              <span className={resolved ? "text-green-700 dark:text-green-400" : ""}>
                {resolved ? "Resolved" : "Open"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Assignee
            </span>
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">B</AvatarFallback>
              </Avatar>
              <span>Bob</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Priority
            </span>
            <Badge variant="secondary" className="w-fit">High</Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Labels
            </span>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">bug</Badge>
              <Badge variant="outline">mobile</Badge>
              <Badge variant="outline">css</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Milestone
            </span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="size-3.5 text-muted-foreground" />
              <span>v2.4.0</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Due date
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>Jul 15, 2026</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Reporter
            </span>
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">S</AvatarFallback>
              </Avatar>
              <span>Saroj Kumar</span>
            </div>
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-2">
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
              Participants
            </span>
            <div className="flex -space-x-1">
              {["A", "B", "S", "C"].map((init) => (
                <Avatar key={init} className="size-6 ring-2 ring-background">
                  <AvatarFallback className="text-[9px]">{init}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-1 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Tag className="size-3" />
              <span>Created 2 days ago</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="size-3" />
              <span>Updated 1 hour ago</span>
            </div>
          </div>
        </div>
      </SmartSidebar>
    </SmartPage>
  )
}
