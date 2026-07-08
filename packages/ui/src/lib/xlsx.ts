/**
 * Dependency-free `.xlsx` (OOXML SpreadsheetML) writer.
 *
 * The library externalizes every runtime dependency and ships no CSS, so rather
 * than pull a heavyweight spreadsheet package in for a single export button, we
 * emit a minimal-yet-valid workbook by hand: a small set of OOXML parts packed
 * into a ZIP using **stored** (uncompressed) entries. Strings are written as
 * inline strings (`t="inlineStr"`) so no shared-strings table is needed, and
 * finite numbers are written as numeric cells so Excel treats them as numbers.
 *
 * This is intentionally tiny — it covers a single worksheet with a header row,
 * which is exactly what a data-grid export needs. It is **not** a general
 * spreadsheet library.
 *
 * Exports are styled by default (see {@link XlsxTheme}): a colored header row
 * with bold text and filter dropdowns, zebra-striped data rows, a frozen
 * header, and auto-fit column widths — all emitted through a hand-written
 * `xl/styles.xml`, still with zero dependencies. Pass `theme: "plain"` for
 * bare cells.
 *
 * **Performance contract:** the build is synchronous on the main thread.
 * Measured on V8 (Node 22, Chromium-class engine, 2026-07): 10k cells ≈ 30 ms,
 * **50k cells ≈ 135 ms**, 100k cells ≈ 450 ms, 200k cells ≈ 1 s. Exports up to
 * ~50k cells are comfortable; beyond ~100k cells the UI freeze becomes
 * noticeable — at that scale, call {@link buildXlsx} (it is pure and
 * environment-agnostic) from a Web Worker and hand the resulting bytes back for
 * download instead of using {@link downloadXlsx} directly.
 */

/** A value that can be written to a worksheet cell. */
export type XlsxCell = string | number | boolean | null | undefined

/**
 * Visual treatment for the workbook. All fields optional — the defaults give
 * exports a polished look out of the box (indigo header with bold white text,
 * zebra-striped rows, frozen header with filter dropdowns, auto-fit columns).
 */
export interface XlsxTheme {
  /** Header row fill, hex RGB (`"4F46E5"` or `"#4F46E5"`). */
  headerFill?: string
  /** Header text color, hex RGB. Default white. */
  headerText?: string
  /** Fill for every second data row, hex RGB; `false` disables striping. */
  stripe?: string | false
  /** Keep the header row visible while scrolling. Default `true`. */
  freezeHeader?: boolean
  /** Filter dropdowns on the header row. Default `true`. */
  autoFilter?: boolean
  /** Fit column widths to their longest content. Default `true`. */
  autoWidth?: boolean
}

/** One worksheet's worth of tabular data. */
export interface XlsxSheet {
  /** Worksheet tab name. Default `"Sheet1"`. */
  name?: string
  /** The header row. */
  headers: string[]
  /** Body rows, each aligned to `headers`. */
  rows: XlsxCell[][]
  /**
   * Styling. Omit for the themed default look, override individual
   * {@link XlsxTheme} fields, or pass `"plain"` for bare unstyled cells.
   */
  theme?: XlsxTheme | "plain"
}

/* --------------------------------- CRC-32 --------------------------------- */

const CRC_TABLE = /* @__PURE__ */ (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/* ----------------------------- ZIP (stored) ------------------------------- */

interface ZipEntry {
  name: string
  data: Uint8Array
}

const pushU16 = (out: number[], value: number): void => {
  out.push(value & 0xff, (value >>> 8) & 0xff)
}

const pushU32 = (out: number[], value: number): void => {
  out.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  )
}

const pushBytes = (out: number[], bytes: Uint8Array): void => {
  for (let i = 0; i < bytes.length; i += 1) out.push(bytes[i])
}

