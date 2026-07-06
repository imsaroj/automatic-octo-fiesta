import { describe, expect, it } from "vitest"
import { buildXlsx, timestampForFilename } from "@/lib/xlsx"

/** Reference CRC-32 used to independently verify the writer's stored entries. */
const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Minimal reader for the *stored* ZIP the writer produces (no inflate needed). */
const readStoredZip = (buf: Uint8Array): Map<string, string> => {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const decoder = new TextDecoder()
  const entries = new Map<string, string>()
  let offset = 0
  while (
    offset + 4 <= buf.length &&
    view.getUint32(offset, true) === 0x04034b50
  ) {
    const crc = view.getUint32(offset + 14, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const name = decoder.decode(buf.subarray(nameStart, nameStart + nameLength))
    const dataStart = nameStart + nameLength + extraLength
    const data = buf.subarray(dataStart, dataStart + compressedSize)
    // Each stored entry's recorded CRC must match a freshly computed one.
    expect(crc32(data)).toBe(crc)
    entries.set(name, decoder.decode(data))
    offset = dataStart + compressedSize
  }
  return entries
}

describe("buildXlsx", () => {
  const bytes = buildXlsx({
    name: "Users",
    headers: ["Name", "MRR"],
    rows: [
      ["Ada Lovelace", 1200],
      ["Grace Hopper", 0],
      ["", undefined],
    ],
  })

  it("emits a ZIP archive (PK local-file-header signature)", () => {
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it("contains every required OOXML part with valid CRCs", () => {
    const entries = readStoredZip(bytes)
    for (const part of [
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/worksheets/sheet1.xml",
    ]) {
      expect(entries.has(part)).toBe(true)
    }
  })

  it("writes headers, string cells and numeric cells", () => {
    const sheet = readStoredZip(bytes).get("xl/worksheets/sheet1.xml") ?? ""
    expect(sheet).toContain('<t xml:space="preserve">Name</t>')
    expect(sheet).toContain('<t xml:space="preserve">Ada Lovelace</t>')
    // Numbers are numeric cells (no inline-string wrapper), including zero.
    expect(sheet).toContain("<v>1200</v>")
    expect(sheet).toContain("<v>0</v>")
  })

  it("names the worksheet tab from the sheet name", () => {
    const workbook = readStoredZip(bytes).get("xl/workbook.xml") ?? ""
    expect(workbook).toContain('name="Users"')
  })
})

describe("timestampForFilename", () => {
  it("formats year-month-day-hour-minute-second-millisecond (hour not padded)", () => {
    // Month is 0-based: 5 → June.
    expect(timestampForFilename(new Date(2025, 5, 25, 4, 18, 7, 5))).toBe(
      "2025-06-25-4-18-07-005"
    )
  })

  it("zero-pads minutes/seconds and uses 3 digits for milliseconds", () => {
    expect(timestampForFilename(new Date(2025, 11, 1, 13, 5, 9, 42))).toBe(
      "2025-12-01-13-05-09-042"
    )
  })
})
