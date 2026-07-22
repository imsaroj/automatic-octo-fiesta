import { useState } from "react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartSegmented } from "@iamsaroj/smart-ui/smart-components/smart-segmented"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import {
  ACTION_BUTTON_CONFIG,
  ActionButton,
  ActionPermissionProvider,
  AddButton,
  ApproveButton,
  ArchiveButton,
  BackButton,
  CancelButton,
  CloseButton,
  CopyButton,
  DeleteButton,
  DownloadButton,
  DuplicateButton,
  EditButton,
  ExportButton,
  FilterButton,
  ImportButton,
  NextButton,
  PreviousButton,
  PrintButton,
  RefreshButton,
  RejectButton,
  ResetButton,
  RestoreButton,
  SaveButton,
  SearchButton,
  SubmitButton,
  SyncButton,
  UploadButton,
  ViewButton,
  type ActionKind,
  type ActionPermissionChecker,
} from "@iamsaroj/smart-ui/smart-components/buttons"

const GROUPS: { label: string; buttons: React.ReactNode }[] = [
  {
    label: "CRUD",
    buttons: (
      <>
        <AddButton />
        <EditButton />
        <ViewButton />
        <DuplicateButton />
        <DeleteButton />
        <SaveButton />
        <CancelButton />
      </>
    ),
  },
  {
    label: "Data",
    buttons: (
      <>
        <SearchButton />
        <FilterButton />
        <RefreshButton />
        <SyncButton />
        <ResetButton />
      </>
    ),
  },
  {
    label: "Transfer",
    buttons: (
      <>
        <DownloadButton />
        <UploadButton />
        <ImportButton />
        <ExportButton />
        <CopyButton />
        <PrintButton />
      </>
    ),
  },
  {
    label: "Workflow",
    buttons: (
      <>
        <SubmitButton />
        <ApproveButton />
        <RejectButton />
        <ArchiveButton />
        <RestoreButton />
      </>
    ),
  },
  {
    label: "Navigation",
    buttons: (
      <>
        <BackButton />
        <PreviousButton />
        <NextButton />
        <CloseButton />
      </>
    ),
  },
]

const DYNAMIC_ACTIONS = ["save", "delete", "export", "approve"] as const

