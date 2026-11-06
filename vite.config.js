import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    base: "/ecommerce/"
    port: 5173,
    proxy: { "/api": "http://localhost:4000" },
  },
});
