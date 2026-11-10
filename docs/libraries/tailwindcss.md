# Tailwind CSS

書いた時点のバージョン：4.3.3（`@tailwindcss/turbopack` 4.3.3）

## 何か

`bg-bg`・`p-4` のようなクラスを HTML に書いて見た目を付ける CSS の道具。使ったクラスの CSS だけが作られる。v4 では、設定を JavaScript ではなく CSS の `@theme` に書く。

- 公式：https://tailwindcss.com/docs

## このプロジェクトで使っている部分

- `src/app/globals.css` の `@import "tailwindcss";` で読み込む
- `@tailwindcss/turbopack`：Next.js のビルド（Turbopack）で CSS を変換する。`next.config.ts` の `turbopack.rules` で指定している（PostCSS の設定ファイルは使わない）
