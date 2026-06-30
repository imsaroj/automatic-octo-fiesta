import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  getInitials,
  truncate,
} from "@/lib/format";

describe("formatNumber", () => {
  it("groups thousands (locale-tolerant)", () => {
    expect(formatNumber(1234567)).toMatch(/1\D234\D567/);
  });
});

describe("formatCurrency", () => {
  it("formats USD with explicit locale", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toBe("$1,234.50");
  });
});

describe("formatCompact", () => {
  it("returns a compact string", () => {
    const result = formatCompact(12500);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/12/);
  });
});

describe("formatPercent", () => {
  it("formats a ratio as a percentage", () => {
    expect(formatPercent(0.156, 1)).toMatch(/15.6/);
    expect(formatPercent(0.156, 1)).toContain("%");
  });
});

describe("truncate", () => {
  it("shortens long strings with an ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });
  it("leaves short strings unchanged", () => {
    expect(truncate("short", 10)).toBe("short");
  });
});

describe("getInitials", () => {
  it("builds initials from first and last names", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });
  it("handles a single name", () => {
    expect(getInitials("madonna")).toBe("M");
  });
  it("respects maxChars", () => {
    expect(getInitials("a b c d", 3)).toBe("ABC");
  });
  it("returns an empty string for blank input", () => {
    expect(getInitials("   ")).toBe("");
  });
});
