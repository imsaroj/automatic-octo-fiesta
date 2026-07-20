import { expect, test } from "vitest"

import * as barrel from "./index"

/**
 * The aggregate barrel (I12c) must actually re-export the flat facades + the
 * sub-barrels (buttons, page, provider) so a single import spans them. Spot-check
 * a symbol from each area plus the I12g naming aliases; a missing `export *` line
 * regresses here rather than in a consumer.
 */
test("re-exports a representative symbol from each area", () => {
  const expected = [
    // provider
    "SmartUIProvider",
    // utility primitives (previously deep-path only)
    "SmartLoadingOverlay",
    "SmartSearchInput",
    "SmartSpinner",
    // data display + surfaces
    "SmartCard",
    "SmartDialog",
    "SmartSheet",
    // form controls
    "SmartInput",
    "SmartSelect",
    // buttons sub-barrel
    "ActionButton",
    "AddButton",
    "Can",
    // page sub-barrel
    "SmartPage",
    // I12g canonical alias
    "SmartDatePickerCalendar",
  ]
  for (const name of expected) {
    expect(barrel, `barrel is missing ${name}`).toHaveProperty(name)
  }
})
