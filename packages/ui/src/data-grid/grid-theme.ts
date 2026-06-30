import { themeQuartz, type Theme } from "ag-grid-community";

/**
 * AG Grid theme derived from the design tokens. Colors reference the same CSS
 * variables the rest of the system uses, so the grid follows light/dark mode
 * automatically — no separate AG Grid CSS import required (v33+ Theming API).
 */
export const dataGridTheme: Theme = themeQuartz.withParams({
  accentColor: "var(--primary)",
  backgroundColor: "var(--background)",
  foregroundColor: "var(--foreground)",
  borderColor: "var(--border)",
  chromeBackgroundColor: "var(--card)",
  headerBackgroundColor: "var(--muted)",
  headerTextColor: "var(--muted-foreground)",
  rowHoverColor: "var(--accent)",
  selectedRowBackgroundColor: "var(--accent)",
  panelBackgroundColor: "var(--card)",
  fontFamily: "inherit",
  headerFontWeight: 600,
  borderRadius: "var(--radius)",
  wrapperBorderRadius: "var(--radius)",
});
