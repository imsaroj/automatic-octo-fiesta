// ─── Config (single source of truth for action defaults) ─────────────────────
export {
  ACTION_BUTTON_CONFIG,
  type ActionKind,
  type ActionDefaults,
  type ActionButtonVariant,
} from "./action-config"

// ─── Generic action button + permission gate + preset factory ────────────────
export {
  ActionButton,
  ActionPermissionProvider,
  createActionButton,
  type ActionButtonProps,
  type ActionButtonPresetProps,
  type ActionPermissionChecker,
} from "./action-button"

// ─── Named presets ────────────────────────────────────────────────────────────
export {
  AddButton,
  EditButton,
  DeleteButton,
  SaveButton,
  CancelButton,
  SearchButton,
  RefreshButton,
  SyncButton,
  DownloadButton,
  UploadButton,
  ImportButton,
  ExportButton,
  CopyButton,
  PrintButton,
  FilterButton,
  ResetButton,
  SubmitButton,
  ApproveButton,
  RejectButton,
  ViewButton,
  CloseButton,
  BackButton,
  NextButton,
  PreviousButton,
  DuplicateButton,
  ArchiveButton,
  RestoreButton,
} from "./action-buttons"
