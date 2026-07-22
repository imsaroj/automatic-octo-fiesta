#!/usr/bin/env node
/**
 * Doc-consistency check (kept dumb and string-based — no doc framework):
 *
 *  1. Every **public domain** subpath in `packages/ui/package.json` `exports`
 *     must map to a guide that (a) exists in `docs/` and (b) is linked from
 *     `docs/README.md`. A new engine entrypoint therefore ships failing CI until
 *     it is documented. Primitive/asset subpaths (globals.css, lib/*,
 *     components/*, hooks/*) are exempt by an explicit allow-list.
 *  2. The doc code snippets in `docs/snippets.test-d.ts` must type-check
 *     (`tsc --noEmit` via `docs/tsconfig.json`).
 *
 * Run from the repo root: `node scripts/check-docs.mjs`.
 */
import { readFileSync, existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const errors = []

// ── 1. exports ↔ docs ────────────────────────────────────────────────────────
const pkg = JSON.parse(
  readFileSync(join(root, "packages/ui/package.json"), "utf8")
)
const exportKeys = Object.keys(pkg.exports ?? {})

// Subpaths that intentionally have no standalone guide (vendored primitives,
// hooks, pure utils, the stylesheet). Matched exactly or by `*` prefix.
const EXEMPT = ["./globals.css", "./lib/*", "./components/*", "./hooks/*"]

// Public domain entrypoint → the guide that documents it.
const DOC_FOR = {
  "./layout": "layout.md",
  "./form": "form.md",
  "./search": "search.md",
  "./data-grid": "data-grid.md",
  "./tree": "tree.md",
  "./transfer-list": "transfer-list.md",
  "./calendar": "calendar.md",
  "./text-editor": "text-editor.md",
  "./smart-components": "smart-components.md",
  "./smart-components/page": "smart-components.md",
  "./smart-components/buttons": "smart-components.md",
  "./smart-components/*": "smart-components.md",
}

const indexText = readFileSync(join(root, "docs/README.md"), "utf8")

for (const key of exportKeys) {
  if (EXEMPT.includes(key)) continue
  const doc = DOC_FOR[key]
  if (!doc) {
    errors.push(
      `exports subpath "${key}" has no docs mapping — add a guide and list it ` +
        `in docs/README.md, then map it in scripts/check-docs.mjs (or add it to ` +
        `the EXEMPT list with a reason).`
    )
    continue
  }
  if (!existsSync(join(root, "docs", doc))) {
    errors.push(`"${key}" maps to docs/${doc}, which does not exist.`)
  }
  if (!indexText.includes(`(./${doc})`)) {
    errors.push(`docs/${doc} (for "${key}") is not linked from docs/README.md.`)
  }
}

// ── 2. snippet type-check ─────────────────────────────────────────────────────
const tsc = join(root, "packages/ui/node_modules/typescript/bin/tsc")
try {
  execFileSync(
    process.execPath,
    [tsc, "-p", join(root, "docs/tsconfig.json"), "--noEmit"],
    { stdio: "pipe" }
  )
} catch (e) {
  const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim()
  errors.push(`docs/snippets.test-d.ts failed to type-check:\n${out}`)
}

// ── report ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error("✗ Doc-consistency check failed:\n")
  for (const err of errors) console.error(`  • ${err}\n`)
  process.exit(1)
}
console.log(
  `✓ Docs consistent: ${exportKeys.length} exports checked, snippets type-check.`
)
