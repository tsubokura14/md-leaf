# eslint-plugin-better-tailwindcss

書いた時点のバージョン：4.11.0

## 何か

Tailwind CSS のクラスを ESLint で検査するプラグイン。クラスの並び順・重複・知らないクラスなどを見つける。Tailwind CSS v4 では、CSS の入口（`@theme` を読み込むファイル）を指定すると、そこにあるトークンからクラスを判断する。

- 公式：https://github.com/schoero/eslint-plugin-better-tailwindcss

## このプロジェクトで使っている部分

- `eslint.config.mjs` で、`src/` の `.ts`・`.tsx`（テストを除く）にだけかける
- 設定 `settings["better-tailwindcss"].entryPoint`：`src/app/globals.css`（ここからトークンファイルを読み込んでいる）
- 使っている規則は2つだけ（推奨の設定はまとめて入れていない）
  - `no-unknown-classes`：トークンにないクラス（`bg-red-500`、`text-3xl` など）を見つける
  - `no-restricted-classes`：`[` を含む任意の値のクラス（`p-[13px]` など）を止める
