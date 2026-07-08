import { describe, expect, it } from "vitest"
import { escapeCsvFormula } from "./formula-guard"

describe("escapeCsvFormula", () => {
  it("quotes the classic command-injection payload", () => {
    expect(escapeCsvFormula("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0")
  })

  it("quotes leading +, -, @ formula triggers", () => {
    expect(escapeCsvFormula("+1+1")).toBe("'+1+1")
    expect(escapeCsvFormula("-2+3")).toBe("'-2+3")
    expect(escapeCsvFormula("@SUM(1,1)")).toBe("'@SUM(1,1)")
  })

  it("quotes leading tab / carriage-return triggers", () => {
    expect(escapeCsvFormula("\t=1")).toBe("'\t=1")
    expect(escapeCsvFormula("\r=1")).toBe("'\r=1")
  })

  it("leaves safe strings untouched", () => {
    expect(escapeCsvFormula("hello")).toBe("hello")
    expect(escapeCsvFormula("a=b")).toBe("a=b") // trigger not leading
    expect(escapeCsvFormula("")).toBe("")
  })

  it("passes non-strings through unchanged", () => {
    expect(escapeCsvFormula(42)).toBe(42)
    expect(escapeCsvFormula(true)).toBe(true)
    expect(escapeCsvFormula(null)).toBe(null)
    expect(escapeCsvFormula(undefined)).toBe(undefined)
  })
})
