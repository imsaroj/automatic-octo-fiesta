#!/usr/bin/env node
/**
 * Validate the `@workspace/ui` `exports` map — the public API contract — against
 * the filesystem, so a renamed or deleted file can't silently break a subpath:
 *
 *  - concrete subpaths (barrels) must point at a file that exists **and**
 *    re-exports at least one symbol;
 *  - wildcard subpaths (`./lib/*`, `./components/*`, …) must point at a directory
 *    that exists;
 *  - asset subpaths (`.css`) must point at a file that exists.
 *
 * Run from the repo root: `node scripts/check-exports.mjs`.
 */
import { readFileSync, existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const uiRoot = join(root, "packages/ui")
const pkg = JSON.parse(readFileSync(join(uiRoot, "package.json"), "utf8"))
const exportsMap = pkg.exports ?? {}
const errors = []

for (const [subpath, targetRaw] of Object.entries(exportsMap)) {
  const target = String(targetRaw).replace(/^\.\//, "")

  if (target.includes("*")) {
    // Wildcard: the directory that holds the matched files must exist.
    const dir = join(uiRoot, dirname(target.slice(0, target.indexOf("*"))))
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      errors.push(
        `"${subpath}" → ${targetRaw}: directory ${dir} does not exist.`
      )
    }
    continue
  }

  const file = join(uiRoot, target)
  if (!existsSync(file)) {
    errors.push(`"${subpath}" → ${targetRaw}: file does not exist.`)
    continue
  }

  // Barrels / TS entrypoints must actually export something.
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    const src = readFileSync(file, "utf8")
    if (!/\bexport\b/.test(src)) {
      errors.push(
        `"${subpath}" → ${targetRaw}: file has no \`export\` statement.`
      )
    }
  }
}

if (errors.length > 0) {
  console.error("✗ exports-map check failed:\n")
  for (const err of errors) console.error(`  • ${err}`)
  process.exit(1)
}
console.log(
  `✓ exports map valid: ${Object.keys(exportsMap).length} subpaths resolve.`
)
