import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Lexical node modules colocate the decorator React component with the node
    // class, command, and helper exports by design. Fast Refresh's
    // component-only rule doesn't apply to these definition files.
    files: ["src/lexical-text-editor/nodes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Vendored shadcn/ui primitives (regenerable via `shadcn add`). Their a11y
    // semantics are owned upstream — the Label associates with a control at each
    // call site, and InputGroupAddon's click-to-focus is a purely additive
    // convenience for pointer users (keyboard users tab straight to the input).
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      // PaginationLink renders an <a> whose content is supplied via {...props}
      // at each call site (upstream shadcn pattern the rule can't see through).
      "jsx-a11y/anchor-has-content": "off",
    },
  },
  {
    // Lexical editor internals: the toolbar's inline block-rename field focuses
    // on open by design, and some editor surfaces are wired up imperatively by
    // Lexical rather than as native interactive elements.
    files: ["src/lexical-text-editor/**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-static-element-interactions": "off",
    },
  },
])