/** Pack entries into a ZIP archive using stored (method 0 / no compression) entries. */
const zipStore = (entries: ZipEntry[]): Uint8Array => {
  const encoder = new TextEncoder()
  const local: number[] = []
  const records: {
    nameBytes: Uint8Array
    crc: number
    size: number
    offset: number
  }[] = []

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const offset = local.length
    pushU32(local, 0x04034b50) // local file header signature
    pushU16(local, 20) // version needed to extract
    pushU16(local, 0) // general purpose flags
    pushU16(local, 0) // compression method (0 = stored)
    pushU16(local, 0) // last mod time
    pushU16(local, 0) // last mod date
    pushU32(local, crc)
    pushU32(local, entry.data.length) // compressed size
    pushU32(local, entry.data.length) // uncompressed size
    pushU16(local, nameBytes.length)
    pushU16(local, 0) // extra field length
    pushBytes(local, nameBytes)
    pushBytes(local, entry.data)
    records.push({ nameBytes, crc, size: entry.data.length, offset })
  }

  const centralOffset = local.length
  const central: number[] = []
  for (const record of records) {
    pushU32(central, 0x02014b50) // central directory header signature
    pushU16(central, 20) // version made by
    pushU16(central, 20) // version needed to extract
    pushU16(central, 0) // general purpose flags
    pushU16(central, 0) // compression method
    pushU16(central, 0) // last mod time
    pushU16(central, 0) // last mod date
    pushU32(central, record.crc)
    pushU32(central, record.size) // compressed size
    pushU32(central, record.size) // uncompressed size
    pushU16(central, record.nameBytes.length)
    pushU16(central, 0) // extra field length
    pushU16(central, 0) // file comment length
    pushU16(central, 0) // disk number start
    pushU16(central, 0) // internal file attributes
    pushU32(central, 0) // external file attributes
    pushU32(central, record.offset) // relative offset of local header
    pushBytes(central, record.nameBytes)
  }

  const eocd: number[] = []
  pushU32(eocd, 0x06054b50) // end of central directory signature
  pushU16(eocd, 0) // number of this disk
  pushU16(eocd, 0) // disk where central directory starts
  pushU16(eocd, records.length) // central directory records on this disk
  pushU16(eocd, records.length) // total central directory records
  pushU32(eocd, central.length) // size of central directory
  pushU32(eocd, centralOffset) // offset of central directory
  pushU16(eocd, 0) // comment length

  return Uint8Array.from(local.concat(central, eocd))
}

/* --------------------------------- OOXML ---------------------------------- */

const XML_DECLARATION =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

/**
 * Drop characters that are illegal in XML 1.0 (control chars below `0x20` other
 * than tab, LF and CR) so a stray control byte in the data can never corrupt the
 * workbook. Implemented as a char-code scan to avoid a control-char regex.
 */
const stripIllegalXmlChars = (value: string): string => {
  let out = ""
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue
    out += value[i]
  }
  return out
}

const escapeXml = (value: string): string =>
  stripIllegalXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/** 0 → `A`, 25 → `Z`, 26 → `AA`, … (spreadsheet column letters). */
