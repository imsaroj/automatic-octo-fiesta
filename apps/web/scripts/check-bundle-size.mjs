// Bundle budget gate — run after `vite build` (wired into the `build` and
// `size` scripts; CI calls it as a named step). Fails the build when a chunk
// or the total JS payload regresses past the budgets below.
//
// Budgets are RAW (uncompressed) bytes, set 2026-07-08 at measured size +10%
// (see report.md, God Prompt 2). If you trip one deliberately (new feature,
// dependency upgrade), re-measure and bump the budget in the same PR with a
// one-line justification — don't bump blindly to make CI green.
import { readdirSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const assetsDir = fileURLToPath(new URL("../dist/assets", import.meta.url))

// Vendor chunks (named via manualChunks in vite.config.ts) get explicit
// ceilings; every other JS chunk must stay under the generic cap.
const VENDOR_BUDGETS = {
  "ag-grid": 1_025_000, // measured 929,262 after module slimming
  lexical: 435_000, // measured 395,152
  "react-vendor": 245_000, // measured 219,489
}
const NON_VENDOR_CHUNK_BUDGET = 300_000
const TOTAL_JS_BUDGET = 2_925_000 // measured 2,658,920 total

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

let files
try {
  files = readdirSync(assetsDir).filter((f) => f.endsWith(".js"))
} catch {
  console.error(
    `check-bundle-size: ${assetsDir} not found — run vite build first`
  )
  process.exit(1)
}
if (files.length === 0) {
  console.error("check-bundle-size: no JS chunks found — run vite build first")
  process.exit(1)
}

const vendorOf = (file) =>
  Object.keys(VENDOR_BUDGETS).find((name) => file.startsWith(`${name}-`))

let total = 0
const failures = []
for (const file of files) {
  const size = statSync(path.join(assetsDir, file)).size
  total += size
  const vendor = vendorOf(file)
  const budget = vendor ? VENDOR_BUDGETS[vendor] : NON_VENDOR_CHUNK_BUDGET
  if (size > budget) {
    failures.push(
      `${file}: ${kb(size)} exceeds the ${vendor ?? "non-vendor chunk"} budget of ${kb(budget)}`
    )
  }
}
if (total > TOTAL_JS_BUDGET) {
  failures.push(
    `total JS: ${kb(total)} across ${files.length} chunks exceeds the budget of ${kb(TOTAL_JS_BUDGET)}`
  )
}

if (failures.length > 0) {
  console.error("Bundle budget exceeded:")
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  console.error(
    "If this growth is intentional, re-measure and adjust the budgets in scripts/check-bundle-size.mjs."
  )
  process.exit(1)
}

console.log(
  `Bundle budget OK: ${files.length} JS chunks, total ${kb(total)} (budget ${kb(TOTAL_JS_BUDGET)})`
)
