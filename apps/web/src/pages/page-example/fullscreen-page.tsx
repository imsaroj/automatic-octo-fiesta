/**
 * Page Example — Fullscreen layout
 *
 * `layout="fullscreen"` fills the entire available area with no page scroll and
 * no padding. The surface owns its own interaction model. Use it for canvases,
 * maps, whiteboards and editors. Chrome floats over the surface instead of
 * taking layout space.
 */

import { useState } from "react"
import { Minus, MousePointer2, Move, Plus, Square, Type } from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@imsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@imsaroj/smart-ui/smart-components/smart-badge"
import { cn } from "@imsaroj/smart-ui/lib/utils"

const TOOLS = [
  { id: "select", icon: <MousePointer2 className="size-4" />, label: "Select" },
  { id: "move", icon: <Move className="size-4" />, label: "Move" },
  { id: "rect", icon: <Square className="size-4" />, label: "Rectangle" },
  { id: "text", icon: <Type className="size-4" />, label: "Text" },
]

const FullscreenLayoutPage = () => {
  const [tool, setTool] = useState("select")
  const [zoom, setZoom] = useState(100)

  return (
    <SmartPage layout="fullscreen" fullHeight bordered className="relative">
      <SmartPageContent className="relative overflow-hidden">
        {/* Canvas surface — a dotted grid to suggest an infinite plane */}
        <div
          className="absolute inset-0 bg-muted/30"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
            backgroundSize: `${(zoom / 100) * 24}px ${(zoom / 100) * 24}px`,
          }}
        >
          {/* A couple of placeholder shapes */}
          <div
            className="absolute top-[30%] left-[20%] flex size-40 items-center justify-center rounded-lg border-2 border-primary/50 bg-primary/10 text-xs text-primary"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            Frame
          </div>
          <div
            className="absolute top-[48%] right-[24%] size-24 rounded-full border-2 border-foreground/30 bg-background/60"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>

        {/* Floating top-left title */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge variant="secondary">Fullscreen</Badge>
          <span className="text-xs text-muted-foreground">Untitled canvas</span>
        </div>

        {/* Floating tool palette (left, vertically centered) */}
        <div className="absolute top-1/2 left-4 flex -translate-y-1/2 flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
          {TOOLS.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={t.label}
              onClick={() => setTool(t.id)}
              className={cn(tool === t.id && "text-primary")}
            >
              {t.icon}
            </Button>
          ))}
        </div>

        {/* Floating zoom control (bottom-right) */}
        <div className="absolute right-4 bottom-4 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
          >
            <Minus />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
          >
            <Plus />
          </Button>
        </div>
      </SmartPageContent>
    </SmartPage>
  )
}

export default FullscreenLayoutPage
