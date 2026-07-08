# 0003 — Hand-rolled XLSX writer

- **Status:** Accepted

## Context

The data grids offer an "Export to Excel" button. The obvious path is a library
like `exceljs` or `sheetjs`, but those are heavy (hundreds of kB) for what the grid
needs: a single worksheet with a header row and styled body rows.

## Decision

Write a **dependency-free** `.xlsx` writer (`lib/xlsx.ts`) that emits a minimal but
valid OOXML SpreadsheetML workbook, packed into a ZIP by hand. Strings are written
as inline strings (`t="inlineStr"`), numbers as numeric cells; styling (colored
header, zebra rows, frozen header, auto-width) is emitted through a hand-written
`styles.xml`.

## Consequences

- **Pro:** Zero runtime dependency for exports; nothing to audit or bump.
- **Pro:** Full control over output and styling; tiny code footprint.
- **Pro:** `buildXlsx` is pure and environment-agnostic — callable from a Web
  Worker for large exports.
- **Con:** Not a general spreadsheet library — one sheet, no formulas, no charts.
  Anything beyond tabular export would need real work or a dependency.
- **Con:** We own OOXML correctness; the format is finicky (documented perf
  contract: 50k cells ≈ 135 ms synchronous on the main thread).
- Formula-injection is guarded at the export layer, not the writer (see
  [security.md](../security.md)).
