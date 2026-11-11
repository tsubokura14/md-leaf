# KaTeX

書いた時点のバージョン：0.19.1

## 何か

TeX の書き方の数式を、HTML（と MathML）にするライブラリ。同期で動き、ブラウザがなくても HTML の文字列を作れる。見た目は、KaTeX の CSS とフォントで決まる。

- 公式：https://katex.org/
- オプション：https://katex.org/docs/options

## このプロジェクトで使っている部分

- `src/lib/math.ts` で、ビルドのときに `renderToString(式, { displayMode, throwOnError: true })` を呼ぶ。結果の HTML（中の文字は符号化済み）を hast の `raw` ノードとして入れる
  - `throwOnError: true` にして、書き方が間違っているときは例外を受け、書いたままの文字を出す
  - `trust` は既定の `false`（`\href` などでリンクや属性を作らせない）
- `src/components/note-body.tsx` で `katex/dist/katex.min.css` を読み込む（フォントも CSS から読まれる）。本文の中央に置く数式の横スクロールは `src/components/note-body.css` の `.katex-display`
- 型は katex に入っているもの（`katex/types/katex.d.ts`）を使う
