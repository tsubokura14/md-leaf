# mermaid

書いた時点のバージョン：12.3.0

## 何か

文字で書いた図の定義（流れ図・シーケンス図など）を、ブラウザで SVG に描くライブラリ。文字の大きさを測るので、ブラウザの中で動かす。

- 公式：https://mermaid.js.org/
- 使い方（API）：https://mermaid.js.org/config/usage.html
- 設定：https://mermaid.js.org/config/schema-docs/config.html
- テーマの値：https://mermaid.js.org/config/theming.html

## このプロジェクトで使っている部分

- `src/lib/highlight.ts` が、` ```mermaid ` のコードの `pre` に `data-mermaid` を付ける（ビルドのとき。mermaid は使わない）
- `src/components/mermaid.ts` で、`import("mermaid")` で読み込み（図のあるノートだけ）、`initialize` のあと `render(id, 定義)` で SVG の文字列を作る。書き方が間違っていれば `render` が例外を投げる
  - `startOnLoad: false`（ページを読んだときに自分で探して描かせない）、`securityLevel: "strict"`（既定）
  - `theme: "base"` と `themeVariables` に、トークン（`getComputedStyle` で読んだ値）を渡す
- `src/components/note-body-content.tsx` で、`pre` を SVG を入れた `div.mermaid-figure` に置き換える。mermaid は SVG を `width="100%"` ＋ `max-width`（もとの幅）で返すので、`max-width` の値を `width` にして、もとの大きさで描く
- 型は mermaid に入っているもの（`dist/mermaid.d.ts`）を使う
