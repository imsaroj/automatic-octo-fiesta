import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

// No React plugin needed for a build-only smoke: Vite's esbuild transforms
// TSX with the automatic JSX runtime out of the box.
export default defineConfig({
  plugins: [tailwindcss()],
})
