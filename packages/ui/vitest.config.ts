import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@workspace/ui": resolve(__dirname, "src"),
    },
  },
})
