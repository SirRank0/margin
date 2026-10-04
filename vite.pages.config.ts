import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Static export for https://sirrank0.github.io/margin/ — not used by the preview. */
export default defineConfig({
  base: "/margin/",
  plugins: [tailwindcss(), viteReact()],
  resolve: { tsconfigPaths: true },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    rollupOptions: { input: "pages.html" },
  },
});