const ActionButtonsPage = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  )
  const [role, setRole] = useState("admin")
  const [dynamicAction, setDynamicAction] = useState<ActionKind>("save")

  const simulateLoad = (key: string, ms = 2000) => {
    setLoadingStates((s) => ({ ...s, [key]: true }))
    setTimeout(() => setLoadingStates((s) => ({ ...s, [key]: false })), ms)
  }

  // Viewers can only look; editors can't delete or approve/reject.
  // Takes the checker's own widened action type: custom action kinds reach it as
  // plain strings, so narrowing to `ActionKind` here would reject the provider.
  const can: ActionPermissionChecker = (action) => {
    if (role === "admin") return true
    if (role === "editor")
      return !["delete", "approve", "reject"].includes(action)
    return ["view", "search", "refresh", "download", "print"].includes(action)
  }

  return (
    <SmartPage
      layout="detail"
      title="Action Buttons"
      description="27 named presets from one ACTION_BUTTON_CONFIG map — default icon, label, variant, loading text, tooltip, and permission gating, all overridable."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── All presets ────────────────────────────────────── */}
        <SmartPageSection
          title="All presets"
          description="Every named button with its config defaults — no props passed."
          divider
        >
          <div className="flex flex-col gap-4">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">{group.buttons}</div>
              </div>
            ))}
          </div>
        </SmartPageSection>

        {/* ── Loading ───────────────────────────────────────── */}
        <SmartPageSection
          title="Loading state"
          description="Click a button — the spinner and loading text (“Saving…”, “Deleting…”) come from the config."
          divider
        >
          <div className="flex flex-wrap gap-2">
            <SaveButton
              loading={loadingStates.save}
              onClick={() => simulateLoad("save")}
            />
            <DeleteButton
              loading={loadingStates.delete}
              onClick={() => simulateLoad("delete", 1500)}
            />
            <SyncButton
              loading={loadingStates.sync}
              onClick={() => simulateLoad("sync", 3000)}
            />
            <ExportButton
              loading={loadingStates.export}
              onClick={() => simulateLoad("export", 2500)}
            />
          </div>
        </SmartPageSection>

        {/* ── Icon-only ─────────────────────────────────────── */}
        <SmartPageSection
          title="Icon-only toolbar"
          description="iconOnly keeps the label as aria-label and shows it as a tooltip — hover to check."
          divider
        >
          <div className="flex flex-wrap items-center gap-1">
            <AddButton iconOnly />
            <EditButton iconOnly />
            <DuplicateButton iconOnly />
            <CopyButton iconOnly />
            <DownloadButton iconOnly />
            <PrintButton iconOnly />
            <ArchiveButton iconOnly />
            <DeleteButton iconOnly />
            <RefreshButton
              iconOnly
              loading={loadingStates.refresh}
              onClick={() => simulateLoad("refresh", 1500)}
            />
          </div>
        </SmartPageSection>

        {/* ── Overrides ─────────────────────────────────────── */}
        <SmartPageSection
          title="Overrides"
          description="Defaults are just defaults — children, variant, size, icon, and tooltip all stay overridable."
          divider
        >
          <div className="flex flex-wrap items-center gap-2">
            <AddButton>New user</AddButton>
            <SaveButton variant="outline">Save draft</SaveButton>
            <DeleteButton icon={null}>Remove</DeleteButton>
            <NextButton size="lg">Continue</NextButton>
            <ExportButton tooltip="Exports the current view as .xlsx" />
          </div>
        </SmartPageSection>

        {/* ── Permission gating ─────────────────────────────── */}
        <SmartPageSection
          title="Permission gating"
          description="ActionPermissionProvider hides (or disables) buttons whose action the checker rejects."
          divider
        >
          <div className="flex flex-col gap-4">
            <SmartSegmented
              options={[
                { value: "admin", label: "Admin" },
                { value: "editor", label: "Editor" },
                { value: "viewer", label: "Viewer" },
              ]}
              value={role}
              onValueChange={setRole}
            />
            <ActionPermissionProvider can={can}>
              <SmartCard
                header={{
                  title: "Orders toolbar",
                  subtitle: `Rendered as ${role} — denied actions are hidden`,
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <ViewButton />
                  <AddButton />
                  <EditButton />
                  <ApproveButton />
                  <RejectButton />
                  <ExportButton />
                  <DeleteButton />
                </div>
              </SmartCard>
            </ActionPermissionProvider>
            <ActionPermissionProvider can={can}>
              <SmartCard
                header={{
                  title: "deniedBehavior=”disable”",
                  subtitle: "Same checker, but denied actions stay visible",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <EditButton deniedBehavior="disable" />
                  <ApproveButton deniedBehavior="disable" />
                  <DeleteButton deniedBehavior="disable" />
                </div>
              </SmartCard>
            </ActionPermissionProvider>
          </div>
        </SmartPageSection>

        {/* ── Dynamic action ────────────────────────────────── */}
        <SmartPageSection
          title="Dynamic ActionButton"
          description="The generic <ActionButton action={…}> escape hatch for choosing the action at runtime."
        >
          <div className="flex flex-wrap items-center gap-4">
            <SmartSegmented
              options={DYNAMIC_ACTIONS.map((a) => ({
                value: a,
                label: ACTION_BUTTON_CONFIG[a].label,
              }))}
              value={dynamicAction}
              onValueChange={(v) => setDynamicAction(v as ActionKind)}
            />
            <ActionButton
              action={dynamicAction}
              onClick={() =>
                toast.info(`Ran "${ACTION_BUTTON_CONFIG[dynamicAction].label}"`)
              }
            />
          </div>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default ActionButtonsPage
