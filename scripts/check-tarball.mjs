#!/usr/bin/env node
/**
 * Tarball install smoke test — the check the fonts.css incident showed was
 * missing: every in-monorepo gate consumes the library as workspace *source*,
 * so a broken *published artifact* (a file missing from `files`, a bad
 * `publishConfig` export, a dependency that should have been transitive) ships
 * silently and is first discovered by a real consumer's clean install.
 *
 * This script exercises the actual publish artifact end to end:
 *
 *   1. `build:lib` → `pnpm pack` the library (publishConfig applied).
 *   2. Copy the fixture app in `tooling/tarball-check/template` to a temp dir
 *      and install the tarball into it with **npm** (a plain consumer, no
 *      workspace resolution).
 *   3. Assert the styling contract files shipped (globals.css + fonts.css).
 *   4. `vite build` the fixture — proves the exports map, compiled dist, and
 *      transitive deps resolve from a clean install.
 *   5. Assert the built CSS contains a library-only utility class — proves the
 *      stylesheet's dist-relative `@source` glob works from inside
 *      node_modules.
 *
 * Needs network access (the fixture installs react/vite/tailwind from the
 * registry). Run from the repo root: `node scripts/check-tarball.mjs`.
 */
import { execSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const uiDir = join(root, "packages", "ui")
const templateDir = join(root, "tooling", "tarball-check", "template")

const run = (command, cwd) => {
  console.log(`\n$ ${command}  (${cwd})`)
  execSync(command, { cwd, stdio: "inherit" })
}

const fail = (message) => {
  console.error(`\n✗ Tarball check failed: ${message}`)
  process.exit(1)
}

const workDir = mkdtempSync(join(tmpdir(), "smart-ui-tarball-"))
const appDir = join(workDir, "app")

try {
  // ── 1. Build + pack the publish artifact ─────────────────────────────────
  run("pnpm --filter @iamsaroj/smart-ui build:lib", root)
  run(`pnpm pack --pack-destination "${workDir}"`, uiDir)
  const tarball = readdirSync(workDir).find((f) => f.endsWith(".tgz"))
  if (!tarball) fail(`pnpm pack produced no .tgz in ${workDir}`)
  console.log(`\nPacked: ${tarball}`)

  // ── 2. Fixture app with the tarball as a file: dependency ────────────────
  cpSync(templateDir, appDir, { recursive: true })
  const pkgPath = join(appDir, "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  // A file: URL keeps npm happy with Windows paths.
  pkg.dependencies["@iamsaroj/smart-ui"] = `file:${join(workDir, tarball)}`
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

  run("npm install --no-audit --no-fund --loglevel=error", appDir)

  // ── 3. The styling contract shipped ──────────────────────────────────────
  const installed = join(appDir, "node_modules", "@iamsaroj", "smart-ui")
  for (const file of [
    join("src", "styles", "globals.css"),
    // Regression: 1.0.0's globals.css imported a fonts.css that `files`
    // didn't ship, breaking every clean install until a postinstall patch.
    join("src", "styles", "fonts.css"),
    join("dist", "form", "index.js"),
    join("dist", "form", "index.d.ts"),
  ]) {
    if (!existsSync(join(installed, file)))
      fail(`installed package is missing ${file}`)
  }

  // ── 4. A clean consumer build succeeds ───────────────────────────────────
  run("npm run build", appDir)

  // ── 5. The dist-relative @source glob worked from node_modules ───────────
  const assetsDir = join(appDir, "dist", "assets")
  const cssFile = readdirSync(assetsDir).find((f) => f.endsWith(".css"))
  if (!cssFile) fail("fixture build produced no CSS asset")
  const css = readFileSync(join(assetsDir, cssFile), "utf8")
  // A sidebar utility that only occurs in the library's own dist JS — if it
  // made it into the fixture CSS, Tailwind scanned the installed package.
  if (!css.includes("collapsible=icon"))
    fail(
      "built CSS lacks library-only classes — the dist @source glob did not scan the installed package"
    )

  console.log(
    `\n✓ Tarball check passed: ${tarball} installs, ships its styles, builds, and self-styles.`
  )
} finally {
  rmSync(workDir, { recursive: true, force: true, maxRetries: 3 })
}
