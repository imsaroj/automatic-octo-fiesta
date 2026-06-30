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
 */

/** A value that can be written to a worksheet cell. */
export type XlsxCell = string | number | boolean | null | undefined;

/** One worksheet's worth of tabular data. */
export interface XlsxSheet {
  /** Worksheet tab name. Default `"Sheet1"`. */
  name?: string;
  /** The header row. */
  headers: string[];
  /** Body rows, each aligned to `headers`. */
  rows: XlsxCell[][];
}

/* --------------------------------- CRC-32 --------------------------------- */

const CRC_TABLE = /* @__PURE__ */ (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ----------------------------- ZIP (stored) ------------------------------- */

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function pushU16(out: number[], value: number): void {
  out.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushU32(out: number[], value: number): void {
  out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function pushBytes(out: number[], bytes: Uint8Array): void {
  for (let i = 0; i < bytes.length; i += 1) out.push(bytes[i]);
}

/** Pack entries into a ZIP archive using stored (method 0 / no compression) entries. */
function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const local: number[] = [];
  const records: { nameBytes: Uint8Array; crc: number; size: number; offset: number }[] = [];

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const offset = local.length;
    pushU32(local, 0x04034b50); // local file header signature
    pushU16(local, 20); // version needed to extract
    pushU16(local, 0); // general purpose flags
    pushU16(local, 0); // compression method (0 = stored)
    pushU16(local, 0); // last mod time
    pushU16(local, 0); // last mod date
    pushU32(local, crc);
    pushU32(local, entry.data.length); // compressed size
    pushU32(local, entry.data.length); // uncompressed size
    pushU16(local, nameBytes.length);
    pushU16(local, 0); // extra field length
    pushBytes(local, nameBytes);
    pushBytes(local, entry.data);
    records.push({ nameBytes, crc, size: entry.data.length, offset });
  }

  const centralOffset = local.length;
  const central: number[] = [];
  for (const record of records) {
    pushU32(central, 0x02014b50); // central directory header signature
    pushU16(central, 20); // version made by
    pushU16(central, 20); // version needed to extract
    pushU16(central, 0); // general purpose flags
    pushU16(central, 0); // compression method
    pushU16(central, 0); // last mod time
    pushU16(central, 0); // last mod date
    pushU32(central, record.crc);
    pushU32(central, record.size); // compressed size
    pushU32(central, record.size); // uncompressed size
    pushU16(central, record.nameBytes.length);
    pushU16(central, 0); // extra field length
    pushU16(central, 0); // file comment length
    pushU16(central, 0); // disk number start
    pushU16(central, 0); // internal file attributes
    pushU32(central, 0); // external file attributes
    pushU32(central, record.offset); // relative offset of local header
    pushBytes(central, record.nameBytes);
  }

  const eocd: number[] = [];
  pushU32(eocd, 0x06054b50); // end of central directory signature
  pushU16(eocd, 0); // number of this disk
  pushU16(eocd, 0); // disk where central directory starts
  pushU16(eocd, records.length); // central directory records on this disk
  pushU16(eocd, records.length); // total central directory records
  pushU32(eocd, central.length); // size of central directory
  pushU32(eocd, centralOffset); // offset of central directory
  pushU16(eocd, 0); // comment length

  return Uint8Array.from(local.concat(central, eocd));
}

/* --------------------------------- OOXML ---------------------------------- */

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/**
 * Drop characters that are illegal in XML 1.0 (control chars below `0x20` other
 * than tab, LF and CR) so a stray control byte in the data can never corrupt the
 * workbook. Implemented as a char-code scan to avoid a control-char regex.
 */
function stripIllegalXmlChars(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    out += value[i];
  }
  return out;
}

function escapeXml(value: string): string {
  return stripIllegalXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0 → `A`, 25 → `Z`, 26 → `AA`, … (spreadsheet column letters). */
function columnName(index: number): string {
  let n = index;
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

function cellXml(ref: string, value: XlsxCell): string {
  if (value == null || value === "") return `<c r="${ref}"/>`;
  if (typeof value === "number" && Number.isFinite(value))
    return `<c r="${ref}"><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function rowXml(rowNumber: number, cells: XlsxCell[]): string {
  const body = cells.map((value, col) => cellXml(`${columnName(col)}${rowNumber}`, value)).join("");
  return `<row r="${rowNumber}">${body}</row>`;
}

function sheetXml(sheet: XlsxSheet): string {
  const rows = [rowXml(1, sheet.headers)];
  sheet.rows.forEach((row, index) => rows.push(rowXml(index + 2, row)));
  return (
    XML_DECLARATION +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rows.join("")}</sheetData>` +
    "</worksheet>"
  );
}

function contentTypesXml(): string {
  return (
    XML_DECLARATION +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    "</Types>"
  );
}

function rootRelsXml(): string {
  return (
    XML_DECLARATION +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>"
  );
}

function workbookXml(sheetName: string): string {
  return (
    XML_DECLARATION +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    "</workbook>"
  );
}

function workbookRelsXml(): string {
  return (
    XML_DECLARATION +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    "</Relationships>"
  );
}

/** Excel worksheet names cannot exceed 31 chars or contain `\ / ? * [ ] :`. */
function sanitizeSheetName(name: string | undefined): string {
  const cleaned = (name ?? "").replace(/[\\/?*[\]:]/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 31) : "Sheet1";
}

/**
 * Build a single-worksheet `.xlsx` workbook as raw bytes. Pure and
 * environment-agnostic — call {@link downloadXlsx} to also trigger a download.
 */
export function buildXlsx(sheet: XlsxSheet): Uint8Array {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml()) },
    { name: "_rels/.rels", data: encoder.encode(rootRelsXml()) },
    { name: "xl/workbook.xml", data: encoder.encode(workbookXml(sanitizeSheetName(sheet.name))) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRelsXml()) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(sheetXml(sheet)) },
  ];
  return zipStore(entries);
}

/**
 * Timestamp suffix for an export filename, e.g. `2025-06-25-4-18-07-005`
 * (`year-month-day-hour-minute-second-millisecond`). The hour is not
 * zero-padded, matching the requested format.
 */
export function timestampForFilename(date: Date = new Date()): string {
  const pad = (value: number, length = 2): string => String(value).padStart(length, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    date.getHours(),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
  ].join("-");
}

/**
 * Build a `.xlsx` workbook and trigger a browser download. `fileName` may omit
 * the `.xlsx` extension (it is appended when missing). No-op outside a DOM.
 */
export function downloadXlsx(fileName: string, sheet: XlsxSheet): void {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return;
  const bytes = buildXlsx(sheet);
  // Copy into a concrete ArrayBuffer so the Blob part type is unambiguous.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
