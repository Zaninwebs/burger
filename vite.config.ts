import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        speisekarte: resolve(import.meta.dirname, "speisekarte/index.html"),
        impressum: resolve(import.meta.dirname, "impressum/index.html"),
        datenschutz: resolve(import.meta.dirname, "datenschutz/index.html"),
      },
    },
  },
});
