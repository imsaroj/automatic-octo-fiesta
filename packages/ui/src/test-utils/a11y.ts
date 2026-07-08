import axe from "axe-core"
import { expect } from "vitest"

/**
 * Test helper: assert a rendered DOM subtree has **no** axe-core accessibility
 * violations. Import into jsdom render tests and `await` it against the mounted
 * container.
 *
 * jsdom has no layout engine, so rules that need computed geometry or painted
 * pixels can't run meaningfully here — `color-contrast` (needs canvas) and a few
 * viewport-dependent rules are disabled. Those are covered by the axe E2E pass
 * (`e2e/a11y.spec.ts`) which runs in a real browser. Everything structural
 * (labels, roles, names, ARIA validity, list/heading semantics) runs fully.
 *
 * @example
 * ```ts
 * mount(<SmartSelect ... />)
 * await expectNoA11yViolations(container)
 * ```
 */
export const expectNoA11yViolations = async (
  container: Element
): Promise<void> => {
  const results = await axe.run(container, {
    rules: {
      // Needs a canvas/paint pass jsdom doesn't provide — covered in E2E.
      "color-contrast": { enabled: false },
      // These sample the viewport/region layout, meaningless without layout.
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
    },
  })

  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => {
        const nodes = v.nodes.map((n) => `      ${n.html}`).join("\n")
        return `  • [${v.id}] ${v.help} (${v.nodes.length} node${
          v.nodes.length === 1 ? "" : "s"
        })\n    ${v.helpUrl}\n${nodes}`
      })
      .join("\n")
    // Surface a readable report instead of a giant object diff.
    expect(results.violations, `axe violations:\n${summary}`).toEqual([])
  }
}
