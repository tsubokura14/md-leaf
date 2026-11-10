# Vitest

書いた時点のバージョン：5.1.0

## 何か

Vite の仕組みで動くテストの道具。TypeScript をそのまま実行でき、Jest に近い書き方（`test`、`expect`）をする。

- 公式：https://vitest.dev/

## このプロジェクトで使っている部分

- `npm test` は `vitest run`（一度だけ実行し、ファイルの変更を見張らない）
- `vitest.config.mts`
  - `projects` で2つに分ける：`unit`（Node で動く `*.test.ts`・`*.test.mjs`）と `dom`（jsdom で動く `src/` の `*.test.tsx`）
  - `passWithNoTests`：テストのファイルがなくても成功にする
  - `resolve.tsconfigPaths`：`@/` の別名を `tsconfig.json` から読む
- `test` などは `vitest` から import して使う（グローバルにしていない）
