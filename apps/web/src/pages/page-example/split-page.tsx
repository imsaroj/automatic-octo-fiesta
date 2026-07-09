/**
 * Page Example — Split layout
 *
 * A `SmartSidebar` as a direct child auto-detects the `split` layout: the main
 * content and the sidebar sit side by side and each scrolls independently. Here
 * the sidebar is positioned on the left as a message list, and the content pane
 * shows the selected message — a classic mail / inbox pattern.
 */

import { useState } from "react"
import { Archive, Reply, Star, Trash2 } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
  SmartSidebar,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import {
  Avatar,
  AvatarFallback,
} from "@iamsaroj/smart-ui/smart-components/smart-avatar"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

interface Message {
  id: number
  from: string
  initials: string
  subject: string
  preview: string
  time: string
  unread: boolean
  body: string[]
}

const MESSAGES: Message[] = [
  {
    id: 1,
    from: "Grace Hopper",
    initials: "GH",
    subject: "Release notes for v2.4.0",
    preview: "Here's the summary of everything that shipped this cycle…",
    time: "9:41 AM",
    unread: true,
    body: [
      "Hi team,",
      "Here's the summary of everything that shipped this cycle. The headline feature is the new SmartPage layout engine, plus a handful of bug fixes across the data grid.",
      "Let me know if anything is missing before we publish.",
      "— Grace",
    ],
  },
  {
    id: 2,
    from: "Linus Torvalds",
    initials: "LT",
    subject: "Re: performance regression",
    preview: "Bisected it down to the sticky header rework…",
    time: "8:12 AM",
    unread: true,
    body: [
      "I bisected the regression down to the sticky header rework. It's re-collecting slots on every scroll frame.",
      "Memoizing the bucket collection fixes it. Patch incoming.",
    ],
  },
  {
    id: 3,
    from: "Ada Lovelace",
    initials: "AL",
    subject: "Design review Thursday",
    preview: "Can we move the review to 2pm? I have a conflict…",
    time: "Yesterday",
    unread: false,
    body: [
      "Can we move the design review to 2pm on Thursday? I have a conflict with the earlier slot.",
      "Everything else on the agenda still stands.",
    ],
  },
  {
    id: 4,
    from: "Katherine Johnson",
    initials: "KJ",
    subject: "Numbers look good",
    preview: "Ran the analysis again with the new dataset…",
    time: "Yesterday",
    unread: false,
    body: [
      "Ran the analysis again with the new dataset and the numbers hold up. Ship it.",
    ],
  },
]

const SplitLayoutPage = () => {
  const [activeId, setActiveId] = useState(1)
  const active = MESSAGES.find((m) => m.id === activeId) ?? MESSAGES[0]

  return (
    // SmartSidebar present → auto-detected "split" layout
    <SmartPage
      title="Inbox"
      actions={
        <Badge variant="secondary">
          {MESSAGES.filter((m) => m.unread).length} unread
        </Badge>
      }
      headerProps={{ compact: true }}
    >
      {/* Left list — scrolls independently */}
      <SmartSidebar position="left" width="md" padding={false}>
        <ul className="flex flex-col">
          {MESSAGES.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActiveId(m.id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50",
                  m.id === activeId && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      m.unread ? "bg-primary" : "bg-transparent"
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 truncate text-xs",
                      m.unread ? "font-semibold" : "font-medium"
                    )}
                  >
                    {m.from}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {m.time}
                  </span>
                </div>
                <span className="truncate text-xs">{m.subject}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {m.preview}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SmartSidebar>

      {/* Reading pane — the primary scroll container */}
      <SmartPageContent padding="md">
        <SmartPageSection padding={false}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{active.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base font-semibold">{active.subject}</h2>
                <p className="text-xs text-muted-foreground">
                  {active.from} · {active.time}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Star">
                <Star />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Archive">
                <Archive />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete">
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
            {active.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-6">
            <Button size="sm">
              <Reply /> Reply
            </Button>
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default SplitLayoutPage
