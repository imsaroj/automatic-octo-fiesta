import { useRef, useState } from "react"
import {
  BarChart3Icon,
  DatabaseIcon,
  FileTextIcon,
  KeyIcon,
  MailIcon,
  ServerIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartButton } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import {
  SmartTransferList,
  type SmartTransferListHandle,
  type TransferItem,
} from "@iamsaroj/smart-ui/transfer-list-engine"

// ── Sample data ────────────────────────────────────────────────────────────

const fruits: TransferItem[] = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "cherry", label: "Cherry" },
  { id: "date", label: "Date" },
  { id: "elderberry", label: "Elderberry" },
  { id: "fig", label: "Fig" },
  { id: "grape", label: "Grape" },
  { id: "kiwi", label: "Kiwi", disabled: true },
  { id: "lemon", label: "Lemon" },
  { id: "mango", label: "Mango" },
  { id: "orange", label: "Orange" },
  { id: "pear", label: "Pear" },
]

const permissions: TransferItem[] = [
  {
    id: "users.read",
    label: "Read users",
    description: "View user profiles and lists",
    icon: <UserIcon />,
  },
  {
    id: "users.write",
    label: "Manage users",
    description: "Create, edit, and delete users",
    icon: <UserIcon />,
  },
  {
    id: "billing.read",
    label: "View billing",
    description: "See invoices and usage",
    icon: <FileTextIcon />,
  },
  {
    id: "billing.write",
    label: "Manage billing",
    description: "Change plans and payment methods",
    icon: <KeyIcon />,
  },
  {
    id: "db.read",
    label: "Query database",
    description: "Run read-only queries",
    icon: <DatabaseIcon />,
  },
  {
    id: "db.admin",
    label: "Database admin",
    description: "Schema and migrations",
    icon: <ServerIcon />,
    disabled: true,
  },
  {
    id: "analytics",
    label: "View analytics",
    description: "Dashboards and reports",
    icon: <BarChart3Icon />,
  },
  {
    id: "email.send",
    label: "Send email",
    description: "Trigger transactional email",
    icon: <MailIcon />,
  },
  {
    id: "security",
    label: "Security settings",
    description: "SSO, audit log, keys",
    icon: <ShieldIcon />,
  },
]

const teamMembers: TransferItem[] = [
  { id: "ada", label: "Ada Lovelace", description: "Frontend", badge: "Owner" },
  { id: "grace", label: "Grace Hopper", description: "Backend" },
  { id: "linus", label: "Linus Torvalds", description: "Platform" },
  { id: "ken", label: "Ken Thompson", description: "Backend" },
  { id: "dennis", label: "Dennis Ritchie", description: "Backend" },
  { id: "dieter", label: "Dieter Rams", description: "Design" },
  { id: "paula", label: "Paula Scher", description: "Design" },
  { id: "margaret", label: "Margaret Hamilton", description: "Reliability" },
]

const TransferListPage = () => {
  const [granted, setGranted] = useState<string[]>(["users.read", "analytics"])
  const [reviewers, setReviewers] = useState<string[]>(["grace", "ken"])
  const controlRef = useRef<SmartTransferListHandle>(null)

  return (
    <SmartPage
      layout="detail"
      title="Transfer List Engine"
      description="SmartTransferList — a dual-list shuttle control: highlight and move items between an available list and a selected list, with per-list search, select-all, move-all, double-click to move, disabled items, and full control over the target ids."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── Basic ─────────────────────────────────────────────────── */}
        <SmartPageSection
          title="Basic"
          description="Click rows to highlight, then use the chevrons to move them. Double-click a row to move it instantly. 'Kiwi' is disabled. Uncontrolled via defaultTargetIds."
          divider
        >
          <SmartCard size="sm">
            <div className="p-3">
              <SmartTransferList
                items={fruits}
                defaultTargetIds={["banana", "grape"]}
                sourceTitle="Available fruit"
                targetTitle="Basket"
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Rich rows + controlled ────────────────────────────────── */}
        <SmartPageSection
          title="Rich rows (controlled)"
          description="Items carry icons and descriptions. The component is fully controlled — the granted ids below update live as you move rows. 'Database admin' is disabled."
          divider
        >
          <SmartCard size="sm">
            <div className="p-3">
              <SmartTransferList
                items={permissions}
                targetIds={granted}
                onChange={(next) => setGranted(next)}
                sourceTitle="All permissions"
                targetTitle="Granted"
                listHeight="18rem"
              />
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                <span className="text-xs text-muted-foreground">Granted:</span>
                {granted.length === 0 ? (
                  <span className="text-xs text-muted-foreground">none</span>
                ) : (
                  granted.map((id) => (
                    <SmartBadge
                      key={id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {id}
                    </SmartBadge>
                  ))
                )}
              </div>
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Imperative handle ─────────────────────────────────────── */}
        <SmartPageSection
          title="Imperative handle"
          description="Drive the list through a ref: move everything at once or clear the highlighted selection. Reviewers are kept in target order (order added)."
          divider
        >
          <SmartCard size="sm">
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              <SmartButton
                size="sm"
                variant="outline"
                onClick={() => controlRef.current?.moveAllToTarget()}
              >
                Add everyone
              </SmartButton>
              <SmartButton
                size="sm"
                variant="outline"
                onClick={() => controlRef.current?.moveAllToSource()}
              >
                Remove everyone
              </SmartButton>
              <SmartButton
                size="sm"
                variant="ghost"
                onClick={() => controlRef.current?.clearSelection()}
              >
                Clear highlight
              </SmartButton>
            </div>
            <div className="p-3">
              <SmartTransferList
                ref={controlRef}
                items={teamMembers}
                targetIds={reviewers}
                onChange={(next) => setReviewers(next)}
                sourceTitle="Team"
                targetTitle="Reviewers"
              />
            </div>
          </SmartCard>
        </SmartPageSection>

        {/* ── Variants ──────────────────────────────────────────────── */}
        <SmartPageSection
          title="Variants"
          description="No search + no move-all for short lists (left), and the compact 'sm' density with a shorter list height (right)."
          divider
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <SmartCard header={{ title: "Minimal" }} size="sm">
              <div className="p-3">
                <SmartTransferList
                  items={fruits.slice(0, 6)}
                  defaultTargetIds={["cherry"]}
                  searchable={false}
                  showMoveAll={false}
                  size="sm"
                  listHeight="12rem"
                  sourceTitle="Options"
                  targetTitle="Chosen"
                />
              </div>
            </SmartCard>

            <SmartCard header={{ title: "Disabled" }} size="sm">
              <div className="p-3">
                <SmartTransferList
                  items={fruits.slice(0, 6)}
                  defaultTargetIds={["apple", "date"]}
                  disabled
                  size="sm"
                  listHeight="12rem"
                  sourceTitle="Options"
                  targetTitle="Chosen"
                />
              </div>
            </SmartCard>
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default TransferListPage
