import { defineConfig } from "vitest/config";

const unitTests = [
  "src/**/*.test.{ts,mts}",
  "scripts/**/*.test.{ts,mts,mjs}",
  ".claude/hooks/**/*.test.{ts,mts,mjs}",
];

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // ひな形の段階ではテストのファイルがないため、0 件でも成功にする
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: unitTests,
        },
      },
      {
        // 部品のテスト（.test.tsx）だけを、ブラウザに似せた jsdom で動かす
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
