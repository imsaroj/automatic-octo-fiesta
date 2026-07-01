import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Block raw @workspace/ui/components/* imports in app code.
    // Import from @workspace/ui/smart-components/* instead.
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
              group: ["@workspace/ui/components/*"],
              message:
                'Import from "@workspace/ui/smart-components/*" instead of "@workspace/ui/components/*".',
            },
          ],
        },
      ],
    },
  },
])
