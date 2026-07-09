import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "public/mockServiceWorker.js"]),
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
    // Block raw @iamsaroj/smart-ui/components/* imports in app code.
    // Import from @iamsaroj/smart-ui/smart-components/* instead.
    // Exceptions: components/dashboard and components/settings use sidebar/
    // collapsible/dropdown-menu primitives that have no Smart equivalents.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/dashboard/**", "src/components/settings/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@iamsaroj/smart-ui/components/*"],
              message:
                'Import from "@iamsaroj/smart-ui/smart-components/*" instead of "@iamsaroj/smart-ui/components/*".',
            },
          ],
        },
      ],
    },
  },
])
