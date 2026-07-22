import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const rawPort = env.PORT ?? "5173";
const port = Number(rawPort);
const basePath = env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@workspace/shared-api-zod": path.resolve(import.meta.dirname, "..", "..", "packages", "shared-api-zod", "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "127.0.0.1",
    strictPort: false,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: env.API_PROXY_TARGET ?? "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "127.0.0.1",
    allowedHosts: true,
  },
});
