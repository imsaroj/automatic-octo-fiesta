// ─── Config (single source of truth for action defaults) ─────────────────────
export {
  ACTION_BUTTON_CONFIG,
  type ActionKind,
  type ActionDefaults,
  type ActionButtonVariant,
} from "./action-config"

// ─── Generic action button + preset factory ──────────────────────────────────
export {
  ActionButton,
  createActionButton,
  type ActionButtonProps,
  type ActionButtonPresetProps,
} from "./action-button"

// ─── Permission gate (shared by buttons + the grid action column) ─────────────
export {
  ActionPermissionProvider,
  useActionPermission,
  Can,
  type ActionPermissionChecker,
} from "./action-permission"

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
