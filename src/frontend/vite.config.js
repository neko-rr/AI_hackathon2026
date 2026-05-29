import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" で相対パス出力 → S3 静的ホスティングのサブパス配信でも崩れない
export default defineConfig({
  plugins: [react()],
  base: "./",
});
