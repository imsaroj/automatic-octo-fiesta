import { createActionButton } from "./action-button"

/**
 * Named presets — one per `ACTION_BUTTON_CONFIG` entry. Each is a
 * `SmartButton` with the action's icon, label, variant, loading text, and
 * accessibility defaults baked in; all props remain overridable.
 *
 * ```tsx
 * <AddButton onClick={openCreate} />                    // "+ Add", primary
 * <DeleteButton iconOnly onClick={remove} />            // trash icon, destructive, tooltip
 * <SaveButton loading={isSaving} onClick={save} />      // spinner + "Saving…"
 * <ExportButton permission={canExport} onClick={run} /> // hidden unless permitted
 * <AddButton>New user</AddButton>                       // custom label
 * ```
 */
export const AddButton = createActionButton("add", "AddButton")
export const EditButton = createActionButton("edit", "EditButton")
export const DeleteButton = createActionButton("delete", "DeleteButton")
export const SaveButton = createActionButton("save", "SaveButton")
export const CancelButton = createActionButton("cancel", "CancelButton")
export const SearchButton = createActionButton("search", "SearchButton")
export const RefreshButton = createActionButton("refresh", "RefreshButton")
export const SyncButton = createActionButton("sync", "SyncButton")
export const DownloadButton = createActionButton("download", "DownloadButton")
export const UploadButton = createActionButton("upload", "UploadButton")
export const ImportButton = createActionButton("import", "ImportButton")
export const ExportButton = createActionButton("export", "ExportButton")
export const CopyButton = createActionButton("copy", "CopyButton")
export const PrintButton = createActionButton("print", "PrintButton")
export const FilterButton = createActionButton("filter", "FilterButton")
export const ResetButton = createActionButton("reset", "ResetButton")
export const SubmitButton = createActionButton("submit", "SubmitButton")
export const ApproveButton = createActionButton("approve", "ApproveButton")
export const RejectButton = createActionButton("reject", "RejectButton")
export const ViewButton = createActionButton("view", "ViewButton")
export const CloseButton = createActionButton("close", "CloseButton")
export const BackButton = createActionButton("back", "BackButton")
export const NextButton = createActionButton("next", "NextButton")
export const PreviousButton = createActionButton("previous", "PreviousButton")
export const DuplicateButton = createActionButton(
  "duplicate",
  "DuplicateButton"
)
export const ArchiveButton = createActionButton("archive", "ArchiveButton")
export const RestoreButton = createActionButton("restore", "RestoreButton")
