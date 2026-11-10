# Prettier

書いた時点のバージョン：3.9.10

## 何か

コードの書き方（改行、字下げ、引用符など）を決まった形にそろえる整形の道具。

- 公式：https://prettier.io/

## このプロジェクトで使っている部分

- `npm run format`：コード（`.ts .tsx .js .mjs .cjs .jsx .css .json`）だけを、まとめて整形する
- 編集したあとのフック（`.claude/hooks/format-on-edit.mjs`）が、編集したファイルだけに `--write` をかける
- `.prettierrc.json`
  - `printWidth: 100`：1行の長さ
  - `endOfLine: "auto"`：改行コードはファイルごとに今のものを残す（下の「改行コード」）
- `.prettierignore`：`package-lock.json`、`docs/`、テンプレートのファイル（`docs/template-files.md`）を外す。`.gitignore` にあるものは、Prettier が自動で外す
- ESLint とは別々に動かす（`eslint-config-prettier` などでつないでいない）

## 改行コード

- `core.autocrlf=true` の Windows では、取り出したファイルが CRLF になり、新しく作ったファイルは LF のまま、と混ざる。リポジトリの中では LF にそろう（`.gitattributes` で決めているのはシェルスクリプトだけ）
- そのため `endOfLine` を `lf` にせず `auto` にして、整形で改行コードだけの差分が出ないようにしている