const columnName = (index: number): string => {
  let n = index
  let name = ""
  do {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return name
}

/* -------------------------------- Theming --------------------------------- */

interface ResolvedTheme {
  headerFill: string
  headerText: string
  stripe: string | false
  freezeHeader: boolean
  autoFilter: boolean
  autoWidth: boolean
  /** `false` when the caller asked for `"plain"` — skip the styled parts. */
  styled: boolean
}

/** `"#4f46e5"` / `"4F46E5"` → OOXML ARGB `"FF4F46E5"`; invalid input → fallback. */
const toArgb = (color: string | undefined, fallback: string): string => {
  const hex = (color ?? "").replace(/^#/, "").toUpperCase()
  return /^[0-9A-F]{6}$/.test(hex) ? `FF${hex}` : `FF${fallback}`
}

/** Darken an ARGB color (used for the header's bottom accent border). */
const darkenArgb = (argb: string, factor = 0.72): string => {
  let out = "FF"
  for (let i = 2; i < 8; i += 2) {
    const channel = Math.round(parseInt(argb.slice(i, i + 2), 16) * factor)
    out += channel.toString(16).padStart(2, "0").toUpperCase()
  }
  return out
}

const resolveTheme = (theme: XlsxSheet["theme"]): ResolvedTheme => {
  if (theme === "plain") {
    return {
      headerFill: "",
      headerText: "",
      stripe: false,
      freezeHeader: false,
      autoFilter: false,
      autoWidth: false,
      styled: false,
    }
  }
  return {
    headerFill: toArgb(theme?.headerFill, "4F46E5"), // indigo-600
    headerText: toArgb(theme?.headerText, "FFFFFF"),
    stripe: theme?.stripe === false ? false : toArgb(theme?.stripe, "F1F5F9"), // slate-100
    freezeHeader: theme?.freezeHeader ?? true,
    autoFilter: theme?.autoFilter ?? true,
    autoWidth: theme?.autoWidth ?? true,
    styled: true,
  }
}

/**
 * Cell style indices into `cellXfs` in {@link stylesXml}. Order matters — keep
 * the two lists in sync.
 */
const STYLE_HEADER = 1
const STYLE_STRIPE = 2

const stylesXml = (theme: ResolvedTheme): string =>
  XML_DECLARATION +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  `<font><b/><sz val="11"/><color rgb="${theme.headerText}"/><name val="Calibri"/></font>` +
  "</fonts>" +
  // Fill indices 0 (none) and 1 (gray125) are reserved by the spec.
  '<fills count="4">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  `<fill><patternFill patternType="solid"><fgColor rgb="${theme.headerFill}"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="${theme.stripe === false ? "FFF1F5F9" : theme.stripe}"/><bgColor indexed="64"/></patternFill></fill>` +
  "</fills>" +
  '<borders count="2">' +
  "<border><left/><right/><top/><bottom/><diagonal/></border>" +
  `<border><left/><right/><top/><bottom style="thin"><color rgb="${darkenArgb(theme.headerFill)}"/></bottom><diagonal/></border>` +
  "</borders>" +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="3">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  // STYLE_HEADER
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
  // STYLE_STRIPE
  '<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>' +
  "</cellXfs>" +
  "</styleSheet>"

/**
 * Approximate Excel column widths (in characters) from the longest content in
 * each column. Scans at most the first 1,000 rows so huge exports don't pay
 * for a second full pass.
 */
const columnWidths = (sheet: XlsxSheet): number[] => {
  const widths = sheet.headers.map((header) => header.length)
  const sample = sheet.rows.slice(0, 1000)
  for (const row of sample) {
    row.forEach((value, index) => {
      if (value == null) return
      const length = String(value).length
      if (length > (widths[index] ?? 0)) widths[index] = length
    })
  }
  // +3 leaves room for the header's filter dropdown arrow.
  return widths.map((w) => Math.min(Math.max(w + 3, 10), 60))
}

const cellXml = (ref: string, value: XlsxCell, styleId: number): string => {
  const s = styleId > 0 ? ` s="${styleId}"` : ""
  if (value == null || value === "") return `<c r="${ref}"${s}/>`
  if (typeof value === "number" && Number.isFinite(value))
    return `<c r="${ref}"${s}><v>${value}</v></c>`
  if (typeof value === "boolean")
    return `<c r="${ref}"${s} t="b"><v>${value ? 1 : 0}</v></c>`
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`
}

const rowXml = (
  rowNumber: number,
  cells: XlsxCell[],
  styleId: number,
  height?: number
): string => {
  const body = cells
    .map((value, col) =>
      cellXml(`${columnName(col)}${rowNumber}`, value, styleId)
    )
    .join("")
  const ht = height != null ? ` ht="${height}" customHeight="1"` : ""
  return `<row r="${rowNumber}"${ht}>${body}</row>`
}

const sheetXml = (sheet: XlsxSheet, theme: ResolvedTheme): string => {
  const rows = [
    rowXml(
      1,
      sheet.headers,
      theme.styled ? STYLE_HEADER : 0,
      theme.styled ? 22 : undefined
    ),
  ]
  sheet.rows.forEach((row, index) => {
    // Stripe every second data row (data starts on row 2 → stripe 3, 5, 7…).
    const striped = theme.styled && theme.stripe !== false && index % 2 === 1
    rows.push(rowXml(index + 2, row, striped ? STYLE_STRIPE : 0))
  })

  const lastColumn = columnName(Math.max(sheet.headers.length - 1, 0))
  const lastRow = sheet.rows.length + 1

  const sheetViews = theme.freezeHeader
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : ""
  const cols = theme.autoWidth
    ? `<cols>${columnWidths(sheet)
        .map(
          (width, index) =>
            `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
        )
        .join("")}</cols>`
    : ""
  const autoFilter =
    theme.autoFilter && sheet.headers.length > 0
      ? `<autoFilter ref="A1:${lastColumn}${lastRow}"/>`
      : ""

  return (
    XML_DECLARATION +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    sheetViews +
    cols +
    `<sheetData>${rows.join("")}</sheetData>` +
    autoFilter +
    "</worksheet>"
  )
}

const contentTypesXml = (): string =>
  XML_DECLARATION +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  "</Types>"

const rootRelsXml = (): string =>
  XML_DECLARATION +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  "</Relationships>"

const workbookXml = (sheetName: string): string =>
  XML_DECLARATION +
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
  "</workbook>"

const workbookRelsXml = (): string =>
  XML_DECLARATION +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  "</Relationships>"

/** Excel worksheet names cannot exceed 31 chars or contain `\ / ? * [ ] :`. */
const sanitizeSheetName = (name: string | undefined): string => {
  const cleaned = (name ?? "").replace(/[\\/?*[\]:]/g, " ").trim()
  return cleaned.length > 0 ? cleaned.slice(0, 31) : "Sheet1"
}

/**
 * Build a single-worksheet `.xlsx` workbook as raw bytes. Pure and
 * environment-agnostic — call {@link downloadXlsx} to also trigger a download.
 */
export const buildXlsx = (sheet: XlsxSheet): Uint8Array => {
  const theme = resolveTheme(sheet.theme)
  const encoder = new TextEncoder()
  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml()) },
    { name: "_rels/.rels", data: encoder.encode(rootRelsXml()) },
    {
      name: "xl/workbook.xml",
      data: encoder.encode(workbookXml(sanitizeSheetName(sheet.name))),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(workbookRelsXml()),
    },
    { name: "xl/styles.xml", data: encoder.encode(stylesXml(theme)) },
    {
      name: "xl/worksheets/sheet1.xml",
      data: encoder.encode(sheetXml(sheet, theme)),
    },
  ]
  return zipStore(entries)
}

/**
 * Timestamp suffix for an export filename, e.g. `2025-06-25-4-18-07-005`
 * (`year-month-day-hour-minute-second-millisecond`). The hour is not
 * zero-padded, matching the requested format.
 */
export const timestampForFilename = (date: Date = new Date()): string => {
  const pad = (value: number, length = 2): string =>
    String(value).padStart(length, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    date.getHours(),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
  ].join("-")
}

/**
 * Build a `.xlsx` workbook and trigger a browser download. `fileName` may omit
 * the `.xlsx` extension (it is appended when missing). No-op outside a DOM.
 */
export const downloadXlsx = (fileName: string, sheet: XlsxSheet): void => {
  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  )
    return
  const bytes = buildXlsx(sheet)
  // Copy into a concrete ArrayBuffer so the Blob part type is unambiguous.
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
