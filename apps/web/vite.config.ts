import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy, cache-stable vendor libraries into their own chunks
        // so route-level code splitting isn't undone by a single vendor bundle.
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("ag-grid")) return "ag-grid"
          if (/[\\/]node_modules[\\/](lexical|@lexical)[\\/]/.test(id))
            return "lexical"
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id
            )
          )
            return "react-vendor"
        },
      },
    },
  },
})
