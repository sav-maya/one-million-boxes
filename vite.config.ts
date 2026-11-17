// Modified by sav-maya
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    // DEV_HOST=0.0.0.0 exposes the dev server on your LAN for phone testing.
    host: process.env.DEV_HOST || "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.local/**",
        "**/server/**",
        "**/scripts/**",
      ],
    },
    proxy: { "/api": `http://127.0.0.1:${process.env.API_PORT ?? "3001"}` },
  },
})
