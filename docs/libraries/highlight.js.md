# highlight.js

書いた時点のバージョン：11.12.0

## 何か

コードを言語の書き方で読み、キーワード・文字列・コメントなどに `hljs-*` のクラスを付けた HTML にするライブラリ。同期で動き、ブラウザがなくても使える。

- 公式：https://highlightjs.org/
- 使い方（API）：https://highlightjs.readthedocs.io/en/latest/api.html

## このプロジェクトで使っている部分

- `src/lib/highlight.ts` で、よく使う言語だけを入れた `highlight.js/lib/common` を読み込む
  - `getLanguage(言語)` で知っている言語かを確かめ、知っていれば `highlight(コード, { language, ignoreIllegals: true })` の `value`（HTML の文字列。中の文字は符号化済み）を、hast の `raw` ノードとして `code` の中に入れる
- 色はテーマの CSS を使わず、`src/components/note-body.css` で `hljs-*` のクラスにトークンの3色を当てる
