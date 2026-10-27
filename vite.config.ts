import { defineConfig } from "vitest/config";

// 部署位置未定，用相对路径让产物放在任意子目录都能打开
export default defineConfig({
  root: "src/web",
  base: "./",
  build: { outDir: "../../dist", emptyOutDir: true },
  test: { root: ".", include: ["test/**/*.test.ts"] },
});
