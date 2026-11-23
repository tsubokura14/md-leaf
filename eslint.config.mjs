import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";

// 文字列やテンプレートの中の、トークンにない値（色コードと px）
const HEX_COLOR = "/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/";
const PX_VALUE = "/\\b[0-9]*\\.?[0-9]+px\\b/";
const TOKEN_MESSAGE =
  "トークンにない値は使わない。src/styles/tokens.css のトークン（Tailwind のクラス）を使う";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      "better-tailwindcss": { entryPoint: "src/app/globals.css" },
    },
    rules: {
      // Tailwind のクラスではなく CSS に書いたクラス（tokens.css の .reading、kinari-md の body.css の .kinari-body、src/components/toc.css）
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: ["^reading$", "^kinari-body$", "^toc-sheet$", "^toc-side$"] },
      ],
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: "\\[",
              message: "任意の値のクラスは使わない。トークンにある段階のクラスを使う",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${HEX_COLOR}]`, message: TOKEN_MESSAGE },
        { selector: `Literal[value=${PX_VALUE}]`, message: TOKEN_MESSAGE },
        { selector: `TemplateElement[value.raw=${HEX_COLOR}]`, message: TOKEN_MESSAGE },
        { selector: `TemplateElement[value.raw=${PX_VALUE}]`, message: TOKEN_MESSAGE },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright が書き出すレポートと結果（生成物）
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
