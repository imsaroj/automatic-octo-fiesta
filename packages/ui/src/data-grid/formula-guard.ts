/**
 * Spreadsheet **formula-injection** guard for grid exports.
 *
 * A cell whose text starts with `=`, `+`, `-`, `@`, or a leading tab/carriage
 * return is interpreted as a *formula* when the exported file is opened in
 * Excel / Sheets / LibreOffice. With attacker-controlled data that becomes a
 * code-execution / data-exfiltration vector (the classic `=cmd|'/C calc'!A0`
 * and `=HYPERLINK(...)` payloads). Prefixing such values with a single quote
 * (`'`) forces the tool to treat the cell as literal text.
 *
 * `SmartGrid`'s CSV export routes every cell through {@link escapeCsvFormula}
 * (via AG Grid's `processCellCallback`), and the XLSX export path
 * (`collectGridExport`) does the same — belt and braces, since a leading `=`
 * still detonates if a user re-saves an `.xlsx` as CSV.
 */

/** Characters that make a spreadsheet treat a leading cell value as a formula. */
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"])

/**
 * Prefix a formula-triggering string with `'` so spreadsheets treat it as text.
 * Non-strings (numbers/booleans/null/undefined) are returned unchanged — only
 * the *string* form is dangerous, and quoting a number would corrupt it.
 */
export const escapeCsvFormula = <T>(value: T): T | string => {
  if (typeof value !== "string" || value.length === 0) return value
  return FORMULA_TRIGGERS.has(value[0]) ? `'${value}` : value
}
